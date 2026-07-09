import os
import json
import re
import PyPDF2
from openai import OpenAI
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Clean and Repair Utility Functions (Issue 10 & 11)
# --------------------------------------------------
def clean_repeated_words(text):
    if not isinstance(text, str):
        return text
    # Trim spaces
    text = text.strip()
    # Remove duplicate punctuation (e.g. ??, !!, ,,)
    text = re.sub(r'([!?.,])\1+', r'\1', text)
    # Remove consecutive duplicate words/phrases case-insensitively
    words = text.split()
    n = len(words)
    changed = True
    while changed:
        changed = False
        for sz in range(1, min(10, n // 2 + 1)):
            for i in range(n - 2 * sz + 1):
                phrase1 = words[i : i + sz]
                phrase2 = words[i + sz : i + 2 * sz]
                if [w.lower() for w in phrase1] == [w.lower() for w in phrase2]:
                    del words[i + sz : i + 2 * sz]
                    n = len(words)
                    changed = True
                    break
            if changed:
                break
    text = " ".join(words)
    # Fix capitalization: first letter capitalized
    if text and text[0].islower():
        text = text[0].upper() + text[1:]
    return text

def validate_question(q):
    # Ensure options are unique
    opt_texts = [opt.get("text", "").strip().lower() for opt in q.get("options", [])]
    if len(set(opt_texts)) < 4:
        return False
    # Ensure correct answer matches one of option ids
    opt_ids = [opt.get("id") for opt in q.get("options", [])]
    if q.get("correctAnswer") not in opt_ids:
        return False
    # Ensure no empty/incomplete options
    for opt in q.get("options", []):
        if not opt.get("text") or len(opt["text"].strip()) < 1:
            return False
    if not q.get("question") or not q.get("explanation"):
        return False
    return True

def repair_duplicate_options(q):
    opts = q.get("options", [])
    seen = set()
    duplicates_indices = []
    for idx, opt in enumerate(opts):
        t = opt.get("text", "").strip().lower()
        if t in seen or not t:
            duplicates_indices.append(idx)
        else:
            seen.add(t)
            
    if not duplicates_indices:
        return q # No duplicates
        
    backup_pool = ["None of the above", "All of the options", "Both A and B", "Neither A nor B"]
    for idx in duplicates_indices:
        for backup in backup_pool:
            if backup.lower() not in seen:
                opts[idx]["text"] = backup
                seen.add(backup.lower())
                break
    return q

# --------------------------------------------------
# Groq Quiz Generator Class
# --------------------------------------------------
class GroqQuizGenerator:
    def __init__(self, text, num_questions, difficulty, title, duration):
        self.text = text[:15000]
        try:
            self.num_questions = int(num_questions)
        except ValueError:
            self.num_questions = 10
        self.difficulty = difficulty
        self.title = title
        try:
            self.duration = int(duration)
        except ValueError:
            self.duration = self.num_questions

        import math
        self.passing_marks = math.ceil(self.num_questions / 2)
        self.total_marks = self.num_questions

    def regenerate_question(self, q, client):
        print(f"[REPAIR] Regenerating invalid question: {q.get('question', '')[:50]}...")
        prompt = f"""
        Generate a single replacement multiple choice question from the text:
        {self.text}

        Ensure the output is a single JSON object.
        Requirements:
        - 4 completely unique options (with option IDs: A, B, C, and D)
        - Exactly one correct answer
        - High quality educational standard
        - Detailed explanation

        Original failed question: {json.dumps(q)}
        """

        system_prompt = (
            "You are an expert quiz generator.\n"
            "Return ONLY a single valid JSON object representing one question and absolutely nothing else. Do not use markdown code fences.\n"
            "Schema:\n"
            "{\n"
            "  \"question\": \"Question text?\",\n"
            "  \"options\": [\n"
            "    { \"id\": \"A\", \"text\": \"Option A\" },\n"
            "    { \"id\": \"B\", \"text\": \"Option B\" },\n"
            "    { \"id\": \"C\", \"text\": \"Option C\" },\n"
            "    { \"id\": \"D\", \"text\": \"Option D\" }\n"
            "  ],\n"
            "  \"correctAnswer\": \"A\",\n"
            "  \"explanation\": \"Detailed explanation\"\n"
            "}"
        )

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                timeout=15.0
            )
            raw = response.choices[0].message.content.strip()
            if "```json" in raw:
                raw = raw.replace("```json", "").replace("```", "")
            elif "```" in raw:
                raw = raw.replace("```", "")
            start = raw.find("{")
            end = raw.rfind("}") + 1
            new_q = json.loads(raw[start:end])
            return new_q
        except Exception as e:
            print(f"[ERROR] Question regeneration failed: {e}. Returning original.")
            return q

    def generate_quiz(self):
        api_key = os.getenv("Groq_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("Groq_API_KEY is missing from environment variables.")

        api_key = api_key.strip().strip('"').strip("'")
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )

        prompt = f"""
        Generate a quiz from the following text with these settings:
        - Title: {self.title}
        - Requested Number of Questions: {self.num_questions}
        - Difficulty: {self.difficulty}
        - Duration: {self.duration} minutes
        - Passing Marks: {self.passing_marks}
        - Total Marks: {self.total_marks}
        
        Constraints:
        - You must generate EXACTLY {self.num_questions} questions in the "questions" array. No more, no less.
        - Each question must have exactly 4 options with option IDs: "A", "B", "C", and "D".
        
        TEXT TO GENERATE FROM:
        {self.text}
        """

        system_prompt = (
            "You are an expert educational quiz generator.\n"
            "Generate a professional multiple choice quiz based ONLY on the text provided.\n"
            "You must return ONLY a single valid JSON object representing the quiz, and absolutely nothing else. Do NOT wrap it in markdown code fences (like ```json ... ```), comments, or explain anything.\n"
            "\n"
            "The JSON object must follow this exact schema:\n"
            "{\n"
            "  \"title\": \"Quiz Title\",\n"
            "  \"description\": \"Description generated from text\",\n"
            "  \"totalQuestions\": <number of questions>,\n"
            "  \"totalMarks\": <sum of marks for all questions>,\n"
            "  \"passingMarks\": <marks required to pass>,\n"
            "  \"duration\": <duration in minutes>,\n"
            "  \"questions\": [\n"
            "    {\n"
            "      \"id\": 1,\n"
            "      \"questionNumber\": 1,\n"
            "      \"question\": \"Question text?\",\n"
            "      \"type\": \"single\",\n"
            "      \"marks\": 1,\n"
            "      \"difficulty\": \"<Difficulty: Easy, Medium, or Hard>\",\n"
            "      \"topic\": \"<Specific Topic name>\",\n"
            "      \"options\": [\n"
            "        { \"id\": \"A\", \"text\": \"Option A text\" },\n"
            "        { \"id\": \"B\", \"text\": \"Option B text\" },\n"
            "        { \"id\": \"C\", \"text\": \"Option C text\" },\n"
            "        { \"id\": \"D\", \"text\": \"Option D text\" }\n"
            "      ],\n"
            "      \"correctAnswer\": \"<One of: A, B, C, or D>\",\n"
            "      \"explanation\": \"Detailed explanation of why the correct option is correct.\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )

        def make_api_call():
            try:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    timeout=30.0
                )
            except Exception as conn_err:
                print(f"[ERROR] Groq API Connection/Timeout Error: {conn_err}")
                raise ValueError(f"Failed to communicate with Groq API: {conn_err}")

            raw = response.choices[0].message.content.strip()
            print("Groq Raw Response:", raw[:200], "...")
            
            # Clean up markdown if any
            if "```json" in raw:
                raw = raw.replace("```json", "").replace("```", "")
            elif "```" in raw:
                raw = raw.replace("```", "")
            raw = raw.strip()

            # Find the start and end of JSON object
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start == -1 or end == 0:
                raise ValueError("Model returned invalid JSON structure (no object found)")
            
            try:
                data = json.loads(raw[start:end])
            except json.JSONDecodeError as json_err:
                raise ValueError(f"JSON parsing error: {json_err}")

            # Enforce validation
            if not isinstance(data, dict):
                raise ValueError("Parsed JSON is not a dictionary/object")

            data["title"] = self.title
            data["totalQuestions"] = self.num_questions
            data["totalMarks"] = self.total_marks
            data["passingMarks"] = self.passing_marks
            data["duration"] = self.duration
            if "description" not in data:
                data["description"] = "Generated from uploaded PDF"

            questions = data.get("questions")
            if not isinstance(questions, list):
                raise ValueError("questions key must be a list")
            
            if len(questions) != self.num_questions:
                raise ValueError(f"Generated question count ({len(questions)}) does not match requested count ({self.num_questions})")
            
            for idx, q in enumerate(questions):
                # Clean text fields
                q["question"] = clean_repeated_words(q.get("question", ""))
                q["explanation"] = clean_repeated_words(q.get("explanation", ""))
                if "options" in q:
                    for opt in q["options"]:
                        if isinstance(opt, dict) and "text" in opt:
                            opt["text"] = clean_repeated_words(opt["text"])

                # Repair duplicate options programmatically
                q = repair_duplicate_options(q)

                # Validate, if validation fails, try to regenerate once
                if not validate_question(q):
                    q = self.regenerate_question(q, client)
                    # Clean the regenerated question too
                    q["question"] = clean_repeated_words(q.get("question", ""))
                    q["explanation"] = clean_repeated_words(q.get("explanation", ""))
                    if "options" in q:
                        for opt in q["options"]:
                            if isinstance(opt, dict) and "text" in opt:
                                opt["text"] = clean_repeated_words(opt["text"])
                    q = repair_duplicate_options(q)
                
                # Check option IDs mapping
                opts = q.get("options", [])
                for o_idx, opt in enumerate(opts):
                    if not isinstance(opt, dict) or "id" not in opt or "text" not in opt:
                        if isinstance(opt, str):
                            letter_id = chr(65 + o_idx)
                            opts[o_idx] = {"id": letter_id, "text": opt}
                        else:
                            raise ValueError(f"Question {idx+1} has invalid options format")

                # Re-validate correct answer mapping
                opt_ids = [opt["id"] for opt in opts]
                if q.get("correctAnswer") not in opt_ids:
                    found = False
                    for opt in opts:
                        if opt.get("text", "").strip().lower() == str(q.get("correctAnswer", "")).strip().lower():
                            q["correctAnswer"] = opt["id"]
                            found = True
                            break
                    if not found and opt_ids:
                        q["correctAnswer"] = opt_ids[0] # Safe fallback

                q["id"] = idx + 1
                q["questionNumber"] = idx + 1
                if "type" not in q:
                    q["type"] = "single"
                if "marks" not in q:
                    q["marks"] = 1
                if "difficulty" not in q:
                    q["difficulty"] = self.difficulty
                if "topic" not in q:
                    q["topic"] = "General"
                if "explanation" not in q:
                    q["explanation"] = f"The correct answer is {q['correctAnswer']}."

                questions[idx] = q

            return data

        # Retry once if invalid JSON
        try:
            return make_api_call()
        except Exception as e:
            print(f"[WARNING] First quiz generation attempt failed: {e}. Retrying once...")
            try:
                return make_api_call()
            except Exception as retry_err:
                print(f"[ERROR] Second attempt failed: {retry_err}")
                raise retry_err

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.route("/")
def home():
    return "Server is running!"

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz_from_pdf():
    print("Request received")

    # Verify key first
    if not (os.getenv("Groq_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")):
        return jsonify({"error": "Groq API key is not configured on the server"}), 500

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_file = request.files["file"]
    num_questions = request.form.get("num_questions", "10")
    difficulty = request.form.get("difficulty", "Medium")
    title = request.form.get("title", "Quiz")
    duration = request.form.get("duration", num_questions)

    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = "".join(page.extract_text() or "" for page in reader.pages)
        print("Extracted text length:", len(text))
    except Exception as e:
        return jsonify({"error": "Invalid PDF"}), 400

    if len(text.strip()) < 100:
        return jsonify({"error": "PDF too short"}), 400

    try:
        generator = GroqQuizGenerator(text, num_questions, difficulty, title, duration)
        quiz = generator.generate_quiz()
        return jsonify({"quiz": quiz})
    except ValueError as val_err:
        print("VAL ERROR:", val_err)
        return jsonify({"error": str(val_err)}), 500
    except Exception as e:
        print("FINAL ERROR:", e)
        return jsonify({"error": "Failed to generate quiz. Check server logs."}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Server running on port {port}")
    app.run(host="0.0.0.0", port=port)
import os
import json
import re
import datetime
import time
import logging
import PyPDF2
from openai import OpenAI

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# --------------------------------------------------
# Robust JSON Repair Utility
# --------------------------------------------------
def repair_json_string(raw_str):
    if not isinstance(raw_str, str):
        return raw_str
    
    raw_str = raw_str.strip()
    if "```json" in raw_str:
        raw_str = raw_str.split("```json")[-1]
    if "```" in raw_str:
        raw_str = raw_str.split("```")[0]
        
    raw_str = raw_str.strip()
    
    start = raw_str.find("{")
    end = raw_str.rfind("}") + 1
    if start == -1 or end <= 0:
        return raw_str
    
    content = raw_str[start:end]
    
    def escape_control_chars(match):
        s = match.group(0)
        s = s.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
        return s
    
    string_pattern = re.compile(r'"(?:[^"\\]|\\.)*"')
    content = string_pattern.sub(escape_control_chars, content)
    
    content = re.sub(r',\s*\}', '}', content)
    content = re.sub(r',\s*\]', ']', content)
    
    return content

# Load environment variables
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
        cleaned_text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        self.text = cleaned_text[:15000]
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
        logger.info(f"[REPAIR] Regenerating invalid question: {q.get('question', '')[:50]}...")
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
            clean_raw = repair_json_string(raw)
            new_q = json.loads(clean_raw)
            return new_q

        except Exception as e:
            logger.error(f"Question regeneration failed: {e}. Returning original.")
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

        def make_api_call(max_retries=3):
            import time
            attempt = 0
            base_delay = 2
            
            while attempt < max_retries:
                try:
                    response = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                        timeout=90.0
                    )
                    break
                except Exception as api_err:
                    err_msg = str(api_err).lower()
                    # Retry on rate limit (429) or server errors (5xx)
                    if "429" in err_msg or "too many requests" in err_msg or "500" in err_msg or "503" in err_msg or "502" in err_msg or "504" in err_msg or "timeout" in err_msg:
                        attempt += 1
                        if attempt >= max_retries:
                            raise ValueError(f"Failed to communicate with Groq API after {max_retries} attempts: {api_err}")
                        logger.info(f"Groq API attempt {attempt} failed: {api_err}. Retrying in {base_delay}s...")
                        time.sleep(base_delay)
                        base_delay *= 2
                    else:
                        logger.error(f"Groq API Error: {api_err}")
                        raise ValueError(f"Failed to communicate with Groq API: {api_err}")

            raw = response.choices[0].message.content.strip()
            logger.info(f"Groq Raw Response received (Length: {len(raw)} chars)")
            
            clean_raw = repair_json_string(raw)
            try:
                data = json.loads(clean_raw)
            except json.JSONDecodeError as json_err:
                raise ValueError(f"JSON parsing error: {json_err}. Raw: {raw[:200]}")


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
            logger.warning(f"First quiz generation attempt failed: {e}. Retrying once...")
            try:
                return make_api_call()
            except Exception as retry_err:
                logger.error(f"Second attempt failed: {retry_err}")
                raise retry_err

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.route("/")
def home():
    return "Server is running!"

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz_from_pdf():
    req_id = request.headers.get("X-Request-Id", "UNKNOWN")
    logger.info(f"[REQ {req_id}] Incoming request to /generate-quiz")
    start_time = time.time()
    timestamp = datetime.datetime.now().isoformat()

    # Verify key first
    if not (os.getenv("Groq_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")):
        return jsonify({
            "success": False,
            "message": "Groq API key is not configured on the server",
            "errorCode": "GROQ_KEY_MISSING",
            "details": "Please configure Groq_API_KEY in the python backend environment.",
            "timestamp": timestamp
        }), 500

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "No PDF uploaded",
            "errorCode": "NO_FILE",
            "details": "Request did not contain file attachment",
            "timestamp": timestamp
        }), 400

    pdf_file = request.files["file"]
    num_questions = request.form.get("num_questions", "10")
    difficulty = request.form.get("difficulty", "Medium")
    title = request.form.get("title", "Quiz")
    duration = request.form.get("duration", num_questions)

    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = "".join(page.extract_text() or "" for page in reader.pages)
        logger.info(f"[REQ {req_id}] PDF extracted: {len(reader.pages)} pages, {len(text)} characters")
    except Exception as e:
        logger.error(f"[REQ {req_id}] PDF extraction failed: {e}")
        return jsonify({
            "success": False,
            "message": "Unable to extract readable text from PDF.",
            "errorCode": "PDF_EXTRACTION_FAILED",
            "timestamp": timestamp
        }), 400

    if len(text.strip()) < 100:
        return jsonify({
            "success": False,
            "message": "Unable to extract readable text from PDF.",
            "errorCode": "PDF_EXTRACTION_FAILED",
            "timestamp": timestamp
        }), 400

    try:
        generator = GroqQuizGenerator(text, num_questions, difficulty, title, duration)
        quiz = generator.generate_quiz()
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(f"[REQ {req_id}] Quiz generated successfully in {duration_ms}ms")
        return jsonify({
            "success": True,
            "message": "Quiz generated successfully",
            "quiz": quiz,
            "timestamp": timestamp
        })
    except ValueError as val_err:
        logger.error(f"[REQ {req_id}] Quiz validation failed: {val_err}")
        return jsonify({
            "success": False,
            "message": "Quiz validation failed",
            "errorCode": "QUIZ_VALIDATION_FAILED",
            "details": str(val_err),
            "timestamp": timestamp
        }), 500
    except Exception as e:
        logger.error(f"[REQ {req_id}] Unexpected error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "message": "Failed to generate quiz due to an unexpected error",
            "errorCode": "LLM_GENERATION_FAILED",
            "details": str(e),
            "timestamp": timestamp
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    logger.info(f"Server starting on port {port}")
    app.run(host="0.0.0.0", port=port)
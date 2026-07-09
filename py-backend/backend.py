import os
import json
import re
import time
import uuid
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

# --------------------------------------------------
# CORS — explicitly allow all origins and relevant
# headers so Vercel frontend can call this endpoint
# (including multipart/form-data cross-origin uploads)
# --------------------------------------------------
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    supports_credentials=False,
)

# Maximum PDF size accepted: 10 MB
MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB


# --------------------------------------------------
# Structured error/success helpers
# --------------------------------------------------
def error_json(message, error_code, details=None, status=400):
    body = {
        "success": False,
        "error": message,
        "errorCode": error_code,
        "details": details or message,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    return jsonify(body), status


def success_json(data, message="OK"):
    body = {
        "success": True,
        "message": message,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    body.update(data)
    return jsonify(body), 200


# --------------------------------------------------
# Clean and Repair Utility Functions
# --------------------------------------------------
def clean_repeated_words(text):
    if not isinstance(text, str):
        return text
    text = text.strip()
    text = re.sub(r'([!?.,])\1+', r'\1', text)
    words = text.split()
    n = len(words)
    changed = True
    while changed:
        changed = False
        for sz in range(1, min(10, n // 2 + 1)):
            for i in range(n - 2 * sz + 1):
                phrase1 = words[i: i + sz]
                phrase2 = words[i + sz: i + 2 * sz]
                if [w.lower() for w in phrase1] == [w.lower() for w in phrase2]:
                    del words[i + sz: i + 2 * sz]
                    n = len(words)
                    changed = True
                    break
            if changed:
                break
    text = " ".join(words)
    if text and text[0].islower():
        text = text[0].upper() + text[1:]
    return text


def validate_question(q):
    """Return True only if the question is fully valid."""
    opts = q.get("options", [])
    if not isinstance(opts, list) or len(opts) < 4:
        return False
    opt_texts = [opt.get("text", "").strip().lower() for opt in opts]
    if len(set(opt_texts)) < 4:
        return False  # duplicate options
    opt_ids = [opt.get("id") for opt in opts]
    if q.get("correctAnswer") not in opt_ids:
        return False
    for opt in opts:
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
        return q

    backup_pool = [
        "None of the above",
        "All of the options",
        "Both A and B",
        "Neither A nor B",
        "Cannot be determined",
        "All of the above",
    ]
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
            self.num_questions = max(1, min(50, int(num_questions)))
        except (ValueError, TypeError):
            self.num_questions = 10
        self.difficulty = difficulty or "Medium"
        self.title = title or "Quiz"
        try:
            self.duration = max(1, int(duration))
        except (ValueError, TypeError):
            self.duration = self.num_questions

        import math
        self.passing_marks = math.ceil(self.num_questions / 2)
        self.total_marks = self.num_questions

    def regenerate_question(self, q, client):
        print(f"[REPAIR] Regenerating invalid question: {q.get('question', '')[:60]}...")
        prompt = (
            f"Generate a single replacement multiple choice question from the text:\n{self.text}\n\n"
            f"Ensure the output is a single JSON object.\n"
            f"Requirements:\n"
            f"- 4 completely unique options (with option IDs: A, B, C, and D)\n"
            f"- Exactly one correct answer\n"
            f"- High quality educational standard\n"
            f"- Detailed explanation\n\n"
            f"Original failed question: {json.dumps(q)}"
        )
        system_prompt = (
            "You are an expert quiz generator.\n"
            "Return ONLY a single valid JSON object representing one question and absolutely nothing else. "
            "Do not use markdown code fences.\n"
            'Schema:\n{\n  "question": "Question text?",\n'
            '  "options": [\n    { "id": "A", "text": "Option A" },\n'
            '    { "id": "B", "text": "Option B" },\n'
            '    { "id": "C", "text": "Option C" },\n'
            '    { "id": "D", "text": "Option D" }\n  ],\n'
            '  "correctAnswer": "A",\n'
            '  "explanation": "Detailed explanation"\n}'
        )
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                timeout=30.0,
            )
            raw = response.choices[0].message.content.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip()
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start == -1 or end == 0:
                raise ValueError("No JSON object found in response")
            new_q = json.loads(raw[start:end])
            return new_q
        except Exception as e:
            print(f"[ERROR] Question regeneration failed: {e}. Using original.")
            return q

    def generate_quiz(self):
        api_key = (
            os.getenv("Groq_API_KEY")
            or os.getenv("GROQ_API_KEY")
            or os.getenv("XAI_API_KEY")
        )
        if not api_key:
            raise ValueError(
                "Groq_API_KEY is missing from environment variables. "
                "Set it in the Render dashboard under Environment Variables."
            )

        api_key = api_key.strip().strip('"').strip("'")
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

        prompt = (
            f"Generate a quiz from the following text with these settings:\n"
            f"- Title: {self.title}\n"
            f"- Requested Number of Questions: {self.num_questions}\n"
            f"- Difficulty: {self.difficulty}\n"
            f"- Duration: {self.duration} minutes\n"
            f"- Passing Marks: {self.passing_marks}\n"
            f"- Total Marks: {self.total_marks}\n\n"
            f"Constraints:\n"
            f"- You must generate EXACTLY {self.num_questions} questions in the \"questions\" array. No more, no less.\n"
            f"- Each question must have exactly 4 options with option IDs: \"A\", \"B\", \"C\", and \"D\".\n\n"
            f"TEXT TO GENERATE FROM:\n{self.text}"
        )

        system_prompt = (
            "You are an expert educational quiz generator.\n"
            "Generate a professional multiple choice quiz based ONLY on the text provided.\n"
            "You must return ONLY a single valid JSON object representing the quiz, "
            "and absolutely nothing else. Do NOT wrap it in markdown code fences "
            "(like ```json ... ```), comments, or explain anything.\n\n"
            "The JSON object must follow this exact schema:\n"
            "{\n"
            '  "title": "Quiz Title",\n'
            '  "description": "Description generated from text",\n'
            '  "totalQuestions": <number of questions>,\n'
            '  "totalMarks": <sum of marks for all questions>,\n'
            '  "passingMarks": <marks required to pass>,\n'
            '  "duration": <duration in minutes>,\n'
            '  "questions": [\n'
            "    {\n"
            '      "id": 1,\n'
            '      "questionNumber": 1,\n'
            '      "question": "Question text?",\n'
            '      "type": "single",\n'
            '      "marks": 1,\n'
            '      "difficulty": "<Difficulty: Easy, Medium, or Hard>",\n'
            '      "topic": "<Specific Topic name>",\n'
            '      "options": [\n'
            '        { "id": "A", "text": "Option A text" },\n'
            '        { "id": "B", "text": "Option B text" },\n'
            '        { "id": "C", "text": "Option C text" },\n'
            '        { "id": "D", "text": "Option D text" }\n'
            "      ],\n"
            '      "correctAnswer": "<One of: A, B, C, or D>",\n'
            '      "explanation": "Detailed explanation of why the correct option is correct."\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        def make_api_call():
            t_start = time.time()
            try:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    timeout=90.0,
                )
            except Exception as conn_err:
                print(f"[ERROR] Groq API Connection/Timeout Error: {conn_err}")
                raise ValueError(f"Groq API communication failed: {conn_err}")

            elapsed = round(time.time() - t_start, 2)
            print(f"[GROQ] Response received in {elapsed}s")

            raw = response.choices[0].message.content.strip()
            print(f"[GROQ] Raw response preview: {raw[:200]}...")

            # Strip markdown fences if present
            raw = re.sub(r"```(?:json)?", "", raw).strip()
            if raw.endswith("```"):
                raw = raw[:-3].strip()

            # Extract JSON object
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start == -1 or end == 0:
                raise ValueError(
                    "Groq returned a response with no JSON object. "
                    f"Raw preview: {raw[:300]}"
                )

            try:
                data = json.loads(raw[start:end])
            except json.JSONDecodeError as json_err:
                raise ValueError(
                    f"JSON parsing failed: {json_err}. "
                    f"Raw preview: {raw[start:start+300]}"
                )

            if not isinstance(data, dict):
                raise ValueError("Parsed Groq response is not a JSON object/dictionary")

            # Override with user-supplied metadata
            data["title"] = self.title
            data["totalQuestions"] = self.num_questions
            data["totalMarks"] = self.total_marks
            data["passingMarks"] = self.passing_marks
            data["duration"] = self.duration
            if "description" not in data or not data["description"]:
                data["description"] = "Generated from uploaded PDF"

            questions = data.get("questions")
            if not isinstance(questions, list) or len(questions) == 0:
                raise ValueError(
                    "'questions' key is missing or empty in Groq's response"
                )

            if len(questions) != self.num_questions:
                print(
                    f"[WARNING] Groq returned {len(questions)} questions, "
                    f"expected {self.num_questions}. Trimming/padding..."
                )
                # Trim to requested count if too many
                if len(questions) > self.num_questions:
                    questions = questions[: self.num_questions]
                else:
                    # If too few, we'll still proceed (edge case)
                    pass

            for idx, q in enumerate(questions):
                # Clean text fields
                q["question"] = clean_repeated_words(q.get("question", ""))
                q["explanation"] = clean_repeated_words(q.get("explanation", ""))
                if "options" in q:
                    for opt in q["options"]:
                        if isinstance(opt, dict) and "text" in opt:
                            opt["text"] = clean_repeated_words(opt["text"])

                # Repair duplicate options
                q = repair_duplicate_options(q)

                # Validate; if invalid, regenerate once
                if not validate_question(q):
                    print(
                        f"[WARN] Question {idx+1} failed validation. Attempting regeneration..."
                    )
                    q = self.regenerate_question(q, client)
                    q["question"] = clean_repeated_words(q.get("question", ""))
                    q["explanation"] = clean_repeated_words(q.get("explanation", ""))
                    if "options" in q:
                        for opt in q["options"]:
                            if isinstance(opt, dict) and "text" in opt:
                                opt["text"] = clean_repeated_words(opt["text"])
                    q = repair_duplicate_options(q)

                # Normalize options format
                opts = q.get("options", [])
                for o_idx, opt in enumerate(opts):
                    if not isinstance(opt, dict) or "id" not in opt or "text" not in opt:
                        if isinstance(opt, str):
                            letter_id = chr(65 + o_idx)
                            opts[o_idx] = {"id": letter_id, "text": opt}
                        else:
                            raise ValueError(
                                f"Question {idx+1} has an invalid options format at index {o_idx}"
                            )

                # Re-validate correct answer mapping
                opt_ids = [opt["id"] for opt in opts if isinstance(opt, dict)]
                if q.get("correctAnswer") not in opt_ids:
                    found = False
                    for opt in opts:
                        if (
                            isinstance(opt, dict)
                            and opt.get("text", "").strip().lower()
                            == str(q.get("correctAnswer", "")).strip().lower()
                        ):
                            q["correctAnswer"] = opt["id"]
                            found = True
                            break
                    if not found and opt_ids:
                        print(
                            f"[WARN] Question {idx+1}: correctAnswer not in option IDs. "
                            f"Falling back to first option."
                        )
                        q["correctAnswer"] = opt_ids[0]

                # Assign numbering and defaults
                q["id"] = idx + 1
                q["questionNumber"] = idx + 1
                q.setdefault("type", "single")
                q.setdefault("marks", 1)
                q.setdefault("difficulty", self.difficulty)
                q.setdefault("topic", "General")
                if not q.get("explanation"):
                    q["explanation"] = f"The correct answer is {q['correctAnswer']}."

                questions[idx] = q

            data["questions"] = questions
            data["totalQuestions"] = len(questions)
            print(
                f"[SUCCESS] Quiz generated: {len(questions)} questions, "
                f"title='{data['title']}'"
            )
            return data

        # Retry once on failure
        try:
            return make_api_call()
        except Exception as e:
            print(f"[WARNING] First Groq attempt failed: {e}. Retrying...")
            try:
                return make_api_call()
            except Exception as retry_err:
                print(f"[ERROR] Both Groq attempts failed: {retry_err}")
                raise retry_err


# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.route("/")
def home():
    return jsonify({"status": "ok", "message": "StudySphere Python backend is running"}), 200


@app.route("/health")
def health():
    api_key_set = bool(
        os.getenv("Groq_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")
    )
    return jsonify({
        "status": "healthy",
        "groq_api_key_configured": api_key_set,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }), 200


@app.route("/generate-quiz", methods=["POST", "OPTIONS"])
def generate_quiz_from_pdf():
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    request_id = str(uuid.uuid4())[:8]
    t_request_start = time.time()
    print(f"\n[{request_id}] ===== Incoming /generate-quiz request =====")
    print(f"[{request_id}] Content-Type: {request.content_type}")
    print(f"[{request_id}] Files keys: {list(request.files.keys())}")
    print(f"[{request_id}] Form keys: {list(request.form.keys())}")

    # --- 1. Verify Groq API key is present ---
    api_key = (
        os.getenv("Groq_API_KEY")
        or os.getenv("GROQ_API_KEY")
        or os.getenv("XAI_API_KEY")
    )
    if not api_key:
        print(f"[{request_id}] ERROR: Groq API key not configured")
        return error_json(
            message="Groq API key is not configured on the server",
            error_code="MISSING_API_KEY",
            details="Set Groq_API_KEY in the Render environment variables dashboard",
            status=500,
        )

    # --- 2. Check file is present ---
    if "file" not in request.files:
        print(f"[{request_id}] ERROR: No file in request.files")
        return error_json(
            message="No PDF file uploaded",
            error_code="NO_FILE",
            details=(
                "The request must include a file field named 'file'. "
                "Ensure the form is sent as multipart/form-data with a valid boundary."
            ),
            status=400,
        )

    pdf_file = request.files["file"]

    if not pdf_file.filename:
        return error_json(
            message="Uploaded file has no filename",
            error_code="INVALID_FILE",
            status=400,
        )

    # --- 3. Validate PDF MIME type ---
    mime = pdf_file.mimetype or ""
    if "pdf" not in mime.lower() and not pdf_file.filename.lower().endswith(".pdf"):
        print(f"[{request_id}] ERROR: Invalid MIME type: {mime}")
        return error_json(
            message="Invalid file type. Only PDF files are accepted",
            error_code="INVALID_FILE_TYPE",
            details=f"Received MIME type: '{mime}'. Expected 'application/pdf'",
            status=400,
        )

    # --- 4. Check file size ---
    pdf_file.seek(0, 2)  # seek to end
    file_size = pdf_file.tell()
    pdf_file.seek(0)  # rewind
    print(f"[{request_id}] PDF size: {round(file_size / 1024, 1)} KB")

    if file_size > MAX_PDF_BYTES:
        return error_json(
            message="Uploaded PDF is too large. Maximum allowed size is 10 MB",
            error_code="FILE_TOO_LARGE",
            details=f"File size: {round(file_size / (1024*1024), 2)} MB",
            status=400,
        )

    # --- 5. Extract form fields ---
    num_questions = request.form.get("num_questions", "10")
    difficulty = request.form.get("difficulty", "Medium")
    title = request.form.get("title", "Quiz")
    duration = request.form.get("duration", num_questions)

    print(f"[{request_id}] Params: title='{title}', num_questions={num_questions}, "
          f"difficulty={difficulty}, duration={duration}")

    # --- 6. Extract text from PDF ---
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        extracted_pages = len(reader.pages)
        text = "".join(page.extract_text() or "" for page in reader.pages)
        print(f"[{request_id}] PDF pages: {extracted_pages}, extracted text length: {len(text)}")
    except Exception as e:
        print(f"[{request_id}] ERROR: PDF parsing failed: {e}")
        return error_json(
            message="Invalid or corrupted PDF file",
            error_code="INVALID_PDF",
            details=f"Could not read the PDF: {str(e)}",
            status=400,
        )

    text_stripped = text.strip()
    if len(text_stripped) < 100:
        print(f"[{request_id}] ERROR: Extracted text too short ({len(text_stripped)} chars)")
        if len(text_stripped) == 0:
            detail_msg = (
                "No text could be extracted from this PDF. "
                "This is likely a scanned/image-based PDF. "
                "Please use a text-based PDF or copy-paste your content into a text document."
            )
        else:
            detail_msg = (
                f"Only {len(text_stripped)} characters were extracted from the PDF. "
                "The document may be mostly images or empty. "
                "Please provide a PDF with more readable text content (minimum ~100 characters)."
            )
        return error_json(
            message="PDF contains insufficient readable text",
            error_code="INSUFFICIENT_TEXT",
            details=detail_msg,
            status=400,
        )

    # --- 7. Generate quiz via Groq ---
    try:
        generator = GroqQuizGenerator(text, num_questions, difficulty, title, duration)
        quiz = generator.generate_quiz()
        elapsed_total = round(time.time() - t_request_start, 2)
        print(f"[{request_id}] ===== Request completed in {elapsed_total}s =====\n")
        return success_json({"quiz": quiz}, message="Quiz generated successfully")
    except ValueError as val_err:
        print(f"[{request_id}] VALIDATION ERROR: {val_err}")
        return error_json(
            message="Quiz generation failed due to a validation error",
            error_code="QUIZ_VALIDATION_FAILED",
            details=str(val_err),
            status=500,
        )
    except Exception as e:
        print(f"[{request_id}] UNEXPECTED ERROR: {e}")
        return error_json(
            message="Quiz generation failed due to an unexpected server error",
            error_code="QUIZ_GENERATION_FAILED",
            details=str(e),
            status=500,
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"[STARTUP] StudySphere Python backend starting on port {port}")
    api_key_present = bool(
        os.getenv("Groq_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")
    )
    print(f"[STARTUP] Groq API key present: {api_key_present}")
    app.run(host="0.0.0.0", port=port, debug=False)
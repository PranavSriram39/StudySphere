import os
import json
import PyPDF2
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Gemini Quiz Generator Class
# --------------------------------------------------
class GeminiQuizGenerator:
    def __init__(self, text):
        self.text = text[:15000]

    def generate_quiz(self):
        # UPDATED: Using the specific models available to your key
        candidate_models = [
            "models/gemini-2.0-flash",
            "models/gemini-flash-latest",
            "models/gemini-pro-latest"
        ]

        last_exception = None

        prompt = f"""
        Return ONLY a valid JSON array. No markdown.
        Create 10 multiple choice questions from the text.
        Format:
        [
          {{
            "question": "Q",
            "options": ["A", "B", "C", "D"],
            "answer": "A"
          }}
        ]
        
        TEXT:
        {self.text}
        """

        # Loop through your available models
        for model_name in candidate_models:
            print(f"🔄 Trying model: {model_name}...")
            try:
                model = genai.GenerativeModel(model_name)
                
                # Try to generate
                response = model.generate_content(prompt)
                
                # If we get here, the model worked! Process the JSON.
                raw = response.text.strip()
                print(f"✅ Success with {model_name}!")
                
                # Cleanup markdown
                if "```json" in raw:
                    raw = raw.replace("```json", "").replace("```", "")
                elif "```" in raw:
                    raw = raw.replace("```", "")
                
                raw = raw.strip()
                
                # Extract JSON array
                start = raw.find("[")
                end = raw.rfind("]") + 1
                if start == -1 or end == 0:
                    raise ValueError("Model returned invalid JSON structure")

                return json.loads(raw[start:end])

            except Exception as e:
                print(f"⚠️ Failed with {model_name}: {e}")
                last_exception = e
                continue

        print("❌ All models failed.")
        raise last_exception

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.route("/")
def home():
    return "Server is running!"

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz_from_pdf():
    print("🔥 Request received")

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_file = request.files["file"]

    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = "".join(page.extract_text() or "" for page in reader.pages)
        print("📄 Extracted text length:", len(text))
    except Exception as e:
        return jsonify({"error": "Invalid PDF"}), 400

    if len(text.strip()) < 100:
        return jsonify({"error": "PDF too short"}), 400

    try:
        generator = GeminiQuizGenerator(text)
        quiz = generator.generate_quiz()
        return jsonify({"quiz": quiz})
    except Exception as e:
        print("❌ FINAL ERROR:", e)
        return jsonify({"error": "Failed to generate quiz. Check server logs."}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"🚀 Server running on port {port}")
    app.run(host="0.0.0.0", port=port)
    
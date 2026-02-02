import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Error: GEMINI_API_KEY is missing from .env file")
else:
    genai.configure(api_key=api_key)
    print(f"✅ Key found: {api_key[:5]}...*****")
    print("🔍 Listing available models for this key...")
    
    try:
        found_any = False
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"   👉 {m.name}")
                found_any = True
        
        if not found_any:
            print("⚠️ No content generation models found. Check your API Key permissions.")
    except Exception as e:
        print(f"❌ Error listing models: {e}")
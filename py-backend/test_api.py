import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("Groq_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("XAI_API_KEY")

if not api_key:
    print("[ERROR] Groq_API_KEY / GROQ_API_KEY / XAI_API_KEY is missing from .env file")
else:
    api_key = api_key.strip().strip('"').strip("'")
    print(f"Key found: {api_key[:5]}...*****")
    print("Testing connection to Groq API...")
    
    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        
        models = client.models.list()
        print("Models list retrieval successful!")
        for m in models.data:
            print(f" - {m.id}")
            
    except Exception as e:
        print(f"Error communicating with Groq: {e}")
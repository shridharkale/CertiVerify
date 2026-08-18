"""
utils/duplicate_checker.py
--------------------------
FIXED: Switched from deprecated google.generativeai → new google.genai package
"""
import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

# ✅ New way to initialize client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def check_duplicates_with_llm(participants):
    """
    Uses Gemini 2.0 Flash to scan participant list for:
    - Duplicate names (even with slight spelling differences)
    - Suspicious entries (fake-looking names, test entries)

    participants: list of dicts with name, email, role
    Returns: dict with duplicates, suspicious, summary
    """

    if not participants:
        return {"duplicates": [], "suspicious": [], "summary": "No participants to check"}

    # Format participants for Gemini
    participant_text = "\n".join([
        f"{i+1}. Name: {p['name']}, Email: {p['email']}, Role: {p.get('role', 'N/A')}"
        for i, p in enumerate(participants)
    ])

    prompt = f"""
You are a certificate fraud detection assistant.

Analyze this list of certificate recipients and identify:
1. DUPLICATES: Same person appearing multiple times (even with slight name variations like "Alice" vs "alice johnson", or same email)
2. SUSPICIOUS: Fake-looking entries like "test", "asdf", "xxx", "123", random characters, or clearly fake names

Participant List:
{participant_text}

Respond in this exact JSON format only, no extra text:
{{
  "duplicates": [
    {{"name": "...", "email": "...", "reason": "..."}}
  ],
  "suspicious": [
    {{"name": "...", "email": "...", "reason": "..."}}
  ],
  "summary": "Brief summary of findings"
}}

If no duplicates or suspicious entries found, return empty lists.
"""

    try:
        # ✅ New way to call Gemini API
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        text = response.text.strip()

        # Clean markdown fences if Gemini wraps response in them
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)
        print(f"[DEBUG] LLM duplicate check result: {result}")
        return result

    except Exception as e:
        print(f"[ERROR] Gemini check failed: {e}")
        # Returns empty — certificates.py will use pandas fallback automatically
        return {
            "duplicates": [],
            "suspicious": [],
            "summary": f"LLM check failed: {str(e)}"
        }
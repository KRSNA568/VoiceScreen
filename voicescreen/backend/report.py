import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_report(transcript: str, candidate_name: str, role: str, questions: list[str]) -> dict:
    questions_block = "\n".join(f"- {q}" for q in questions)

    prompt = f"""You are an expert HR analyst. Analyze this voice screening interview transcript.

Candidate: {candidate_name}
Role: {role}
Questions asked:
{questions_block}

Transcript:
{transcript}

Return ONLY valid JSON with these exact fields:
- executive_summary: string (3 sentences max)
- scores: object with keys communication, relevance, confidence (each integer 1-10)
- question_breakdown: array of objects each with: question, candidate_answer,
  quality (Excellent/Good/Fair/Poor), notes
- red_flags: array of strings
- green_flags: array of strings
- hire_recommendation: exactly one of: Strong Yes, Yes, Maybe, No
- recommendation_reasoning: string (2-3 sentences)"""

    completion = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an expert HR analyst that returns only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = completion.choices[0].message.content
    return json.loads(content)

import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_questions(role: str, job_description: str) -> list[str]:
    user_prompt = f"""Based on the following job description for a {role} role, generate exactly
10 smart, relevant screening interview questions. These will be asked by a
voice AI agent over a phone call, so questions must be:
- Clear and conversational (not too technical or jargon-heavy)
- Open-ended (not yes/no)
- Covering: relevant experience, technical skills, behavioral aspects,
  motivation, and culture fit
- Varied in type — do not ask similar questions twice

Job Description:
{job_description}

Return ONLY a JSON object with this exact format:
{{"questions": ["question 1", "question 2", ..., "question 10"]}}
No preamble, no markdown, no explanation."""

    completion = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.5,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an expert HR recruiter and technical interviewer. You return only valid JSON."},
            {"role": "user", "content": user_prompt},
        ],
    )

    data = json.loads(completion.choices[0].message.content)
    questions = data.get("questions", [])
    if not isinstance(questions, list) or len(questions) == 0:
        raise ValueError("Invalid response from question generator")
    return questions[:10]

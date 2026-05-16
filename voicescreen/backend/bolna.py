import os
import httpx
from dotenv import load_dotenv

load_dotenv()

BOLNA_API_KEY = os.getenv("BOLNA_API_KEY")
BOLNA_AGENT_ID = os.getenv("BOLNA_AGENT_ID")
BOLNA_URL = "https://api.bolna.ai/call"


def initiate_call(candidate_name: str, candidate_phone: str, role: str, selected_questions: list[str]) -> str:
    def q(i):
        return selected_questions[i] if len(selected_questions) > i else ""

    payload = {
        "agent_id": BOLNA_AGENT_ID,
        "recipient_phone_number": candidate_phone,
        "user_data": {
            "candidate_name": candidate_name,
            "role": role,
            "question_1": q(0),
            "question_2": q(1),
            "question_3": q(2),
            "question_4": q(3),
            "question_5": q(4),
        },
    }

    headers = {
        "Authorization": f"Bearer {BOLNA_API_KEY}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(BOLNA_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    execution_id = (
        data.get("execution_id")
        or data.get("id")
        or data.get("call_id")
    )
    if not execution_id:
        raise ValueError(f"Bolna response missing execution id: {data}")
    return str(execution_id)

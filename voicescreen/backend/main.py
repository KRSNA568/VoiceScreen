from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

import database
import bolna
import questions as questions_mod
import report as report_mod
from models import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    InitiateCallRequest,
    PendingCandidateRequest,
    RoleRequest,
)

app = FastAPI(title="VoiceScreen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate-questions", response_model=GenerateQuestionsResponse)
def generate_questions_endpoint(req: GenerateQuestionsRequest):
    try:
        qs = questions_mod.generate_questions(req.role, req.job_description)
        return GenerateQuestionsResponse(questions=qs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {e}")


@app.post("/api/initiate-call")
def initiate_call_endpoint(req: InitiateCallRequest):
    try:
        execution_id = bolna.initiate_call(
            req.candidate_name,
            req.candidate_phone,
            req.role,
            req.selected_questions,
        )
        database.save_call(
            execution_id=execution_id,
            candidate_name=req.candidate_name,
            candidate_phone=req.candidate_phone,
            role=req.role,
            job_description=req.job_description,
            questions=req.selected_questions,
            status="queued",
        )
        return {"execution_id": execution_id, "status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {e}")


@app.get("/api/call-status/{execution_id}")
def get_call_status(execution_id: str):
    call = database.get_call(execution_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return {
        "execution_id": execution_id,
        "status": call["status"],
        "candidate_name": call["candidate_name"],
        "role": call["role"],
    }


@app.get("/api/report/{execution_id}")
def get_report(execution_id: str):
    report = database.get_report(execution_id)
    if report:
        return {"status": "ready", "report": report}
    return {"status": "pending"}


@app.post("/api/webhook/call-complete")
async def webhook_call_complete(request: Request):
    body = await request.json()
    execution_id = body.get("id") or body.get("execution_id")
    transcript = body.get("transcript", "")
    status = body.get("status", "")

    if status != "completed":
        return {"status": "skipped"}

    if not execution_id:
        raise HTTPException(status_code=400, detail="Missing execution id")

    call = database.get_call(execution_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    report = report_mod.generate_report(
        transcript=transcript,
        candidate_name=call["candidate_name"],
        role=call["role"],
        questions=call["questions"],
    )
    database.save_report(execution_id, report)
    database.update_call_status(execution_id, "completed")
    return {"status": "report_generated"}


@app.get("/api/calls")
def list_calls():
    return {"calls": database.list_calls()}


@app.get("/api/stats")
def get_stats():
    return database.get_stats()


@app.get("/api/pending-candidates")
def list_pending():
    return {"candidates": database.list_pending_candidates()}


@app.post("/api/pending-candidates")
def add_pending(req: PendingCandidateRequest):
    pid = database.add_pending_candidate(
        req.candidate_name, req.candidate_phone, req.role,
        req.job_description, req.source or "manual"
    )
    return {"id": pid}


@app.delete("/api/pending-candidates/{pending_id}")
def remove_pending(pending_id: int):
    database.delete_pending_candidate(pending_id)
    return {"status": "deleted"}


@app.post("/api/pending-candidates/sync-google-form")
def sync_google_form():
    # Prototype: seed a few fake candidates as if pulled from a Google Form
    samples = [
        ("Aarav Mehta", "+919812345001", "Software Development Engineer",
         "Fresher SDE role for a Bengaluru-based fintech startup. Strong CS fundamentals, Python or Java, basic web stack. CTC 12-16 LPA."),
        ("Diya Kapoor", "+919812345002", "Frontend Engineer",
         "React + TypeScript role for a Series A SaaS company. 1-3 yrs experience preferred. Strong CSS and component architecture skills."),
        ("Rohan Iyer", "+919812345003", "Product Manager Intern",
         "6-month PM internship for a consumer health app. Looking for strong user empathy, SQL skills, and clear written communication."),
    ]
    added = 0
    for name, phone, role, jd in samples:
        database.add_pending_candidate(name, phone, role, jd, source="google_form")
        added += 1
    return {"status": "synced", "added": added}


@app.get("/api/roles")
def list_roles():
    return {"roles": database.list_roles()}


@app.post("/api/roles")
def create_role(req: RoleRequest):
    try:
        rid = database.add_role(req.name.strip(), req.job_description)
        return {"id": rid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not create role: {e}")


@app.get("/api/roles/{role_id}")
def get_role(role_id: int):
    role = database.get_role(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@app.delete("/api/roles/{role_id}")
def delete_role(role_id: int):
    database.delete_role(role_id)
    return {"status": "deleted"}


@app.get("/")
def root():
    return {"service": "VoiceScreen", "status": "ok"}

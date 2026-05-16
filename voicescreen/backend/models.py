from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class GenerateQuestionsRequest(BaseModel):
    role: str
    job_description: str


class GenerateQuestionsResponse(BaseModel):
    questions: List[str]


class InitiateCallRequest(BaseModel):
    candidate_name: str
    candidate_phone: str
    role: str
    job_description: str
    selected_questions: List[str] = Field(..., min_length=3, max_length=5)


class RoleRequest(BaseModel):
    name: str
    job_description: str


class PendingCandidateRequest(BaseModel):
    candidate_name: str
    candidate_phone: str
    role: str
    job_description: str
    source: Optional[str] = "manual"


class CallRecord(BaseModel):
    execution_id: str
    candidate_name: str
    candidate_phone: str
    role: str
    job_description: str
    questions: str
    status: str
    created_at: str


class QuestionBreakdown(BaseModel):
    question: str
    candidate_answer: str
    quality: str
    notes: str


class Report(BaseModel):
    executive_summary: str
    scores: Dict[str, int]
    question_breakdown: List[QuestionBreakdown]
    red_flags: List[str]
    green_flags: List[str]
    hire_recommendation: str
    recommendation_reasoning: str

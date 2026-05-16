import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "voicescreen.db"


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS calls (
                execution_id TEXT PRIMARY KEY,
                candidate_name TEXT NOT NULL,
                candidate_phone TEXT NOT NULL,
                role TEXT NOT NULL,
                job_description TEXT NOT NULL,
                questions TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                execution_id TEXT PRIMARY KEY,
                report_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (execution_id) REFERENCES calls(execution_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                job_description TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS pending_candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_name TEXT NOT NULL,
                candidate_phone TEXT NOT NULL,
                role TEXT NOT NULL,
                job_description TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'manual',
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()


def save_call(execution_id, candidate_name, candidate_phone, role, job_description, questions, status="queued"):
    with _conn() as conn:
        conn.execute(
            """INSERT INTO calls (execution_id, candidate_name, candidate_phone, role,
               job_description, questions, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (execution_id, candidate_name, candidate_phone, role, job_description,
             json.dumps(questions), status, datetime.utcnow().isoformat())
        )
        conn.commit()


def get_call(execution_id):
    with _conn() as conn:
        row = conn.execute("SELECT * FROM calls WHERE execution_id = ?", (execution_id,)).fetchone()
        if not row:
            return None
        data = dict(row)
        data["questions"] = json.loads(data["questions"])
        return data


def update_call_status(execution_id, status):
    with _conn() as conn:
        conn.execute("UPDATE calls SET status = ? WHERE execution_id = ?", (status, execution_id))
        conn.commit()


def save_report(execution_id, report):
    with _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO reports (execution_id, report_json, created_at)
               VALUES (?, ?, ?)""",
            (execution_id, json.dumps(report), datetime.utcnow().isoformat())
        )
        conn.commit()


def get_report(execution_id):
    with _conn() as conn:
        row = conn.execute("SELECT report_json FROM reports WHERE execution_id = ?", (execution_id,)).fetchone()
        if not row:
            return None
        return json.loads(row["report_json"])


def list_calls():
    with _conn() as conn:
        rows = conn.execute("""
            SELECT c.execution_id, c.candidate_name, c.candidate_phone, c.role,
                   c.status, c.created_at, r.report_json
            FROM calls c
            LEFT JOIN reports r ON c.execution_id = r.execution_id
            ORDER BY c.created_at DESC
        """).fetchall()
        results = []
        for row in rows:
            d = dict(row)
            report_json = d.pop("report_json")
            report = json.loads(report_json) if report_json else None
            d["hire_recommendation"] = report.get("hire_recommendation") if report else None
            d["scores"] = report.get("scores") if report else None
            results.append(d)
        return results


def get_stats():
    with _conn() as conn:
        total = conn.execute("SELECT COUNT(*) AS c FROM calls").fetchone()["c"]
        completed = conn.execute("SELECT COUNT(*) AS c FROM calls WHERE status = 'completed'").fetchone()["c"]
        today = conn.execute(
            "SELECT COUNT(*) AS c FROM calls WHERE date(created_at) = date('now')"
        ).fetchone()["c"]
        pending = conn.execute("SELECT COUNT(*) AS c FROM pending_candidates").fetchone()["c"]

        reco_rows = conn.execute("SELECT report_json FROM reports").fetchall()
        reco_counts = {"Strong Yes": 0, "Yes": 0, "Maybe": 0, "No": 0}
        for r in reco_rows:
            try:
                rec = json.loads(r["report_json"]).get("hire_recommendation")
                if rec in reco_counts:
                    reco_counts[rec] += 1
            except Exception:
                pass

        return {
            "total_screenings": total,
            "completed": completed,
            "today": today,
            "pending_candidates": pending,
            "recommendations": reco_counts,
        }


def add_pending_candidate(candidate_name, candidate_phone, role, job_description, source="manual"):
    with _conn() as conn:
        cur = conn.execute(
            """INSERT INTO pending_candidates
               (candidate_name, candidate_phone, role, job_description, source, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (candidate_name, candidate_phone, role, job_description, source,
             datetime.utcnow().isoformat())
        )
        conn.commit()
        return cur.lastrowid


def list_pending_candidates():
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM pending_candidates ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def get_pending_candidate(pending_id):
    with _conn() as conn:
        row = conn.execute(
            "SELECT * FROM pending_candidates WHERE id = ?", (pending_id,)
        ).fetchone()
        return dict(row) if row else None


def delete_pending_candidate(pending_id):
    with _conn() as conn:
        conn.execute("DELETE FROM pending_candidates WHERE id = ?", (pending_id,))
        conn.commit()


def add_role(name, job_description):
    with _conn() as conn:
        cur = conn.execute(
            """INSERT INTO roles (name, job_description, created_at) VALUES (?, ?, ?)""",
            (name, job_description, datetime.utcnow().isoformat())
        )
        conn.commit()
        return cur.lastrowid


def list_roles():
    with _conn() as conn:
        rows = conn.execute("""
            SELECT r.id, r.name, r.job_description, r.created_at,
                   COALESCE(c.cnt, 0) AS application_count
            FROM roles r
            LEFT JOIN (
                SELECT LOWER(role) AS rl, COUNT(*) AS cnt
                FROM calls GROUP BY LOWER(role)
            ) c ON c.rl = LOWER(r.name)
            ORDER BY r.created_at DESC
        """).fetchall()
        return [dict(row) for row in rows]


def get_role(role_id):
    with _conn() as conn:
        row = conn.execute("SELECT * FROM roles WHERE id = ?", (role_id,)).fetchone()
        if not row:
            return None
        role = dict(row)
        apps = conn.execute("""
            SELECT c.execution_id, c.candidate_name, c.candidate_phone,
                   c.status, c.created_at, r.report_json
            FROM calls c
            LEFT JOIN reports r ON r.execution_id = c.execution_id
            WHERE LOWER(c.role) = LOWER(?)
            ORDER BY c.created_at DESC
        """, (role["name"],)).fetchall()
        applications = []
        for a in apps:
            d = dict(a)
            rj = d.pop("report_json")
            report = json.loads(rj) if rj else None
            d["hire_recommendation"] = report.get("hire_recommendation") if report else None
            applications.append(d)
        role["applications"] = applications
        return role


def delete_role(role_id):
    with _conn() as conn:
        conn.execute("DELETE FROM roles WHERE id = ?", (role_id,))
        conn.commit()


init_db()

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const RECO_BADGE = {
  'Strong Yes': 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30',
  'Yes': 'bg-emerald-500/10 text-emerald-300/90 ring-1 ring-inset ring-emerald-500/20',
  'Maybe': 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/30',
  'No': 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30',
}
const QUALITY_BADGE = {
  Excellent: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  Good: 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/20',
  Fair: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  Poor: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20',
}

function ScoreBar({ label, value }) {
  const pct = Math.max(0, Math.min(10, value)) * 10
  const color = value >= 8 ? 'bg-emerald-400' : value >= 6 ? 'bg-blue-400' : value >= 4 ? 'bg-amber-400' : 'bg-rose-500'
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold">{label}</span>
        <span className="text-2xl font-semibold text-slate-100 tabular-nums tracking-tight">
          {value}<span className="text-slate-600 text-sm font-normal">/10</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#1E2A44] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ReportView() {
  const { executionId } = useParams()
  const [report, setReport] = useState(null)
  const [openIdx, setOpenIdx] = useState(0)

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/report/${executionId}`)
        const data = await res.json()
        if (cancelled) return
        if (data.status === 'ready') setReport(data.report)
      } catch {}
    }
    poll()
    const id = setInterval(() => { if (!report) poll() }, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [executionId, report])

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="inline-block w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4"></div>
        <div className="text-slate-400 text-sm">Generating report…</div>
      </div>
    )
  }

  const reco = report.hire_recommendation
  const recoCls = RECO_BADGE[reco] || RECO_BADGE.Maybe

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="card p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-slate-500 mb-1 font-semibold">Screening Report</div>
          <div className="text-2xl font-semibold text-slate-100 tracking-tight">{report.candidate_name || 'Candidate'}</div>
          <div className="text-slate-400 text-sm">{report.role || ''}</div>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${recoCls}`}>{reco}</div>
      </div>

      <div className="card p-6">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-3 font-semibold">Executive Summary</h2>
        <p className="text-slate-200 leading-relaxed">{report.executive_summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreBar label="Communication" value={report.scores?.communication ?? 0} />
        <ScoreBar label="Relevance" value={report.scores?.relevance ?? 0} />
        <ScoreBar label="Confidence" value={report.scores?.confidence ?? 0} />
      </div>

      <div className="card p-6">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-4 font-semibold">Question Breakdown</h2>
        <div className="space-y-2">
          {(report.question_breakdown || []).map((q, i) => {
            const open = openIdx === i
            const qb = QUALITY_BADGE[q.quality] || 'bg-slate-700/30 text-slate-300'
            return (
              <div key={i} className="rounded-xl border border-[#1E2A44] overflow-hidden bg-[#0B1222]/60">
                <button onClick={() => setOpenIdx(open ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1 font-semibold">Q{i + 1}</div>
                    <div className="text-slate-200 font-medium leading-snug">{q.question}</div>
                  </div>
                  <span className={`chip ${qb}`}>{q.quality}</span>
                  <span className="text-slate-600 text-lg w-4 text-center">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div className="px-4 pb-4 space-y-4 border-t border-[#1E2A44]">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 mt-4 mb-1.5 font-semibold">Candidate Answer</div>
                      <div className="text-slate-300 text-sm leading-relaxed">{q.candidate_answer}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1.5 font-semibold">Notes</div>
                      <div className="text-slate-400 text-sm leading-relaxed">{q.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-emerald-400 mb-3 font-semibold">Green Flags</h2>
          {report.green_flags?.length ? (
            <ul className="space-y-2">
              {report.green_flags.map((f, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span><span>{f}</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-slate-500 text-sm">None noted</div>}
        </div>
        <div className="card p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-rose-400 mb-3 font-semibold">Red Flags</h2>
          {report.red_flags?.length ? (
            <ul className="space-y-2">
              {report.red_flags.map((f, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-rose-400 mt-0.5">!</span><span>{f}</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-slate-500 text-sm">None noted</div>}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-3 font-semibold">Recommendation Reasoning</h2>
        <p className="text-slate-200 leading-relaxed">{report.recommendation_reasoning}</p>
      </div>
    </div>
  )
}

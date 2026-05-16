import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const STATUS_META = {
  queued: { label: 'Queued', dot: 'bg-amber-400', glow: 'shadow-amber-400/40', pulse: true },
  initiated: { label: 'Connecting', dot: 'bg-amber-400', glow: 'shadow-amber-400/40', pulse: true },
  'in-progress': { label: 'In Progress', dot: 'bg-emerald-400', glow: 'shadow-emerald-400/40', pulse: true },
  in_progress: { label: 'In Progress', dot: 'bg-emerald-400', glow: 'shadow-emerald-400/40', pulse: true },
  ongoing: { label: 'In Progress', dot: 'bg-emerald-400', glow: 'shadow-emerald-400/40', pulse: true },
  completed: { label: 'Completed', dot: 'bg-blue-400', glow: 'shadow-blue-400/40', pulse: false },
  failed: { label: 'Failed', dot: 'bg-rose-500', glow: 'shadow-rose-500/40', pulse: false },
}

export default function LiveStatus() {
  const { executionId } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('queued')
  const [info, setInfo] = useState({ candidate_name: '', role: '' })
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/call-status/${executionId}`)
        if (!res.ok) throw new Error('Status fetch failed')
        const data = await res.json()
        if (cancelled) return
        setStatus(data.status)
        setInfo({ candidate_name: data.candidate_name, role: data.role })
        if (data.status === 'completed') {
          setTimeout(() => navigate(`/report/${executionId}`), 800)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    poll()
    const id = setInterval(poll, 4000)
    return () => { cancelled = true; clearInterval(id) }
  }, [executionId, navigate])

  const meta = STATUS_META[status] || STATUS_META.queued
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-10 text-center">
        <div className="flex justify-center mb-8">
          <span className="relative inline-flex">
            <span className={`w-6 h-6 rounded-full ${meta.dot} shadow-lg ${meta.glow}`}></span>
            {meta.pulse && (
              <span className={`absolute inset-0 rounded-full ${meta.dot} opacity-60 animate-ping`}></span>
            )}
          </span>
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2 font-semibold">Call Status</div>
        <div className="text-3xl font-semibold text-slate-100 tracking-tight mb-8">{meta.label}</div>

        <div className="grid grid-cols-3 gap-3 text-left">
          <div className="rounded-lg bg-[#0B1222] border border-[#1E2A44] p-3">
            <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1">Candidate</div>
            <div className="font-medium text-slate-100 truncate">{info.candidate_name || '—'}</div>
          </div>
          <div className="rounded-lg bg-[#0B1222] border border-[#1E2A44] p-3">
            <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1">Role</div>
            <div className="font-medium text-slate-100 truncate">{info.role || '—'}</div>
          </div>
          <div className="rounded-lg bg-[#0B1222] border border-[#1E2A44] p-3">
            <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1">Elapsed</div>
            <div className="font-medium text-slate-100 tabular-nums font-mono">{mm}:{ss}</div>
          </div>
        </div>

        <div className="mt-8 text-[11px] text-slate-600 font-mono break-all">{executionId}</div>
        {error && <div className="mt-4 text-sm text-rose-400">{error}</div>}
      </div>
    </div>
  )
}

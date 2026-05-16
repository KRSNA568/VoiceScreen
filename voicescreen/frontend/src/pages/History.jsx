import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconSearch } from '../components/icons.jsx'

const RECO_BADGE = {
  'Strong Yes': 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/30',
  'Yes': 'bg-emerald-500/10 text-emerald-300/90 ring-1 ring-inset ring-emerald-500/20',
  'Maybe': 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/30',
  'No': 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30',
}
const STATUS_BADGE = {
  completed: 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/20',
  queued: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  'in-progress': 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  failed: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20',
}

export default function History() {
  const [calls, setCalls] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recoFilter, setRecoFilter] = useState('all')

  useEffect(() => {
    fetch('/api/calls').then((r) => r.json()).then((d) => setCalls(d.calls || []))
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return calls.filter((c) => {
      if (q && !`${c.candidate_name} ${c.role} ${c.candidate_phone}`.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (recoFilter !== 'all' && c.hire_recommendation !== recoFilter) return false
      return true
    })
  }, [calls, query, statusFilter, recoFilter])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Screening History</h1>
        <p className="text-slate-500 text-sm mt-1">All calls placed and their outcomes</p>
      </div>

      <div className="card p-3 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><IconSearch /></span>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, phone…"
            className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select w-auto min-w-[160px]">
          <option value="all">All statuses</option>
          <option value="queued">Queued</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select value={recoFilter} onChange={(e) => setRecoFilter(e.target.value)} className="select w-auto min-w-[200px]">
          <option value="all">All recommendations</option>
          <option value="Strong Yes">Strong Yes</option>
          <option value="Yes">Yes</option>
          <option value="Maybe">Maybe</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Candidate</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Phone</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Recommendation</th>
              <th className="text-left px-5 py-3 font-medium">When</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">No screenings match these filters.</td></tr>
            )}
            {filtered.map((c) => {
              const when = new Date(c.created_at + 'Z').toLocaleString()
              return (
                <tr key={c.execution_id} className="border-t border-[#1E2A44] hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-slate-100">{c.candidate_name}</td>
                  <td className="px-5 py-3.5 text-slate-400">{c.role}</td>
                  <td className="px-5 py-3.5 text-slate-500 tabular-nums font-mono text-xs">{c.candidate_phone}</td>
                  <td className="px-5 py-3.5">
                    <span className={`chip ${STATUS_BADGE[c.status] || 'bg-slate-700/50 text-slate-300'}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.hire_recommendation ? (
                      <span className={`chip ${RECO_BADGE[c.hire_recommendation]}`}>{c.hire_recommendation}</span>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{when}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={c.status === 'completed' ? `/report/${c.execution_id}` : `/status/${c.execution_id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs">View →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

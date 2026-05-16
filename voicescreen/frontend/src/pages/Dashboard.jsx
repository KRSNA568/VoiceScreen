import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPlus, IconArrowRight } from '../components/icons.jsx'

function StatCard({ label, value, sub }) {
  return (
    <div className="card card-hover p-5 transition-colors">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold mb-3">{label}</div>
      <div className="text-3xl font-semibold text-slate-100 tabular-nums tracking-tight">{value}</div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

const RECO_BAR = {
  'Strong Yes': 'bg-emerald-400',
  'Yes': 'bg-emerald-500/70',
  'Maybe': 'bg-amber-400',
  'No': 'bg-rose-500',
}
const RECO_TEXT = {
  'Strong Yes': 'text-emerald-300',
  'Yes': 'text-emerald-300/80',
  'Maybe': 'text-amber-300',
  'No': 'text-rose-300',
}
const STATUS_CHIP = {
  completed: 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/20',
  queued: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  'in-progress': 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  failed: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/calls').then((r) => r.json()),
    ]).then(([s, c]) => {
      setStats(s)
      setRecent((c.calls || []).slice(0, 5))
    })
  }, [])

  const recoTotal = stats
    ? Object.values(stats.recommendations).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your screening pipeline</p>
        </div>
        <Link to="/new" className="btn-primary inline-flex items-center gap-2">
          <IconPlus /> New Screening
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Screenings" value={stats?.total_screenings ?? '—'} sub="All time" />
        <StatCard label="Completed" value={stats?.completed ?? '—'} sub="With reports ready" />
        <StatCard label="Today" value={stats?.today ?? '—'} sub="Calls placed today" />
        <StatCard label="Pending Candidates" value={stats?.pending_candidates ?? '—'} sub="Awaiting screening" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-100">Hire Recommendations</div>
            <div className="text-[11px] text-slate-500">{recoTotal} reports</div>
          </div>
          {stats && recoTotal > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.recommendations).map(([k, v]) => {
                const pct = recoTotal ? Math.round((v / recoTotal) * 100) : 0
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-medium ${RECO_TEXT[k]}`}>{k}</span>
                      <span className="text-slate-500 tabular-nums">{v} · {pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1E2A44] rounded-full overflow-hidden">
                      <div className={`h-full ${RECO_BAR[k]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-slate-500 text-sm py-6 text-center">No completed reports yet.</div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-100">Recent Screenings</div>
            <Link to="/history" className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
              View all <IconArrowRight width={12} height={12} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-slate-500 text-sm py-6 text-center">No screenings yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="text-left py-2 font-medium">Candidate</th>
                  <th className="text-left font-medium">Role</th>
                  <th className="text-left font-medium">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.execution_id} className="border-t border-[#1E2A44]">
                    <td className="py-3 font-medium text-slate-100">{c.candidate_name}</td>
                    <td className="text-slate-400">{c.role}</td>
                    <td>
                      <span className={`chip ${STATUS_CHIP[c.status] || 'bg-slate-700/50 text-slate-300'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link to={c.status === 'completed' ? `/report/${c.execution_id}` : `/status/${c.execution_id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

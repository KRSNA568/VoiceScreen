import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { IconArrowLeft, IconPhone, IconTrash } from '../components/icons.jsx'

const RECO_BADGE = {
  'Strong Yes': 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30',
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

export default function RoleDetail() {
  const { roleId } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState(null)

  useEffect(() => {
    fetch(`/api/roles/${roleId}`).then((r) => r.json()).then(setRole)
  }, [roleId])

  if (!role) return <div className="text-slate-400">Loading…</div>
  if (role.detail === 'Role not found') return <div className="text-slate-400">Role not found.</div>

  const startScreening = () => {
    navigate('/new', { state: { prefill: { role: role.name, job_description: role.job_description } } })
  }

  const remove = async () => {
    if (!confirm(`Delete role "${role.name}"? Past screenings will be kept.`)) return
    await fetch(`/api/roles/${roleId}`, { method: 'DELETE' })
    navigate('/roles')
  }

  return (
    <div>
      <Link to="/roles" className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 mb-4">
        <IconArrowLeft width={14} height={14} /> All roles
      </Link>

      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">{role.name}</h1>
            <div className="text-slate-500 text-sm mt-1">
              {role.applications.length} application{role.applications.length === 1 ? '' : 's'} · created {new Date(role.created_at + 'Z').toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={startScreening} className="btn-primary inline-flex items-center gap-2">
              <IconPhone /> Start Screening
            </button>
            <button onClick={remove} className="btn-ghost text-rose-300 hover:text-rose-200 inline-flex items-center gap-2 border-rose-500/20 hover:border-rose-500/40">
              <IconTrash /> Delete
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="label">Job Description</div>
          <div className="rounded-lg bg-[#0B1222] border border-[#1E2A44] p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {role.job_description}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1E2A44] text-sm font-semibold text-slate-100">Applications</div>
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Candidate</th>
              <th className="text-left px-5 py-3 font-medium">Phone</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Recommendation</th>
              <th className="text-left px-5 py-3 font-medium">When</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {role.applications.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                No applications yet. Click "Start Screening" to add the first.
              </td></tr>
            ) : role.applications.map((a) => (
              <tr key={a.execution_id} className="border-t border-[#1E2A44] hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 font-medium text-slate-100">{a.candidate_name}</td>
                <td className="px-5 py-3.5 text-slate-500 tabular-nums font-mono text-xs">{a.candidate_phone}</td>
                <td className="px-5 py-3.5">
                  <span className={`chip ${STATUS_BADGE[a.status] || 'bg-slate-700/30 text-slate-300'}`}>{a.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  {a.hire_recommendation ? (
                    <span className={`chip ${RECO_BADGE[a.hire_recommendation]}`}>{a.hire_recommendation}</span>
                  ) : <span className="text-slate-600 text-xs">—</span>}
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-xs">
                  {new Date(a.created_at + 'Z').toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link to={a.status === 'completed' ? `/report/${a.execution_id}` : `/status/${a.execution_id}`}
                    className="text-blue-400 hover:text-blue-300 text-xs">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

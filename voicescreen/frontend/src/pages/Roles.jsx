import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPlus, IconBriefcase } from '../components/icons.jsx'

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', job_description: '' })
  const [error, setError] = useState('')

  const load = () =>
    fetch('/api/roles').then((r) => r.json()).then((d) => setRoles(d.roles || []))

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      setError((await res.json()).detail || 'Failed')
      return
    }
    setForm({ name: '', job_description: '' })
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Roles</h1>
          <p className="text-slate-500 text-sm mt-1">Reusable job descriptions. Screen candidates directly from a role.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary inline-flex items-center gap-2">
          <IconPlus /> Add Role
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-5 space-y-3">
          <div>
            <label className="label">Role name</label>
            <input required placeholder="e.g. Backend Engineer" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Job description</label>
            <textarea required rows={6} value={form.job_description}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })} className="textarea" />
          </div>
          {error && <div className="text-sm text-rose-400">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-3 py-2 text-slate-400 hover:text-slate-200">Cancel</button>
            <button type="submit" className="btn-primary">Save Role</button>
          </div>
        </form>
      )}

      {roles.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 items-center justify-center mb-3">
            <IconBriefcase width={22} height={22} />
          </div>
          <div className="text-slate-300 font-medium mb-1">No roles yet</div>
          <div className="text-slate-500 text-sm">Add one to start screening candidates against a saved JD.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <Link key={r.id} to={`/roles/${r.id}`} className="card card-hover p-5 block transition-all">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="font-semibold text-slate-100 tracking-tight">{r.name}</div>
                <span className="chip bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/20 whitespace-nowrap tabular-nums">
                  {r.application_count} app{r.application_count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4">{r.job_description}</div>
              <div className="text-xs text-blue-400">View details →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconPlus, IconRefresh, IconTrash, IconArrowRight } from '../components/icons.jsx'

export default function Pending() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ candidate_name: '', candidate_phone: '', role: '', job_description: '' })

  const load = () =>
    fetch('/api/pending-candidates').then((r) => r.json()).then((d) => setItems(d.candidates || []))

  useEffect(() => { load() }, [])

  const syncForm = async () => {
    setLoading(true)
    try {
      await fetch('/api/pending-candidates/sync-google-form', { method: 'POST' })
      await load()
    } finally { setLoading(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    await fetch('/api/pending-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ candidate_name: '', candidate_phone: '', role: '', job_description: '' })
    setShowForm(false)
    load()
  }

  const remove = async (id) => {
    await fetch(`/api/pending-candidates/${id}`, { method: 'DELETE' })
    load()
  }

  const startScreening = (c) => navigate('/new', { state: { prefill: c } })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Pending Candidates</h1>
          <p className="text-slate-500 text-sm mt-1">From Google Form intakes or manual additions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncForm} disabled={loading} className="btn-ghost inline-flex items-center gap-2">
            <IconRefresh /> {loading ? 'Syncing…' : 'Sync Google Form'}
          </button>
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary inline-flex items-center gap-2">
            <IconPlus /> Add Candidate
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-4 text-xs text-amber-200/90">
        <span className="font-semibold">Prototype.</span> "Sync Google Form" currently seeds sample candidates.
        Wire to Google Forms / Sheets in production (Apps Script webhook → <code className="font-mono text-amber-200">POST /api/pending-candidates</code>).
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5 mb-4 grid grid-cols-2 gap-3">
          <input required placeholder="Candidate Name" value={form.candidate_name}
            onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} className="input" />
          <input required placeholder="+91XXXXXXXXXX" value={form.candidate_phone}
            onChange={(e) => setForm({ ...form, candidate_phone: e.target.value })} className="input" />
          <input required placeholder="Role" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })} className="input col-span-2" />
          <textarea required placeholder="Job description" rows={3} value={form.job_description}
            onChange={(e) => setForm({ ...form, job_description: e.target.value })} className="textarea col-span-2" />
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-3 py-2 text-slate-400 hover:text-slate-200">Cancel</button>
            <button type="submit" className="btn-primary">Add Candidate</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Candidate</th>
              <th className="text-left px-5 py-3 font-medium">Phone</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                No pending candidates. Add manually or sync from Google Form.
              </td></tr>
            ) : items.map((c) => (
              <tr key={c.id} className="border-t border-[#1E2A44] hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 font-medium text-slate-100">{c.candidate_name}</td>
                <td className="px-5 py-3.5 text-slate-500 tabular-nums font-mono text-xs">{c.candidate_phone}</td>
                <td className="px-5 py-3.5 text-slate-400">{c.role}</td>
                <td className="px-5 py-3.5">
                  <span className={`chip ${
                    c.source === 'google_form'
                      ? 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/20'
                      : 'bg-slate-700/30 text-slate-300 ring-1 ring-inset ring-slate-600/40'
                  }`}>
                    {c.source === 'google_form' ? 'Google Form' : 'Manual'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <button onClick={() => startScreening(c)}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mr-4">
                    Start Screening <IconArrowRight width={12} height={12} />
                  </button>
                  <button onClick={() => remove(c.id)}
                    className="inline-flex items-center text-rose-400 hover:text-rose-300 text-xs">
                    <IconTrash width={14} height={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

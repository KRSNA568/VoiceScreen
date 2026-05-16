import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconSparkles } from '../components/icons.jsx'

export default function JDForm() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const prefill = state?.prefill || {}
  const [form, setForm] = useState({
    candidate_name: prefill.candidate_name || '',
    candidate_phone: prefill.candidate_phone || '',
    role: prefill.role || '',
    job_description: prefill.job_description || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: form.role, job_description: form.job_description }),
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      const data = await res.json()
      navigate('/questions', { state: { questions: data.questions, formData: form } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">New Screening</h1>
        <p className="text-slate-500 text-sm mt-1">Enter candidate details and the job description to generate screening questions.</p>
      </div>

      <form onSubmit={onSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Candidate Name</label>
            <input required value={form.candidate_name} onChange={update('candidate_name')} className="input" />
          </div>
          <div>
            <label className="label">Candidate Phone</label>
            <input required value={form.candidate_phone} onChange={update('candidate_phone')}
              placeholder="+91XXXXXXXXXX" className="input font-mono text-xs" />
          </div>
        </div>

        <div>
          <label className="label">Role</label>
          <input required value={form.role} onChange={update('role')} className="input" />
        </div>

        <div>
          <label className="label">Job Description</label>
          <textarea required rows={7} value={form.job_description} onChange={update('job_description')}
            className="textarea leading-relaxed" />
        </div>

        {error && (
          <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="btn-primary w-full inline-flex items-center justify-center gap-2">
          <IconSparkles />
          {loading ? 'Generating Questions…' : 'Generate Questions'}
        </button>
      </form>
    </div>
  )
}

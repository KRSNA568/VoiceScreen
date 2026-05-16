import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconRefresh, IconPhone, IconCheck } from '../components/icons.jsx'

export default function QuestionSelector() {
  const { state } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!state?.questions || !state?.formData) navigate('/new')
  }, [state, navigate])

  const [questions, setQuestions] = useState(state?.questions || [])
  const [selected, setSelected] = useState(new Set((state?.questions || []).map((_, i) => i)))
  const [regenerating, setRegenerating] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const formData = state?.formData

  const toggle = (i) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const count = selected.size
  const valid = count >= 3 && count <= 5

  const regenerate = async () => {
    setRegenerating(true); setError('')
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: formData.role, job_description: formData.job_description }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setQuestions(data.questions)
      setSelected(new Set(data.questions.map((_, i) => i)))
    } catch (err) { setError(err.message) }
    finally { setRegenerating(false) }
  }

  const startCall = async () => {
    if (!valid) return
    setStarting(true); setError('')
    try {
      const selectedQuestions = [...selected].sort((a, b) => a - b).map((i) => questions[i])
      const res = await fetch('/api/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: formData.candidate_name,
          candidate_phone: formData.candidate_phone,
          role: formData.role,
          job_description: formData.job_description,
          selected_questions: selectedQuestions,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      const data = await res.json()
      navigate(`/status/${data.execution_id}`)
    } catch (err) { setError(err.message); setStarting(false) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Select Screening Questions</h1>
        <p className="text-slate-500 text-sm mt-1">Pick 3 to 5 questions for the voice agent to ask {formData?.candidate_name}.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className={`text-sm font-medium ${valid ? 'text-emerald-300' : 'text-amber-300'}`}>
          {count} of 10 selected {!valid && (count < 3 ? '· need at least 3' : '· max is 5')}
        </div>
        <button onClick={regenerate} disabled={regenerating} className="btn-ghost inline-flex items-center gap-2">
          <IconRefresh /> {regenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {questions.map((q, i) => {
          const isSel = selected.has(i)
          return (
            <label key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
              ${isSel
                ? 'bg-blue-500/[0.07] border-blue-500/40 ring-1 ring-inset ring-blue-500/10'
                : 'bg-[#0F1626] border-[#1E2A44] hover:border-[#2A3A5C]'}`}>
              <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors
                ${isSel ? 'bg-blue-500 text-white' : 'bg-[#0B1222] border border-[#2A3A5C]'}`}>
                {isSel && <IconCheck width={14} height={14} />}
              </div>
              <input type="checkbox" checked={isSel} onChange={() => toggle(i)} className="sr-only" />
              <div className="flex-1">
                <div className="text-[10px] font-medium text-slate-500 mb-1 tracking-[0.1em] uppercase">Q{i + 1}</div>
                <div className="text-slate-200 leading-relaxed">{q}</div>
              </div>
            </label>
          )
        })}
      </div>

      {error && <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 mb-4">{error}</div>}

      <button onClick={startCall} disabled={!valid || starting}
        className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3">
        <IconPhone /> {starting ? 'Starting Call…' : 'Start Voice Screening'}
      </button>
    </div>
  )
}

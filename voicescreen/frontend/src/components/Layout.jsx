import { NavLink, Outlet } from 'react-router-dom'
import { IconDashboard, IconPlus, IconInbox, IconBriefcase, IconHistory } from './icons.jsx'

const navItem = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/20'
      : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'
  }`

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-[#1E2A44] bg-[#0B1020]/80 backdrop-blur-sm flex flex-col">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              V
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 tracking-tight">VoiceScreen</div>
              <div className="text-[11px] text-slate-500">AI Screening Suite</div>
            </div>
          </div>
        </div>

        <div className="px-3 mt-2">
          <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold">Workspace</div>
          <nav className="space-y-0.5">
            <NavLink to="/" end className={navItem}><IconDashboard /><span>Dashboard</span></NavLink>
            <NavLink to="/new" className={navItem}><IconPlus /><span>New Screening</span></NavLink>
            <NavLink to="/pending" className={navItem}><IconInbox /><span>Pending</span></NavLink>
            <NavLink to="/roles" className={navItem}><IconBriefcase /><span>Roles</span></NavLink>
            <NavLink to="/history" className={navItem}><IconHistory /><span>History</span></NavLink>
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-xl border border-[#1E2A44] bg-[#0F1626] p-3">
            <div className="text-xs font-medium text-slate-200 mb-1">Powered by</div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              Bolna · Groq · FastAPI
            </div>
            <div className="mt-2 text-[10px] text-slate-600">v0.2 · internal preview</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

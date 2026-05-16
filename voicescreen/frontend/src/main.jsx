import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Pending from './pages/Pending.jsx'
import Roles from './pages/Roles.jsx'
import RoleDetail from './pages/RoleDetail.jsx'
import JDForm from './pages/JDForm.jsx'
import QuestionSelector from './pages/QuestionSelector.jsx'
import LiveStatus from './pages/LiveStatus.jsx'
import ReportView from './pages/ReportView.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<JDForm />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/roles/:roleId" element={<RoleDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/questions" element={<QuestionSelector />} />
          <Route path="/status/:executionId" element={<LiveStatus />} />
          <Route path="/report/:executionId" element={<ReportView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

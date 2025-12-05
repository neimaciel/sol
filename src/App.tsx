import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/useAuthStore'
import { AnimatePresence } from 'framer-motion'

import Dashboard from '@/pages/Dashboard'
import DriversList from '@/pages/drivers/DriversList'
import GroupsList from '@/pages/groups/GroupsList'
import ModelsList from '@/pages/models/ModelsList'
import HistoryList from '@/pages/history/HistoryList'
import OperatorsList from '@/pages/operators/OperatorsList'
import AgentAdmin from '@/pages/AgentAdmin'
import Login from '@/pages/Login'
import DriverPortal from '@/pages/driver/DriverPortal'
import WhatsAppSettings from '@/pages/admin/WhatsAppSettings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user: session, loading } = useAuthStore()

  if (loading) return <div>Loading...</div>
  if (!session) return <Navigate to="/login" />

  return <>{children}</>
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/motorista/carga/:id" element={<DriverPortal />} />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute>
              <DriversList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <GroupsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/models"
          element={
            <ProtectedRoute>
              <ModelsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operators"
          element={
            <ProtectedRoute>
              <OperatorsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent-admin"
          element={
            <ProtectedRoute>
              <AgentAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/whatsapp"
          element={
            <ProtectedRoute>
              <WhatsAppSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="bg-noise" />
        <AnimatedRoutes />
      </Router>
    </QueryClientProvider>
  )
}

export default App

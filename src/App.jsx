import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Public layout
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import RegisterPage from './pages/RegisterPage'
import VictimPage from './pages/VictimPage'
import InitiativesPage from './pages/InitiativesPage'
import SubmitPage from './pages/SubmitPage'

// Admin
import { ContentProvider } from './context/ContentContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './admin/AuthContext'
import { ToastProvider } from './admin/components/Toast'
import LoginPage from './admin/pages/LoginPage'
import DashboardPage from './admin/pages/DashboardPage'
import VictimsAdminPage from './admin/pages/VictimsAdminPage'
import VictimFormPage from './admin/pages/VictimFormPage'
import OralHistoriesAdminPage from './admin/pages/OralHistoriesAdminPage'
import InitiativesAdminPage from './admin/pages/InitiativesAdminPage'
import ConsentQueuePage from './admin/pages/ConsentQueuePage'
import ImportsAdminPage from './admin/pages/ImportsAdminPage'
import ImportDetailPage from './admin/pages/ImportDetailPage'
import SubmissionsPage from './admin/pages/SubmissionsPage'
import SubmissionDetailPage from './admin/pages/SubmissionDetailPage'
import ContentPage from './admin/pages/ContentPage'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/admin-panel/login" replace />
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="victims" element={<RequireAuth><VictimsAdminPage /></RequireAuth>} />
      <Route path="victims/new" element={<RequireAuth><VictimFormPage /></RequireAuth>} />
      <Route path="victims/:id/edit" element={<RequireAuth><VictimFormPage /></RequireAuth>} />
      <Route path="oral-histories" element={<RequireAuth><OralHistoriesAdminPage /></RequireAuth>} />
      <Route path="oral-histories/new" element={<RequireAuth><OralHistoriesAdminPage /></RequireAuth>} />
      <Route path="initiatives" element={<RequireAuth><InitiativesAdminPage /></RequireAuth>} />
      <Route path="consent" element={<RequireAuth><ConsentQueuePage /></RequireAuth>} />
      <Route path="imports" element={<RequireAuth><ImportsAdminPage /></RequireAuth>} />
      <Route path="imports/:id" element={<RequireAuth><ImportDetailPage /></RequireAuth>} />
      <Route path="submissions" element={<RequireAuth><SubmissionsPage /></RequireAuth>} />
      <Route path="submissions/:id" element={<RequireAuth><SubmissionDetailPage /></RequireAuth>} />
      <Route path="content" element={<RequireAuth><ContentPage /></RequireAuth>} />
    </Routes>
  )
}

function PublicRoutes() {
  const { theme } = useTheme()
  return (
    <div className={`public-layout min-h-screen flex flex-col${theme === 'dark' ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--bg-page)' }}>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/victims/:id" element={<VictimPage />} />
          <Route path="/initiatives" element={<InitiativesPage />} />
          <Route path="/submit" element={<SubmitPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <ContentProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/admin-panel/*" element={<AdminRoutes />} />
            <Route path="/*" element={<PublicRoutes />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
      </ContentProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

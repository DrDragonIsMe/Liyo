import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import PapersPage from '@/pages/PapersPage'
import StudyPage from '@/pages/StudyPage'
import ProfilePage from '@/pages/ProfilePage'
import LearningPath from '@/pages/LearningPath'
import CreateLearningPath from '@/pages/CreateLearningPath'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 受保护的路由 */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/papers" element={
          <ProtectedRoute>
            <Layout>
              <PapersPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/study" element={
          <ProtectedRoute>
            <Layout>
              <StudyPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/learning-path" element={
          <ProtectedRoute>
            <Layout>
              <LearningPath />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/learning-path/create" element={
          <ProtectedRoute>
            <Layout>
              <CreateLearningPath />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}

export default App
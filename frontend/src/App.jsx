import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import EmergencyBanner from './components/common/EmergencyBanner';
import AiChatbotModal from './components/common/AiChatbotModal';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import HospitalDiscoveryPage from './pages/public/HospitalDiscoveryPage';
import HospitalDetailsPage from './pages/public/HospitalDetailsPage';
import EmergencyRegisterPage from './pages/public/EmergencyRegisterPage';
import MedicineDiscoveryPage from './pages/public/MedicineDiscoveryPage';
import BloodBankDiscoveryPage from './pages/public/BloodBankDiscoveryPage';
import AmbulanceAssistancePage from './pages/public/AmbulanceAssistancePage';
import CivicComplaintsPage from './pages/public/CivicComplaintsPage';
import WelfareSchemesPage from './pages/public/WelfareSchemesPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HospitalRegisterPage from './pages/auth/HospitalRegisterPage';

// Role-based Dashboards
import CitizenDashboard from './pages/portals/CitizenDashboard';
import HospitalAdminDashboard from './pages/portals/HospitalAdminDashboard';
import DoctorDashboard from './pages/portals/DoctorDashboard';
import SuperAdminDashboard from './pages/portals/SuperAdminDashboard';
import AmbulancePortal from './pages/portals/AmbulancePortal';
import BloodBankPortal from './pages/portals/BloodBankPortal';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-500">
        Authenticating secure session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-health-500 selection:text-white">
          <EmergencyBanner />
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/hospitals" element={<HospitalDiscoveryPage />} />
              <Route path="/hospitals/:id" element={<HospitalDetailsPage />} />
              <Route path="/emergency-register" element={<EmergencyRegisterPage />} />
              <Route path="/medicines" element={<MedicineDiscoveryPage />} />
              <Route path="/blood-banks" element={<BloodBankDiscoveryPage />} />
              <Route path="/ambulance" element={<AmbulanceAssistancePage />} />
              <Route path="/complaints" element={<CivicComplaintsPage />} />
              <Route path="/schemes" element={<WelfareSchemesPage />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/hospital-register" element={<HospitalRegisterPage />} />

              {/* Role-Based Portals */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital-admin"
                element={
                  <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
                    <HospitalAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor-portal"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ambulance-portal"
                element={
                  <ProtectedRoute allowedRoles={['AMBULANCE_PROVIDER']}>
                    <AmbulancePortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blood-bank-portal"
                element={
                  <ProtectedRoute allowedRoles={['BLOOD_BANK_ADMIN']}>
                    <BloodBankPortal />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <AiChatbotModal />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DocsHeader } from './components/layout/DocsHeader';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { AuditLogsPage } from './pages/dashboard/AuditLogsPage';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { SummaryCalculationsPage } from './pages/dashboard/SummaryCalculationsPage';
import { TrafficManagementPage } from './pages/dashboard/TrafficManagementPage';
import { UserManagementPage } from './pages/dashboard/UserManagementPage';
import { DocsHome } from './pages/public/DocsHome';
import { HealthCheckDoc } from './pages/public/HealthCheckDoc';
import { IsikhnasStatusDoc } from './pages/public/IsikhnasStatusDoc';
import { RequirementsDoc } from './pages/public/RequirementsDoc';
import { WhatsAppConsultation } from './pages/public/WhatsAppConsultation';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white text-[#1f2328]">
          <DocsHeader />
          <div className="flex-1">
            <Routes>
              {/* Public Documentation & Landing Pages */}
              <Route path="/" element={<DocsHome />} />
              <Route path="/persyaratan" element={<RequirementsDoc />} />
              <Route path="/pemeriksaan" element={<HealthCheckDoc />} />
              <Route path="/isikhnas" element={<IsikhnasStatusDoc />} />
              <Route path="/konsultasi" element={<WhatsAppConsultation />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Internal Management Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<TrafficManagementPage />} />
                <Route path="kalkulasi" element={<SummaryCalculationsPage />} />
                <Route path="audit" element={<AuditLogsPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<DocsHome />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

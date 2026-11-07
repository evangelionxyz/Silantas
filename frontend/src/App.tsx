import { BrowserRouter, Route, Routes } from 'react-router-dom';
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
import { PublicLayout } from './components/layout/PublicLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Documentation & Information (Citizen & Farm Owners) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<DocsHome />} />
            <Route path="/persyaratan" element={<RequirementsDoc />} />
            <Route path="/pemeriksaan" element={<HealthCheckDoc />} />
            <Route path="/isikhnas" element={<IsikhnasStatusDoc />} />
            <Route path="/konsultasi" element={<WhatsAppConsultation />} />
          </Route>

          {/* Authentication View */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dedicated Internal Management Portal (Separated View for Staff & Admin) */}
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

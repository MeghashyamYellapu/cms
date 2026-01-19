import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Customers from './pages/Customers';
import Bills from './pages/Bills';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Admins from './pages/Admins';
import CustomerPortal from './pages/CustomerPortal';

import LandingPage from './pages/LandingPage';

const DashboardWrapper = () => {
    const { admin } = useAuth();
    if (['SuperAdmin', 'WebsiteAdmin'].includes(admin?.role)) {
        return <SuperAdminDashboard />;
    }
    return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <InstallPrompt />
          <OfflineIndicator />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<CustomerPortal />} />

            {/* Private Routes */}
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 lg:ml-64 transition-all duration-300 pt-14 lg:pt-0">
                      <Routes>
                        <Route path="/dashboard" element={<DashboardWrapper />} />
                        <Route path="/admins" element={<Admins />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/bills" element={<Bills />} />
                        <Route path="/payments" element={<Payments />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        {/* Catch all inside dashboard goes to dashboard */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

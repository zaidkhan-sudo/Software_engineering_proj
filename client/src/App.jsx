import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';

// Layout & Common
import LoadingScreen from './components/common/LoadingScreen';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleRoute from './components/auth/RoleRoute';

// Pages
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Helper route for '/' landing
const HomeRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    if (user.role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
    if (user.role === ROLES.OFFICER) return <Navigate to="/officer" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return <Landing />;
};

// Helper route for logged-out only views (login/register)
const PublicOnlyRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    if (user.role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
    if (user.role === ROLES.OFFICER) return <Navigate to="/officer" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <HashRouter>
      <LoadingScreen>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Citizen Protected Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.CITIZEN]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/citizen" element={<CitizenDashboard />} />
              <Route path="/citizen/file" element={<CitizenDashboard />} />
              <Route path="/citizen/grievances" element={<CitizenDashboard />} />
              <Route path="/citizen/track" element={<CitizenDashboard />} />
              <Route path="/citizen/profile" element={<CitizenDashboard />} />
            </Route>
          </Route>

          {/* Officer Protected Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.OFFICER]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/officer" element={<OfficerDashboard />} />
              <Route path="/officer/grievances" element={<OfficerDashboard />} />
              <Route path="/officer/profile" element={<OfficerDashboard />} />
            </Route>
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/grievances" element={<AdminDashboard />} />
              <Route path="/admin/departments" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminDashboard />} />
              <Route path="/admin/categories" element={<AdminDashboard />} />
              <Route path="/admin/audit-logs" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LoadingScreen>
    </HashRouter>
  );
};

export default App;

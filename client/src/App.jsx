import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';

// Layout & Common
import LoadingScreen from './components/common/LoadingScreen';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleRoute from './components/auth/RoleRoute';

// Public & Auth Pages
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Notifications from './pages/common/Notifications';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import FileGrievance from './pages/citizen/FileGrievance';
import MyGrievances from './pages/citizen/MyGrievances';
import GrievanceDetail from './pages/citizen/GrievanceDetail';
import TrackGrievance from './pages/citizen/TrackGrievance';
import Profile from './pages/citizen/Profile';

// Officer & Admin Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import UpdateGrievance from './pages/officer/UpdateGrievance';
import OfficerProfile from './pages/officer/OfficerProfile';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Analytics from './pages/admin/Analytics';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageUsers from './pages/admin/ManageUsers';
import AllGrievances from './pages/admin/AllGrievances';
import AdminGrievanceDetail from './pages/admin/AdminGrievanceDetail';
import AuditLog from './pages/admin/AuditLog';

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
              <Route path="/citizen/file" element={<FileGrievance />} />
              <Route path="/citizen/grievances" element={<MyGrievances />} />
              <Route path="/citizen/grievances/:id" element={<GrievanceDetail />} />
              <Route path="/citizen/track" element={<TrackGrievance />} />
              <Route path="/citizen/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Officer Protected Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.OFFICER]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/officer" element={<OfficerDashboard />} />
              <Route path="/officer/grievances" element={<OfficerDashboard />} />
              <Route path="/officer/grievances/:id" element={<UpdateGrievance />} />
              <Route path="/officer/profile" element={<OfficerProfile />} />
            </Route>
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/grievances" element={<AllGrievances />} />
              <Route path="/admin/grievances/:id" element={<AdminGrievanceDetail />} />
              <Route path="/admin/departments" element={<ManageDepartments />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/audit-logs" element={<AuditLog />} />
            </Route>
          </Route>

          {/* Common Authenticated Routes */}
          <Route element={<RoleRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/notifications" element={<Notifications />} />
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRouteGuard from './components/AdminRouteGuard';
import StudentHome from './pages/student/StudentHome';
import StudentEvents from './pages/student/StudentEvents';
import StudentEventDetail from './pages/student/StudentEventDetail';
import StudentProfile from './pages/student/StudentProfile';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import Login from './pages/auth/Login';
import RegisterComplete from './pages/auth/RegisterComplete';
import RegisterInitiate from './pages/auth/RegisterInitiate';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-complete" element={<RegisterComplete />} />
        <Route path="/register" element={<RegisterInitiate />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route element={<AdminRouteGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="events" element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="feedback" element={<AdminDashboard />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Student", "Teacher", "Admin"]} />}>
          <Route path="/" element={<StudentLayout />}>
            <Route index element={<StudentHome />} />
          </Route>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<StudentHome />} />
            <Route path="events" element={<StudentEvents />} />
            <Route path="events/:id" element={<StudentEventDetail />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
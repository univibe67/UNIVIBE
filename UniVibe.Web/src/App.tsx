import { BrowserRouter, Routes, Route,  } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import ProtectedRoute from './components/ProtectedRoute';
import StudentEventFeed from './pages/student/StudentEventFeed';
import StudentProfile from './pages/student/StudentProfile';
import ResetPassword from './pages/auth/ResetPassword';
import Login from './pages/auth/Login';
import RegisterComplete from './pages/auth/RegisterComplete';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register-complete" element={<RegisterComplete />} />
        
        <Route element={<ProtectedRoute allowedRole="Admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRole="Student" />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentProfile />} />
            <Route path="dashboard" element={<StudentEventFeed />} />
            <Route path="events" element={<StudentEventFeed />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import FullPageLoader from "./components/ui/FullPageLoader";
import Toaster from "./components/ui/Toaster";

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const StudentLayout = lazy(() => import("./layouts/StudentLayout"));
const StudentHome = lazy(() => import("./pages/student/StudentHome"));
const CreateEvent = lazy(() => import("./pages/student/CreateEvent"));
const StudentEventDetail = lazy(() => import("./pages/student/StudentEventDetail"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const Login = lazy(() => import("./pages/auth/Login"));
const RegisterComplete = lazy(() => import("./pages/auth/RegisterComplete"));
const RegisterInitiate = lazy(() => import("./pages/auth/RegisterInitiate"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminFeedback = lazy(() => import("./pages/admin/AdminFeedback"));

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register-complete" element={<RegisterComplete />} />
          <Route path="/register" element={<RegisterInitiate />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} redirectPath="/admin/login" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminOverview />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="feedback" element={<AdminFeedback />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Student", "Teacher", "Admin"]} />}>
            <Route element={<StudentLayout />}>
              <Route path="/" element={<StudentHome />} />
              <Route path="/student" element={<Navigate to="/student/home" replace />} />
              <Route path="/student/home" element={<StudentHome />} />
              <Route path="/student/events/new" element={<CreateEvent />} />
              <Route path="/student/events/:id" element={<StudentEventDetail />} />
              <Route path="/student/profile" element={<StudentProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

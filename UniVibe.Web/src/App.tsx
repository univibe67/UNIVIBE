import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Admin Rotası */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<div className="text-2xl font-bold">Admin Ana Sayfa</div>} />
        </Route>

        {/* Öğrenci Rotası */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<div className="text-2xl font-bold">Öğrenci Ana Sayfa</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
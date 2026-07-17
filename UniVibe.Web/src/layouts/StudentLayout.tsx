import { Outlet, Link } from 'react-router-dom';

export default function StudentLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-indigo-700 text-white p-6">
        <h2 className="text-2xl font-bold mb-10">Öğrenci Paneli</h2>
        <nav className="space-y-4">
          <Link to="/student/dashboard" className="block p-2 hover:bg-indigo-600 rounded transition-colors">Dashboard</Link>
          <Link to="/student/profile" className="block p-2 hover:bg-indigo-600 rounded transition-colors">Profilim</Link>
        </nav>
      </aside>
      
      <main className="flex-1 p-8">
        <Outlet /> 
      </main>
    </div>
  );
}
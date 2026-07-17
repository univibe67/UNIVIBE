import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-blue-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-10">Admin Paneli</h2>
        <nav className="space-y-4">
          <Link to="/admin/dashboard" className="block p-2 hover:bg-blue-800 rounded transition-colors">Dashboard</Link>
          <Link to="/admin/events" className="block p-2 hover:bg-blue-800 rounded transition-colors">Etkinlikler</Link>
        </nav>
      </aside>
      
      <main className="flex-1 p-8">
        <Outlet /> 
      </main>
    </div>
  );
}
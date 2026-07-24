import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <main className="w-full max-w-7xl p-4 md:p-8">
        <Outlet /> 
      </main>
    </div>
  );
}
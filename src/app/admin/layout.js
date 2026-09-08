"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden bg-stone-50 p-4 md:p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

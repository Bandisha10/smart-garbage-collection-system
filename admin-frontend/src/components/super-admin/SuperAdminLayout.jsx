"use client";

import { useState } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminTopHeader from "./SuperAdminTopHeader";

export default function SuperAdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SuperAdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <SuperAdminTopHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 md:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}

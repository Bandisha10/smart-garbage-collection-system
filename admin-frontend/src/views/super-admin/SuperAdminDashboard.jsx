"use client";

import { useState, useEffect } from "react";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import VerificationTable from "../../components/super-admin/VerificationTable";
import AddPanchayatModal from "../../components/super-admin/AddPanchayatModal";
import api from "../../api/axios";
import { Building2, CheckCircle2, Clock3, Plus } from "lucide-react";

function StatCard({ icon: Icon, label, value, loading, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div className="text-[12px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</div>
        <div className="text-[28px] md:text-[30px] font-extrabold text-slate-900 leading-none">{loading ? "—" : value}</div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ totalPanchayats: 0, activeSubscriptions: 0, pendingRequests: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/company/dashboard");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshKey]);

  return (
    <SuperAdminLayout>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        <StatCard icon={Building2}     label="Total Panchayats"    value={stats.totalPanchayats}    loading={loading} color="#6366f1" bg="rgba(99,102,241,0.1)"  />
        <StatCard icon={CheckCircle2}  label="Active Subscriptions" value={stats.activeSubscriptions} loading={loading} color="#10b981" bg="rgba(16,185,129,0.1)"  />
        <StatCard icon={Clock3}        label="Pending Requests"    value={stats.pendingRequests}    loading={loading} color="#f59e0b" bg="rgba(245,158,11,0.1)"  />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="text-[16px] font-bold text-slate-900">Verification Requests</div>
            <div className="text-[13px] text-slate-400 mt-1">Review and process panchayat registrations</div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-semibold text-[13px] cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            <Plus size={16} />
            Add Panchayat
          </button>
        </div>
        <div className="p-0 md:px-6 md:pb-6 overflow-x-auto custom-scrollbar">
          <VerificationTable refreshKey={refreshKey} onChange={() => setRefreshKey((p) => p + 1)} />
        </div>
      </div>

      <AddPanchayatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setRefreshKey((p) => p + 1)} />
    </SuperAdminLayout>
  );
}

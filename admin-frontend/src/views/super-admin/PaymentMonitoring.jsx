"use client";

import { useEffect, useState } from "react";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import PaymentOverviewCard from "../../components/super-admin/PaymentOverviewCard";
import PaymentTable from "../../components/super-admin/PaymentTable";
import api from "../../api/axios";

export default function PaymentMonitoring() {
  const [stats, setStats] = useState({ successful: 0, pending: 0, failed: 0 });
  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/company/payments");
      if (res.data) {
        setStats(res.data.stats || { successful: 0, pending: 0, failed: 0 });
        setPaymentData(res.data.payments || []);
      }
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const overviewStats = [
    { id: 1, title: "Successful Payments", count: String(stats.successful ?? 0), icon: "check" },
    { id: 2, title: "Pending Payments", count: String(stats.pending ?? 0), icon: "pending" },
    { id: 3, title: "Failed Payments", count: String(stats.failed ?? 0), icon: "failed" },
  ];

  return (
    <SuperAdminLayout>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {overviewStats.map((s) => (
          <PaymentOverviewCard key={s.id} stat={s} />
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100">
          <div className="text-[16px] font-bold text-slate-900">
            Payment Records
          </div>
          <div className="text-[13px] text-slate-400 mt-1">
            Track all panchayat transactions
          </div>
        </div>
        <div className="p-0 md:px-6 md:pb-6 overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading payment records…</div>
          ) : (
            <PaymentTable paymentData={paymentData} />
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

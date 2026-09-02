"use client";

import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import PlanCard from "../../components/super-admin/PlanCard";
import SubscriptionTable from "../../components/super-admin/SubscriptionTable";
import { useEffect, useState } from "react";
import api from "../../api/axios";

const plans = [
  { id: 1, name: "Basic",    price: "₹1,499", period: "/year", popular: false, features: ["Max 100 HH","Max 10 Labourers","Basic analytics dashboard","Household registration","Waste tracking","Email support"] },
  { id: 2, name: "Standard", price: "₹2,699", period: "/year", popular: true,  badge: "Most Popular", features: ["Max 300 HH","Max 30 Labourers","Advanced analytics & insights","Labour attendance tracking","Feedback & ticket system","Monthly performance reports"] },
  { id: 3, name: "Premium",  price: "₹5,999", period: "/year", popular: false, features: ["Max 500 HH","Max 50 Labourers","AI-based waste trend prediction","Route optimization","Priority support team","Dedicated account manager"] },
];

export default function SubscriptionPlanManagement() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get("/subscriptions");
      setSubscriptions(res.data);
    } catch (err) {
      console.error("Failed to fetch subscriptions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  return (
    <SuperAdminLayout>
      {/* Plans */}
      <div className="mb-7">
        <div className="mb-5">
          <div className="text-[16px] font-bold text-slate-900">Available Plans</div>
          <div className="text-[13px] text-slate-400 mt-1">Choose the right tier for each panchayat</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map(p => <PlanCard key={p.id} plan={p} />)}
        </div>
      </div>

      {/* Subscriptions table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100">
          <div className="text-[16px] font-bold text-slate-900">Panchayat Subscriptions</div>
          <div className="text-[13px] text-slate-400 mt-1">Active & past subscriptions across all panchayats</div>
        </div>
        <div className="p-0 md:px-6 md:pb-6 overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading subscriptions…</div>
          ) : (
            <SubscriptionTable subscriptions={subscriptions} plans={plans} onSubscriptionUpdated={fetchSubscriptions} />
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

"use client";

import { useState } from "react";
import { Search, Filter, RefreshCw, ArrowUpRight, Zap } from "lucide-react";
import ReactivateSubscriptionModal from "./ReactivateSubscriptionModal";
import { toast } from "react-toastify";
import api from "../../api/axios";

const planConfig = {
  BASIC:    { bg:"rgba(14,165,233,0.1)",  color:"#0ea5e9",  border:"rgba(14,165,233,0.2)"  },
  STANDARD: { bg:"rgba(99,102,241,0.1)",  color:"#6366f1",  border:"rgba(99,102,241,0.25)" },
  PREMIUM:  { bg:"rgba(245,158,11,0.1)",  color:"#f59e0b",  border:"rgba(245,158,11,0.2)"  },
};
const statusConfig = {
  Active:     { bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0" },
  Expired:    { bg:"#fef2f2", color:"#dc2626", border:"#fecaca" },
  NOT_ACTIVE: { bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" },
};

const TH = ({ children }) => (
  <th style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.6px", background:"#f8fafc", whiteSpace:"nowrap" }}>
    {children}
  </th>
);

export default function SubscriptionTable({ subscriptions, plans, onSubscriptionUpdated }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalMode, setModalMode] = useState(null);

  const filtered = subscriptions.filter(r =>
    r.panchayatName?.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "All" || r.status === statusFilter)
  );

  const handleUpgrade = async (planName) => {
    try {
      const normalizedPlan = planName.toUpperCase();
      if (modalMode === "change" && normalizedPlan === selectedRow.planName) {
        toast.info("This plan is already active"); return;
      }
      if (modalMode === "activate") {
        await api.post("/subscriptions", { panchayatId: selectedRow.panchayatId, planName: normalizedPlan });
        toast.success("Subscription activated ✓");
      }
      if (modalMode === "change") {
        await api.put(`/subscriptions/${selectedRow.subscriptionId}/upgrade`, { planName: normalizedPlan });
        toast.success(`Plan changed to ${planName} ✓`);
      }
      if (modalMode === "reactivate") {
        await api.put(`/subscriptions/${selectedRow.subscriptionId}/reactivate`);
        toast.success("Subscription renewed ✓");
      }
      await onSubscriptionUpdated();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const openModal = (row) => {
    setSelectedRow(row);
    setModalMode(row.status === "NOT_ACTIVE" ? "activate" : row.status === "Expired" ? "reactivate" : "change");
    setShowModal(true);
  };

  const getActionBtn = (row) => {
    if (row.status === "NOT_ACTIVE") return { label:"Activate", icon: Zap,       bg:"linear-gradient(135deg,#10b981,#059669)", shadow:"rgba(16,185,129,0.3)"  };
    if (row.status === "Expired")    return { label:"Renew",    icon: RefreshCw,  bg:"linear-gradient(135deg,#ef4444,#dc2626)", shadow:"rgba(239,68,68,0.3)"   };
    return                                  { label:"Change Plan",icon: ArrowUpRight, bg:"linear-gradient(135deg,#6366f1,#8b5cf6)", shadow:"rgba(99,102,241,0.3)" };
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, paddingTop:16, paddingBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input type="text" placeholder="Search panchayat…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", paddingLeft:36, paddingRight:14, paddingTop:9, paddingBottom:9, border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#334155", outline:"none", fontFamily:"Inter, sans-serif", background:"#f8fafc" }}
            onFocus={e => e.target.style.borderColor="#6366f1"} onBlur={e => e.target.style.borderColor="#e2e8f0"}
          />
        </div>
        {["All","Active","Expired","NOT_ACTIVE"].map(f => {
          const isActive = statusFilter === f;
          const cfg = statusConfig[f] || {};
          return (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{ padding:"9px 14px", borderRadius:10, border:"1.5px solid", borderColor: isActive ? (cfg.border || "#6366f1") : "#e2e8f0", background: isActive ? (cfg.bg || "rgba(99,102,241,0.08)") : "white", color: isActive ? (cfg.color || "#6366f1") : "#374151", fontSize:13, fontWeight: isActive ? 700 : 500, cursor:"pointer", fontFamily:"Inter, sans-serif" }}>
              {f === "NOT_ACTIVE" ? "Not Active" : f}
            </button>
          );
        })}
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
              <TH>Panchayat</TH><TH>Current Plan</TH><TH>Expiry Date</TH><TH>Status</TH><TH>Action</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ padding:"40px 16px", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No subscriptions found</td></tr>
            ) : filtered.map(row => {
              const plan = planConfig[row.planName] || planConfig.BASIC;
              const st = statusConfig[row.status] || statusConfig.NOT_ACTIVE;
              const btn = getActionBtn(row);
              const BtnIcon = btn.icon;
              return (
                <tr key={row.panchayatId} style={{ borderBottom:"1px solid #f8fafc", transition:"background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background="white"}>
                  <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600, color:"#0f172a" }}>{row.panchayatName}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ background:plan.bg, color:plan.color, border:`1px solid ${plan.border}`, fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:"0.3px" }}>
                      {row.planName}
                    </span>
                  </td>
                  <td style={{ padding:"14px 16px", fontSize:13, color: row.status==="Expired" ? "#dc2626" : "#64748b", fontWeight: row.status==="Expired" ? 600 : 400 }}>
                    {row.endDate ? new Date(row.endDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>
                      {row.status === "NOT_ACTIVE" ? "Not Active" : row.status}
                    </span>
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <button onClick={() => openModal(row)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", border:"none", borderRadius:9, background:btn.bg, color:"white", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"Inter, sans-serif", boxShadow:`0 3px 10px ${btn.shadow}`, whiteSpace:"nowrap" }}>
                      <BtnIcon size={13} />
                      {btn.label}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ReactivateSubscriptionModal
        isOpen={showModal} onClose={() => setShowModal(false)}
        plans={plans} currentPlan={selectedRow?.planName}
        panchayatName={selectedRow?.panchayatName}
        mode={modalMode} onUpgrade={handleUpgrade}
      />
    </div>
  );
}

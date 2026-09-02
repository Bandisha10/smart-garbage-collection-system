"use client";

import { useState } from 'react';
import { Search, Download, Eye } from 'lucide-react';
import PaymentDetailsModal from './PaymentDetailsModal';

const planConfig = {
  Basic:    { bg:"rgba(14,165,233,0.1)",  color:"#0ea5e9"  },
  Standard: { bg:"rgba(99,102,241,0.1)",  color:"#6366f1"  },
  Premium:  { bg:"rgba(245,158,11,0.1)",  color:"#f59e0b"  },
};
const statusConfig = {
  Successful: { bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0" },
  Pending:    { bg:"#fffbeb", color:"#d97706", border:"#fde68a" },
  Failed:     { bg:"#fef2f2", color:"#dc2626", border:"#fecaca" },
};

const TH = ({ children }) => (
  <th style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.6px", background:"#f8fafc", whiteSpace:"nowrap" }}>
    {children}
  </th>
);

export default function PaymentTable({ paymentData }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const filtered = (paymentData || []).filter(r =>
    (r.panchayatName?.toLowerCase().includes(search.toLowerCase()) || r.transactionId?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'All' || r.status === statusFilter)
  );

  const handleExport = () => {
    const headers = ['Panchayat', 'Plan', 'Amount', 'Date', 'Transaction ID', 'Status'];
    const rows = filtered.map(r => [
      `"${r.panchayatName}"`,
      r.planName,
      `"${r.amount?.replace('₹', '')}"`,
      `"${r.paymentDate}"`,
      r.transactionId,
      r.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payment_records_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, paddingTop:16, paddingBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input type="text" placeholder="Search panchayat or transaction ID…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", paddingLeft:36, paddingRight:14, paddingTop:9, paddingBottom:9, border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit", background:"#f8fafc" }}
            onFocus={e => e.target.style.borderColor="#6366f1"} onBlur={e => e.target.style.borderColor="#e2e8f0"}
          />
        </div>
        {['All','Successful','Pending','Failed'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            style={{ padding:"9px 14px", borderRadius:10, border:"1.5px solid", borderColor: statusFilter===f ? "#6366f1" : "#e2e8f0", background: statusFilter===f ? "rgba(99,102,241,0.08)" : "white", color: statusFilter===f ? "#6366f1" : "#374151", fontSize:13, fontWeight: statusFilter===f ? 700 : 500, cursor:"pointer", fontFamily:"inherit" }}>
            {f}
          </button>
        ))}
        <button 
          onClick={handleExport}
          style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, background:"white", fontSize:13, color:"#374151", cursor:"pointer", fontFamily:"inherit", fontWeight:500 }}
          onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background="white"}
        >
          <Download size={14} color="#94a3b8" /> Export
        </button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
              <TH>Panchayat</TH><TH>Plan</TH><TH>Amount</TH><TH>Date</TH><TH>Transaction ID</TH><TH>Status</TH><TH>Action</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ padding:"40px 16px", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No payments found</td></tr>
            ) : filtered.map(row => {
              const plan = planConfig[row.planName] || planConfig.Basic;
              const st = statusConfig[row.status] || statusConfig.Pending;
              return (
                <tr key={row.id} style={{ borderBottom:"1px solid #f8fafc", transition:"background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background="white"}>
                  <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600, color:"#0f172a" }}>{row.panchayatName}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ background:plan.bg, color:plan.color, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{row.planName}</span>
                  </td>
                  <td style={{ padding:"14px 16px", fontSize:14, fontWeight:700, color:"#0f172a" }}>{row.amount}</td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#64748b" }}>{row.paymentDate}</td>
                  <td style={{ padding:"14px 16px", fontSize:12, color:"#94a3b8", fontFamily:"monospace" }}>{row.transactionId}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{row.status}</span>
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <button 
                      onClick={() => setSelectedPayment(row)}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                      onMouseEnter={e => { e.currentTarget.style.background="#6366f1"; e.currentTarget.style.color="white"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#64748b"; }}
                    >
                      <Eye size={13} /> Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PaymentDetailsModal 
        open={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)} 
        payment={selectedPayment} 
      />
    </div>
  );
}

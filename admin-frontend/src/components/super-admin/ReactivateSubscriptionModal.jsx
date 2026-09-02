"use client";

import { X, Layers, Check } from "lucide-react";

const planConfig = {
  Basic:    { gradient:"linear-gradient(135deg,#0ea5e9,#38bdf8)", color:"#0ea5e9", bg:"rgba(14,165,233,0.08)",  border:"rgba(14,165,233,0.2)"  },
  Standard: { gradient:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#6366f1", bg:"rgba(99,102,241,0.08)", border:"rgba(99,102,241,0.25)" },
  Premium:  { gradient:"linear-gradient(135deg,#f59e0b,#fb923c)", color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)"  },
};

const modeLabel = {
  change:    { title:"Change Plan",           sub:"Select a new subscription plan" },
  activate:  { title:"Activate Subscription", sub:"Choose a plan to get started"   },
  reactivate:{ title:"Reactivate Subscription",sub:"Resume a subscription plan"    },
};

export default function ReactivateSubscriptionModal({ isOpen, onClose, plans, currentPlan, panchayatName, mode, onUpgrade }) {
  if (!isOpen) return null;
  const ml = modeLabel[mode] || modeLabel.reactivate;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 25px 80px rgba(0,0,0,0.2)", width:"100%", maxWidth:500, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow:"hidden", fontFamily:"Inter, sans-serif" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"24px 28px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:"rgba(99,102,241,0.2)", border:"1px solid rgba(99,102,241,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Layers size={20} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"white" }}>{ml.title}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{ml.sub}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.1)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <X size={17} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        {/* Panchayat info band */}
        <div style={{ padding:"12px 28px", background:"#f8fafc", borderBottom:"1px solid #f1f5f9", flexShrink: 0 }}>
          <span style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>Panchayat: </span>
          <span style={{ fontSize:13, color:"#0f172a", fontWeight:700 }}>{panchayatName}</span>
        </div>

        {/* Plans */}
        <div style={{ padding:"20px 24px 24px", overflowY: "auto", flexGrow: 1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:14 }}>Available Plans</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {plans.map((plan) => {
              const isCurrent = plan.name.toUpperCase() === currentPlan?.toUpperCase();
              const cfg = planConfig[plan.name] || planConfig.Basic;
              return (
                <div key={plan.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", borderRadius:12, border:`1.5px solid ${isCurrent ? cfg.border : "#f1f5f9"}`, background: isCurrent ? cfg.bg : "white", transition:"all 0.15s" }}
                  onMouseEnter={e => { if(!isCurrent) e.currentTarget.style.background="#f8fafc"; }}
                  onMouseLeave={e => { if(!isCurrent) e.currentTarget.style.background="white"; }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background: cfg.gradient }} />
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color: isCurrent ? cfg.color : "#0f172a" }}>{plan.name}</div>
                      <div style={{ fontSize:13, color:"#94a3b8", fontWeight:500 }}>{plan.price} {plan.period}</div>
                    </div>
                  </div>
                  {isCurrent ? (
                    mode === "reactivate" ? (
                      <button onClick={() => onUpgrade(plan.name)}
                        style={{ padding:"8px 18px", borderRadius:9, border:"none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 3px 10px rgba(239,68,68,0.3)` }}>
                        Renew
                      </button>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                        <Check size={13} color={cfg.color} strokeWidth={3} />
                        <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>Current Plan</span>
                      </div>
                    )
                  ) : (
                    <button onClick={() => onUpgrade(plan.name)}
                      style={{ padding:"8px 18px", borderRadius:9, border:"none", background: cfg.gradient, color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 4px 12px ${cfg.bg}` }}>
                      {mode === "activate" ? "Activate" : "Select"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

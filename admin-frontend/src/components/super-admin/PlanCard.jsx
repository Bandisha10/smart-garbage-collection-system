import { Check } from "lucide-react";

const planConfig = {
  Basic:    { gradient: "linear-gradient(135deg,#0ea5e9,#38bdf8)", iconBg: "rgba(14,165,233,0.1)", textColor: "#0ea5e9", ring: false },
  Standard: { gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)", iconBg: "rgba(99,102,241,0.1)", textColor: "#6366f1", ring: true  },
  Premium:  { gradient: "linear-gradient(135deg,#f59e0b,#fb923c)", iconBg: "rgba(245,158,11,0.1)", textColor: "#f59e0b", ring: false },
};

export default function PlanCard({ plan }) {
  const cfg = planConfig[plan.name] || planConfig.Basic;

  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: "24px",
      border: cfg.ring ? "2px solid #6366f1" : "1.5px solid #f1f5f9",
      boxShadow: cfg.ring ? "0 0 0 4px rgba(99,102,241,0.1), 0 4px 20px rgba(99,102,241,0.12)" : "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Popular badge */}
      {plan.popular && (
        <div style={{ position: "absolute", top: 16, right: 16, background: cfg.gradient, color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
          Most Popular
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: cfg.textColor, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>{plan.name}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-1px" }}>{plan.price}</span>
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, marginBottom: 4 }}>{plan.period}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f1f5f9", marginBottom: 16 }} />

      {/* Features */}
      <div style={{ marginBottom: 20 }}>
        {plan.features.map((feature, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <Check size={12} color={cfg.textColor} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ height: 4, borderRadius: 4, background: cfg.gradient }} />
    </div>
  );
}

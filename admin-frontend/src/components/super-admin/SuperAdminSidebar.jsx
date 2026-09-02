"use client";

import { LayoutDashboard, CreditCard, HelpCircle, Layers, Leaf, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { id: 1, name: "Panchayat Verification", sub: "Review & approve registrations", icon: LayoutDashboard, path: "/super-admin/dashboard" },
  { id: 2, name: "Subscription Plans",     sub: "Manage plan tiers & pricing",    icon: Layers,          path: "/super-admin/subscriptions" },
  { id: 3, name: "Payment Monitoring",     sub: "Track payments & transactions",  icon: CreditCard,      path: "/super-admin/payments" },
  { id: 4, name: "Support & Queries",      sub: "Handle tickets & issues",        icon: HelpCircle,      path: "/super-admin/support" },
];

export default function SuperAdminSidebar({ onClose }) {
  const pathname = usePathname();

  return (
    <div className="w-[260px] bg-slate-900 text-white flex flex-col h-screen shrink-0 relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute -top-[60px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)" }} />

      {/* Logo & Close Button (Mobile) */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(99,102,241,0.4)]" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <Leaf size={20} color="white" />
          </div>
          <div>
            <div className="font-extrabold text-[15px] tracking-tight text-white">EcoSyz</div>
            <div className="text-[11px] text-white/45 font-medium mt-0.5">Super Admin Portal</div>
          </div>
        </div>
        {/* Close Button only visible on small screens */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2 text-[10px] font-bold text-white/30 tracking-widest uppercase">
        Navigation
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => { if (typeof window !== "undefined" && window.innerWidth < 1024 && onClose) onClose(); }}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer no-underline relative transition-all duration-150
                ${isActive ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 sidebar-nav-item"}
              `}
            >
              {/* Active left bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-indigo-500 rounded-r-sm" />
              )}
              <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${isActive ? "bg-indigo-500/25" : "bg-white/5"}`}>
                <Icon size={17} color={isActive ? "#818cf8" : "rgba(255,255,255,0.45)"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] leading-[1.2] ${isActive ? "font-bold text-indigo-100" : "font-medium text-white/70"}`}>{item.name}</div>
                <div className="text-[11px] text-white/30 mt-0.5 truncate">{item.sub}</div>
              </div>
              {isActive && <ChevronRight size={14} color="#6366f1" className="shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom bar */}
      <div className="p-4 border-t border-white/5 mx-1 mb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-extrabold text-[14px] text-white shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>S</div>
          <div>
            <div className="text-[13px] font-semibold text-white/85">Super Admin</div>
            <div className="text-[11px] text-white/35">ecosyz.in</div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../api/axios";
import SubscriptionExpiredOverlay from "./SubscriptionExpiredOverlay";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";

const GRACE_DAYS = 7; // days after expiry before blocking

function isExpiredPastGrace(endDate) {
  if (!endDate) return false;
  const expiry = new Date(endDate);
  const graceCutoff = new Date(expiry.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
  return new Date() > graceCutoff;
}

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  // "checking" | "authorized" | "unauthorized" | "expired"
  const [subInfo, setSubInfo] = useState({ planName: null, expiredOn: null });

  useEffect(() => {
    let alive = true;

    const checkAuth = async () => {
      try {
        const { data: meData } = await api.get("/auth/me");

        // Prevent Super Admin from entering Panchayat Admin panel -> redirect to Super Admin
        if (meData?.user?.role === "COMPANY_ADMIN") {
          if (alive) {
            setStatus("unauthorized");
            router.replace("/super-admin/dashboard");
          }
          return;
        }

        // Only allow ADMIN and PANCHAYAT_ADMIN
        if (meData?.user?.role !== "ADMIN" && meData?.user?.role !== "PANCHAYAT_ADMIN") {
          toast.error("Unauthorized: Access denied for this portal.");
          if (alive) {
            setStatus("unauthorized");
            router.replace("/");
          }
          return;
        }

        // Check subscription status
        try {
          const { data } = await api.get("/auth/profile");
          const sub = data?.subscription;

          if (
            sub &&
            isExpiredPastGrace(sub.endDate)
          ) {
            if (alive) {
              setSubInfo({ planName: sub.plan, expiredOn: sub.endDate });
              setStatus("expired");
            }
            return;
          }
        } catch {
          // If subscription fetch fails, don't block — let them through
        }

        if (alive) setStatus("authorized");
      } catch {
        if (alive) {
          setStatus("unauthorized");
          router.replace("/");
        }
      }
    };

    checkAuth();
    return () => {
      alive = false;
    };
  }, [router]);

  if (status === "checking") {
    return <LoadingSpinner />;
  }

  if (status === "unauthorized") {
    return null;
  }

  if (status === "expired") {
    return (
      <>
        {/* Render page blurred behind the overlay so it's visible but unusable */}
        <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", overflow: "hidden", height: "100vh" }}>
          {children}
        </div>
        <SubscriptionExpiredOverlay
          planName={subInfo.planName}
          expiredOn={subInfo.expiredOn}
        />
      </>
    );
  }

  return children;
}

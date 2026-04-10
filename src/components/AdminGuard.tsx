"use client";
// ============================================================
//  ADMIN GUARD COMPONENT
//  Wrap any admin page with this to require login.
//  If not logged in → redirects to /admin/login automatically.
//
//  Usage:
//    export default function AdminOrdersPage() {
//      return (
//        <AdminGuard>
//          ... your page content ...
//        </AdminGuard>
//      );
//    }
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const isAuth = sessionStorage.getItem("adminAuth") === "true";
    if (!isAuth) {
      router.replace("/admin/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
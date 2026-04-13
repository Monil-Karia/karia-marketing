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
import { useRouter, usePathname } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed]   = useState(false);

  useEffect(() => {
    // Don't run guard on the login page itself
    if (pathname === "/admin/login") {
      setChecked(true);
      setAuthed(true);
      return;
    }

    const isAuth = sessionStorage.getItem("adminAuth") === "true";
    if (!isAuth) {
      // Replace so back button doesn't loop back to protected page
      router.replace("/admin/login");
    } else {
      setAuthed(true);
      setChecked(true);
    }
  }, [router, pathname]);

  // Show spinner while checking
  if (!checked || !authed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--saffron)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading admin panel…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
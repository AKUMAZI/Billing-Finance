"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  CreditCard,
  ShieldCheck,
  BarChart2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "New Bill", href: "/billing/new", icon: FilePlus },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Insurance Claims", href: "/insurance", icon: ShieldCheck },
  { label: "Reports", href: "/reports", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        backgroundColor: "#0f1f2e",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "#1a6b8a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "18px",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          H
        </div>
        <div>
          <div
            style={{
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "13px",
              lineHeight: "1.2",
            }}
          >
            Smart Healthcare
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "11px",
              marginTop: "2px",
            }}
          >
            Management System
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "4px",
                textDecoration: "none",
                backgroundColor: isActive
                  ? "#1a6b8a"
                  : "transparent",
                color: isActive
                  ? "#ffffff"
                  : "rgba(255,255,255,0.55)",
                fontWeight: isActive ? "600" : "400",
                fontSize: "14px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.55)";
                }
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

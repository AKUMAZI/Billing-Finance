"use client";

import Sidebar from "@/components/sidebar";
import {
  TrendingUp,
  FileText,
  CreditCard,
  AlertCircle,
  Bell,
} from "lucide-react";

type PaymentStatus = "Paid" | "Pending" | "Unpaid";
interface Transaction {
  name: string;
  billId: string;
  amount: number;
  status: PaymentStatus;
}

interface DueItem {
  name: string;
  dueDate: string;
  balance: number;
}

// Mock Data (replace with API calls later)

const recentTransactions: Transaction[] = [
  { name: "Juan dela Cruz", billId: "BILL-2024-00389", amount: 4500, status: "Paid" },
  { name: "Maria Santos", billId: "BILL-2024-00390", amount: 85000, status: "Pending" },
  { name: "Jose Rizal Jr.", billId: "BILL-2024-00391", amount: 125000, status: "Unpaid" },
];

const upcomingDues: DueItem[] = [
  { name: "Maria Santos", dueDate: "April 6, 2024", balance: 35000 },
  { name: "Jose Rizal Jr.", dueDate: "April 4, 2024", balance: 80000 },
];


function formatPHP(amount: number) {
  return "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

const statusStyle: Record<PaymentStatus, React.CSSProperties> = {
  Paid: {
    backgroundColor: "#16a34a",
    color: "#fff",
  },
  Pending: {
    backgroundColor: "#f97316",
    color: "#fff",
  },
  Unpaid: {
    backgroundColor: "#dc2626",
    color: "#fff",
  },
};

function StatCard({
  label,
  value,
  sub,
  subColor,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: "1 1 0",
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "22px 24px",
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "13px", color: "#6b7280" }}>{label}</span>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: "700",
          color: "#0f1f2e",
          lineHeight: "1.1",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", color: subColor ?? "#6b7280" }}>{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f6fa" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header
          style={{
            height: "60px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            flexShrink: 0,
          }}
        >
          <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#0f1f2e" }}>
            Billing &amp; Finance – Dashboard
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {/* Bell */}
            <div style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={20} color="#6b7280" />
              <span
                style={{
                  position: "absolute",
                  top: "-3px",
                  right: "-3px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                }}
              />
            </div>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "#0f1f2e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                AD
              </div>
              <span style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>
                Admin User
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ padding: "28px", flex: 1 }}>
          {/* Stat Cards */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <StatCard
              label="Total Revenue (MTD)"
              value="₱2,450,000"
              sub="+12.5% from last month"
              subColor="#16a34a"
              icon={<TrendingUp size={18} />}
            />
            <StatCard
              label="Pending Invoices"
              value="23"
              sub="₱485,000 outstanding"
              icon={<FileText size={18} />}
            />
            <StatCard
              label="Payments Today"
              value="₱125,000"
              sub="+8.2% from last month"
              subColor="#16a34a"
              icon={<CreditCard size={18} />}
            />
            <StatCard
              label="Overdue Accounts"
              value="5"
              sub="₱92,000 overdue"
              subColor="#dc2626"
              icon={<AlertCircle size={18} color="#dc2626" />}
            />
          </div>

          {/* Bottom Row */}
          <div style={{ display: "flex", gap: "16px" }}>
            {/* Recent Transactions */}
            <div
              style={{
                flex: 2,
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#0f1f2e",
                  marginBottom: "20px",
                }}
              >
                Recent Transactions
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {recentTransactions.map((tx, i) => (
                  <div
                    key={tx.billId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 0",
                      borderBottom:
                        i < recentTransactions.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {tx.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        {tx.billId}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#0f1f2e",
                        }}
                      >
                        {formatPHP(tx.amount)}
                      </span>
                      <span
                        style={{
                          ...statusStyle[tx.status],
                          padding: "3px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          minWidth: "64px",
                          textAlign: "center",
                        }}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Due Dates */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#0f1f2e",
                  marginBottom: "20px",
                }}
              >
                Upcoming Due Dates
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {upcomingDues.map((due, i) => (
                  <div
                    key={due.name + i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "16px 0",
                      borderBottom:
                        i < upcomingDues.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {due.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        Due: {due.dueDate}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#dc2626",
                        }}
                      >
                        {formatPHP(due.balance)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        Balance
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

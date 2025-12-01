"use client";

import { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import { fetchInvoiceByUser, invoiceSummary } from "@/services/invoice.api";
import { IInvoiceSummaryByUser, InvoiceInfo } from "@/types/invoice";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  // ===================== STATE =====================
  const [summaryData, setSummaryData] = useState<IInvoiceSummaryByUser[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const { user } = useAuth();

  // ===================== EFFECTS =====================
  // Xác định kích thước màn hình
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ===================== Lấy danh sách hoá đơn =====================

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;

      try {
        const res = await invoiceSummary(user._id);

        // console.log(res.data);
        setSummaryData(res.data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
      }
    };
    fetchInvoices();
  }, [user]);

  // ===================== TÍNH TOÁN SỐ LIỆU =====================
  const { totalCollected, totalNotCollected, collected, notCollected } = useMemo(() => {
    const totalCollected = summaryData.reduce((sum, inv) => sum + (inv.collectedTotal || 0), 0);
    const totalNotCollected = summaryData.reduce((sum, inv) => sum + (inv.notCollectedTotal || 0), 0);
    const collected = summaryData.reduce((sum, inv) => sum + (inv.collectedCount || 0), 0);
    const notCollected = summaryData.reduce((sum, inv) => sum + (inv.notCollectedCount || 0), 0);

    return { totalCollected, totalNotCollected, collected, notCollected };
  }, [summaryData]);

  // ===================== DỮ LIỆU BIỂU ĐỒ =====================
  const chartData = [
    { name: "Đã thu", value: collected },
    { name: "Chưa thu", value: notCollected },
  ];

  const COLORS = ["#4CAF50", "#F44336"];

  // ===================== RENDER =====================
  return (
    <ProtectedRoute allowedRoles={["admin", "internal"]} redirectTo="/optimalsumfinder">
      <div className="flex flex-col items-center py-10 px-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">📈 Thống kê hoá đơn</h2>

        {/* ----- Biểu đồ ----- */}
        <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-stretch">
          {/* Biểu đồ tròn */}
          <div className="w-full md:w-1/2 bg-white shadow-lg rounded-2xl p-6">
            <h3 className="text-center font-semibold mb-4 text-gray-700">Tỷ lệ hóa đơn</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 70 : 80}
                  labelLine={false}
                  dataKey="value"
                  label={({ name, value }) => (isMobile ? `${value}` : `${name}: ${value}`)}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ----- Tổng tiền ----- */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <SummaryCard label="Tổng tiền đã thu" value={totalCollected} color="green" />
          <SummaryCard label="Tổng tiền chưa thu" value={totalNotCollected} color="red" />
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ===================== COMPONENT PHỤ =====================
function SummaryCard({ label, value, color }: { label: string; value: number; color: "green" | "red" }) {
  const colorClass = color === "green" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  return (
    <div className={`${colorClass} px-6 py-4 rounded-lg shadow-md min-w-[180px] text-center`}>
      <p className="font-semibold">{label}</p>
      <p className="text-xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

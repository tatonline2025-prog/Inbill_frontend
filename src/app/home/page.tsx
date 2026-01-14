"use client";

import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { invoiceSummary } from "@/services/invoice.api";
import { IInvoiceSummaryByUser } from "@/types/invoice";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  // ===================== STATE =====================
  const [summaryData, setSummaryData] = useState<IInvoiceSummaryByUser[]>([]);
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [isMobile, setIsMobile] = useState(false);

  // ===================== EFFECTS =====================
  // Xác định kích thước màn hình
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lấy danh sách hoá đơn
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await invoiceSummary();

        // console.log(res.data);
        setSummaryData(res.data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
      }
    };
    fetchInvoices();
  }, []);

  // ===================== FILTER =====================
  const filteredInvoices = useMemo(() => {
    return summaryData.filter((inv) => {
      const matchUser = filterAssignedUser === "all" ? true : inv.assignedTo?._id === filterAssignedUser;

      return matchUser;
    });
  }, [summaryData, filterAssignedUser]);

  // ===================== TÍNH TOÁN SỐ LIỆU =====================
  const { totalCollected, totalNotCollected, totalIsPaid, collected, notCollected, isPaid } = useMemo(() => {
    const totalCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.collectedTotal || 0), 0);
    const totalNotCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.notCollectedTotal || 0), 0);
    const totalIsPaid = filteredInvoices.reduce((sum, inv) => sum + (inv.paidTotal || 0), 0);
    const collected = filteredInvoices.reduce((sum, inv) => sum + (inv.collectedCount || 0), 0);
    const notCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.notCollectedCount || 0), 0);
    const isPaid = filteredInvoices.reduce((sum, inv) => sum + (inv.paidCount || 0), 0);

    return { totalCollected, totalNotCollected, totalIsPaid, collected, notCollected, isPaid };
  }, [filteredInvoices]);

  // ===================== DỮ LIỆU BIỂU ĐỒ =====================
  const chartData = [
    { name: "Đã thu", value: collected },
    { name: "Chưa thu", value: notCollected },
    { name: "Đã đóng cước", value: isPaid },
  ];

  const COLORS = ["#4CAF50", "#F44336", "#3692f4ff"];

  // ===================== RENDER =====================
  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="flex flex-col items-center py-10 px-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">📈 Thống kê hoá đơn</h2>

        {/* ----- Bộ lọc ----- */}
        {/* <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div>
            <label className="block text-sm font-semibold mb-1">Người đảm nhận:</label>
            <select
              value={filterAssignedUser}
              onChange={(e) => setFilterAssignedUser(e.target.value)}
              className="border px-3 py-2 rounded-md text-sm"
            >
              <option value="all">Tất cả</option>
              {summaryData.map((user) => (
                <option key={user?.assignedTo?._id} value={user?.assignedTo?._id}>
                  {user?.assignedTo?.fullName || user?.assignedTo?.email}
                </option>
              ))}
            </select>
          </div>
        </div> */}

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
          <SummaryCard label="Tổng tiền đã đóng cước" value={totalIsPaid} color="blue" />
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ===================== COMPONENT PHỤ =====================
function SummaryCard({ label, value, color }: { label: string; value: number; color: "green" | "red" | "blue" }) {
  const colorMap = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <div className={`${colorMap[color]} px-6 py-4 rounded-lg shadow-md min-w-[180px] text-center`}>
      <p className="font-semibold">{label}</p>
      <p className="text-xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

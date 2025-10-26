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

export default function Dashboard() {
  // ===================== STATE =====================
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [summaryData, setSummaryData] = useState<IInvoiceSummaryByUser[]>([]);
  const [filterPeriod, setFilterPeriod] = useState("all");
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

  // ===================== FILTER =====================
  const filteredInvoices = useMemo(() => {
    return summaryData.filter((inv) => {
      const matchPeriod = filterPeriod === "all" ? true : inv.billing_period === filterPeriod;
      return matchPeriod;
    });
  }, [summaryData, filterPeriod]);

  // ===================== TÍNH TOÁN SỐ LIỆU =====================
  const { totalCollected, totalNotCollected, collected, notCollected } = useMemo(() => {
    const totalCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.collectedTotal || 0), 0);
    const totalNotCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.notCollectedTotal || 0), 0);
    const collected = filteredInvoices.reduce((sum, inv) => sum + (inv.collectedCount || 0), 0);
    const notCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.notCollectedCount || 0), 0);

    return { totalCollected, totalNotCollected, collected, notCollected };
  }, [filteredInvoices]);

  // ===================== DỮ LIỆU BIỂU ĐỒ =====================
  const chartData = [
    { name: "Đã thu", value: collected },
    { name: "Chưa thu", value: notCollected },
  ];

  const monthlyData = useMemo(() => {
    const map = new Map<string, { collectedTotal: number; notCollectedTotal: number }>();

    filteredInvoices.forEach((inv) => {
      const key = inv.billing_period;
      if (!key) return;

      const collected = inv.collectedTotal || 0;
      const notCollected = inv.notCollectedTotal || 0;

      if (!map.has(key)) map.set(key, { collectedTotal: 0, notCollectedTotal: 0 });

      const item = map.get(key)!;
      item.collectedTotal += collected;
      item.notCollectedTotal += notCollected;
    });

    // Trả về mảng để dùng hiển thị biểu đồ
    return Array.from(map.entries()).map(([period, values]) => ({
      period,
      ...values,
    }));
  }, [filteredInvoices]);

  const billingPeriods = Array.from(new Set(summaryData.map((inv) => inv.billing_period).filter(Boolean))).sort();

  const COLORS = ["#4CAF50", "#F44336"];

  // ===================== RENDER =====================
  return (
    <div className="flex flex-col items-center py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">📈 Thống kê hoá đơn</h2>

      {/* ----- Bộ lọc ----- */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Kỳ thanh toán */}
        <div>
          <label className="block text-sm font-semibold mb-1">Tháng nợ:</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm"
          >
            <option value="all">Tất cả</option>
            {billingPeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </div>

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

        {/* Biểu đồ cột */}
        <div className="w-full md:w-1/2 bg-white shadow-lg rounded-2xl p-6">
          <h3 className="text-center font-semibold mb-4 text-gray-700">Tổng tiền theo tháng</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[600px] h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString("vi-VN")} />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Bar dataKey="collectedTotal" fill="#4CAF50" name="Đã thu" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="notCollectedTotal" fill="#F44336" name="Chưa thu" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ----- Tổng tiền ----- */}
      <div className="flex flex-wrap justify-center gap-6 mt-8">
        <SummaryCard label="Tổng tiền đã thu" value={totalCollected} color="green" />
        <SummaryCard label="Tổng tiền chưa thu" value={totalNotCollected} color="red" />
      </div>
    </div>
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

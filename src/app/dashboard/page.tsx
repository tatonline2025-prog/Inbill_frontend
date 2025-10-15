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
import { fetchallInvoice } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";

export default function Dashboard() {
  // ===================== STATE =====================
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
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
        const res = await fetchallInvoice();
        setInvoices(res.data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
      }
    };
    fetchInvoices();
  }, []);

  // ===================== FILTER =====================
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchUser = filterAssignedUser === "all" ? true : inv.assignedTo?._id === filterAssignedUser;
      const matchPeriod = filterPeriod === "all" ? true : inv.billing_period === filterPeriod;
      return matchUser && matchPeriod;
    });
  }, [invoices, filterAssignedUser, filterPeriod]);

  // ===================== TÍNH TOÁN SỐ LIỆU =====================
  const parseAmount = (amount: string | number | null | undefined): number => {
    if (!amount) return 0;
    if (typeof amount === "number") return amount;
    return Number(amount.replace(/\./g, "").replace(/,/g, ""));
  };

  const { collected, notCollected, totalCollected, totalNotCollected } = useMemo(() => {
    const collected = filteredInvoices.filter((inv) => inv.collectionStatus === "collected");
    const notCollected = filteredInvoices.filter((inv) => inv.collectionStatus === "not_collected");

    const sum = (arr: InvoiceInfo[]) =>
      arr
        .map((inv) => parseAmount(inv.totalAmount))
        .filter((v) => !isNaN(v))
        .reduce((a, b) => a + b, 0);

    return {
      collected,
      notCollected,
      totalCollected: sum(collected),
      totalNotCollected: sum(notCollected),
    };
  }, [filteredInvoices]);

  // ===================== DỮ LIỆU BIỂU ĐỒ =====================
  const chartData = [
    { name: "Đã thu", value: collected.length },
    { name: "Chưa thu", value: notCollected.length },
  ];

  const monthlyData = useMemo(() => {
    const map = new Map<string, { collected: number; notCollected: number }>();

    invoices.forEach((inv) => {
      if (!inv.billing_period) return;
      const key = inv.billing_period;
      const amount = parseAmount(inv.totalAmount);
      if (isNaN(amount)) return;

      if (!map.has(key)) map.set(key, { collected: 0, notCollected: 0 });
      const item = map.get(key)!;
      if (inv.collectionStatus === "collected") item.collected += amount;
      else item.notCollected += amount;
    });

    const years = Array.from(map.keys()).map((p) => Number(p.split("/")[1]));
    const targetYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

    return Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, "0");
      const key = `${month}/${targetYear}`;
      const values = map.get(key) || { collected: 0, notCollected: 0 };
      return { period: key, ...values };
    });
  }, [invoices]);

  const billingPeriods = Array.from(new Set(invoices.map((inv) => inv.billing_period).filter(Boolean))).sort();

  const uniqueAssignedUsers = useMemo(() => {
    const data = filterPeriod === "all" ? invoices : invoices.filter((inv) => inv.billing_period === filterPeriod);
    return Array.from(
      new Map(data.filter((inv) => inv.assignedTo).map((inv) => [inv.assignedTo!._id, inv.assignedTo])).values()
    );
  }, [invoices, filterPeriod]);

  const COLORS = ["#4CAF50", "#F44336"];

  // ===================== RENDER =====================
  return (
    <div className="flex flex-col items-center py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">📈 Thống kê hoá đơn</h2>

      {/* ----- Bộ lọc ----- */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Người đảm nhận */}
        <div>
          <label className="block text-sm font-semibold mb-1">Người đảm nhận:</label>
          <select
            value={filterAssignedUser}
            onChange={(e) => setFilterAssignedUser(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm"
          >
            <option value="all">Tất cả</option>
            {uniqueAssignedUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.fullName || user.email}
              </option>
            ))}
          </select>
        </div>

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
                  <Bar dataKey="collected" fill="#4CAF50" name="Đã thu" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="notCollected" fill="#F44336" name="Chưa thu" radius={[4, 4, 0, 0]} />
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

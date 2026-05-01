"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { fetchallInvoice } from "@/services/invoice.api";
import { fetchallUser } from "@/services/user.api";
import { InvoiceInfo } from "@/types/invoice";
import { IUser } from "@/types/user";
import { Pagination } from "@mui/material";

const PAGE_SIZE = 50;

function fmt(amount: string | number | null | undefined) {
  if (!amount) return "";
  const n = parseFloat(String(amount).replace(/[^\d.-]/g, ""));
  if (isNaN(n)) return String(amount);
  return n.toLocaleString("vi-VN");
}

function statusBadge(s: "collected" | "not_collected") {
  return s === "collected" ? (
    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">Đã thu</span>
  ) : (
    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">Chưa thu</span>
  );
}

export default function AllInvoicesPage() {
  // ── Filters ──
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchStation, setSearchStation] = useState("");
  const [searchUser, setSearchUser] = useState("all");
  const [collectionStatus, setCollectionStatus] = useState<"" | "collected" | "not_collected">("");

  // Applied filters (trigger fetch)
  const [appliedCode, setAppliedCode] = useState("");
  const [appliedName, setAppliedName] = useState("");
  const [appliedStation, setAppliedStation] = useState("");
  const [appliedUser, setAppliedUser] = useState("all");
  const [appliedStatus, setAppliedStatus] = useState<"" | "collected" | "not_collected">("");

  // ── Data ──
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<IUser[]>([]);

  // ── Fetch users for dropdown ──
  useEffect(() => {
    fetchallUser()
      .then((r) => setUsers(r.data.user.filter((u) => u.usertype === "internal")))
      .catch(() => {});
  }, []);

  // ── Fetch invoices ──
  const load = useCallback(async (pg: number) => {
    try {
      setLoading(true);
      const res = await fetchallInvoice(
        pg,
        PAGE_SIZE,
        undefined, // printStatus
        appliedStatus || undefined,
        appliedUser !== "all" ? appliedUser : undefined,
        undefined, // province
        appliedCode || undefined,
        appliedStation || undefined,
        undefined, // userprovince
        null, // sortField
        undefined, // sortDirection
        undefined, // isPaid
        undefined, // onlyDuplicates
        appliedName || undefined
      );
      setInvoices(res.data.data);
      setTotalInvoices(res.data.summary.totalInvoices);
      setTotalAmount(res.data.summary.totalAmount);
      setTotalPages(res.data.pagination.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [appliedCode, appliedName, appliedStation, appliedUser, appliedStatus]);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const handleSearch = () => {
    setAppliedCode(searchCode.trim());
    setAppliedName(searchName.trim());
    setAppliedStation(searchStation.trim());
    setAppliedUser(searchUser);
    setAppliedStatus(collectionStatus);
    setPage(1);
  };

  const handleReset = () => {
    setSearchCode(""); setSearchName(""); setSearchStation(""); setSearchUser("all"); setCollectionStatus("");
    setAppliedCode(""); setAppliedName(""); setAppliedStation(""); setAppliedUser("all"); setAppliedStatus("");
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, val: number) => {
    setPage(val);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/home">
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 Danh sách tổng hóa đơn</h1>

          {/* ── Summary ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl shadow-sm border p-3 text-center">
              <div className="text-xs text-gray-500 uppercase font-semibold">Tổng hóa đơn</div>
              <div className="text-xl font-bold text-blue-600">{totalInvoices.toLocaleString("vi-VN")}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-3 text-center">
              <div className="text-xs text-gray-500 uppercase font-semibold">Tổng tiền</div>
              <div className="text-xl font-bold text-green-600">{totalAmount.toLocaleString("vi-VN")}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-3 text-center col-span-2 sm:col-span-1">
              <div className="text-xs text-gray-500 uppercase font-semibold">Trang hiện tại</div>
              <div className="text-xl font-bold text-gray-700">{page} / {totalPages}</div>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã KH</label>
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Nhập mã KH..."
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên KH</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Nhập tên..."
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạm</label>
                <input
                  type="text"
                  value={searchStation}
                  onChange={(e) => setSearchStation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Mã trạm..."
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Người phụ trách</label>
                <select
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.fullName || u.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                <select
                  value={collectionStatus}
                  onChange={(e) => setCollectionStatus(e.target.value as "" | "collected" | "not_collected")}
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="not_collected">Chưa thu</option>
                  <option value="collected">Đã thu</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={handleReset}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Đặt lại
              </button>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                🔍 Tìm kiếm
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <th className="px-3 py-3 text-center font-semibold w-10">STT</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Mã KH</th>
                  <th className="px-3 py-3 text-left font-semibold min-w-[160px]">Tên KH</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Trạm</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Tỉnh</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Kỳ TT</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Tổng tiền</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Người phụ trách</th>
                  <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Trạng thái</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Ngày thu</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-gray-400">Đang tải...</td>
                  </tr>
                )}
                {!loading && invoices.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-gray-400">Không có dữ liệu</td>
                  </tr>
                )}
                {!loading && invoices.map((inv, idx) => (
                  <tr
                    key={inv._id}
                    className={`border-t border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50"}`}
                  >
                    <td className="px-3 py-2 text-center text-gray-400 text-xs">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{inv.invoiceNumber}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{inv.customerName}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{inv.recordBookCode || ""}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{inv.province || ""}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{inv.billing_period || ""}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fmt(inv.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {inv.assignedTo?.fullName || ""}
                    </td>
                    <td className="px-3 py-2 text-center">{statusBadge(inv.collectionStatus)}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                      {inv.collectionDate
                        ? new Date(inv.collectionDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-5">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

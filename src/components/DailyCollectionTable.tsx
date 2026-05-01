"use client";

import { useEffect, useState } from "react";
import { dailyCollectionSummaryAPI, IDailyCollectionSummary } from "@/services/invoice.api";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";

// Lấy ngày dạng "YYYY-MM-DD" tính theo giờ VN
function toVNDateStr(d: Date) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

export default function DailyCollectionTable() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // ── Filter states ──────────────────────────────────────────────
  const [mode, setMode] = useState<"days" | "range">("days");
  const [days, setDays] = useState(31);
  const today = toVNDateStr(new Date());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [assignedUserId, setAssignedUserId] = useState("all");

  // ── Data states ────────────────────────────────────────────────
  const [rows, setRows] = useState<IDailyCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);

  // ── Fetch danh sách user (chỉ admin) ──────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    fetchallUser()
      .then((res) => setUsers(res.data.user.filter((u) => u.usertype === "internal")))
      .catch(() => {});
  }, [isAdmin]);

  // ── Fetch dữ liệu thống kê ─────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const params =
        mode === "range"
          ? { dateFrom, dateTo, assignedUserId }
          : { days, assignedUserId };
      const res = await dailyCollectionSummaryAPI(params);
      setRows(res.data);
    } catch (e) {
      console.error(e);
      setError("Không tải được dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tổng hợp
  const totalCount = rows.reduce((s, r) => s + r.totalCount, 0);
  const totalAmount = rows.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-4 sm:p-6">
      {/* ── Bộ lọc ── */}
      <div className="mb-4 space-y-3">
        {/* Chọn chế độ */}
        <div className="flex gap-3 flex-wrap items-center">
          <span className="text-sm font-semibold text-gray-600">Chế độ:</span>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input
              type="radio"
              name="mode"
              checked={mode === "days"}
              onChange={() => setMode("days")}
              className="accent-blue-600"
            />
            N ngày gần nhất
          </label>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input
              type="radio"
              name="mode"
              checked={mode === "range"}
              onChange={() => setMode("range")}
              className="accent-blue-600"
            />
            Khoảng ngày
          </label>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3 items-end">
          {mode === "days" ? (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số ngày</label>
              <select
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                {[7, 14, 31, 60, 90].map((d) => (
                  <option key={d} value={d}>{d} ngày</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Từ ngày</label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFrom}
                  max={dateTo}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đến ngày</label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateTo}
                  min={dateFrom}
                  max={today}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </>
          )}

          {isAdmin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Người phụ trách</label>
              <select
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.fullName || u.username}</option>
                ))}
              </select>
            </div>
          )}

          <button
            className="bg-blue-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Đang tải..." : "🔍 Xem"}
          </button>
        </div>
      </div>

      {error && <p className="text-center text-red-600 mb-2">{error}</p>}

      {/* ── Bảng kết quả ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold whitespace-nowrap">Ngày</th>
              <th className="border border-gray-300 px-3 py-2 text-right font-semibold whitespace-nowrap">Tổng HĐ</th>
              <th className="border border-gray-300 px-3 py-2 text-right font-semibold whitespace-nowrap">Tổng tiền</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Người phụ trách</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && rows.map((r) => {
              const empty = r.totalCount === 0;
              return (
                <tr key={r.date} className={empty ? "text-gray-300" : ""}>
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right whitespace-nowrap">
                    {empty ? "" : r.totalCount.toLocaleString("vi-VN")}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right whitespace-nowrap">
                    {empty ? "" : r.totalAmount.toLocaleString("vi-VN")}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {empty ? "" : r.assignedUsers.filter(Boolean).join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Dòng tổng */}
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr className="bg-blue-50 font-semibold">
                <td className="border border-gray-300 px-3 py-2">Tổng cộng</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{totalCount.toLocaleString("vi-VN")}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{totalAmount.toLocaleString("vi-VN")}</td>
                <td className="border border-gray-300 px-3 py-2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}


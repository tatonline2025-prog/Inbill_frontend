"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { dailyCollectionSummaryAPI, IDailyCollectionSummary } from "@/services/invoice.api";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";

function toVNDateStr(date: Date) {
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

export default function DailyCollectionTable() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [mode, setMode] = useState<"days" | "range">("days");
  const [days, setDays] = useState(31);
  const today = toVNDateStr(new Date());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [assignedUserId, setAssignedUserId] = useState("all");

  const [rows, setRows] = useState<IDailyCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    fetchallUser()
      .then((response) => setUsers(response.data.user.filter((item) => item.usertype === "internal")))
      .catch(() => {});
  }, [isAdmin]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = mode === "range" ? { dateFrom, dateTo, assignedUserId } : { days, assignedUserId };
      const response = await dailyCollectionSummaryAPI(params);
      setRows(response.data);
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = rows.reduce((sum, row) => sum + row.totalCount, 0);
  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-lg sm:p-6">
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Chế độ:</span>
          <label className="flex cursor-pointer items-center gap-1 text-sm">
            <input
              type="radio"
              name="mode"
              checked={mode === "days"}
              onChange={() => setMode("days")}
              className="accent-blue-600"
            />
            N ngày gần nhất
          </label>
          <label className="flex cursor-pointer items-center gap-1 text-sm">
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

        <div className="flex flex-wrap items-end gap-3">
          {mode === "days" ? (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Số ngày</label>
              <select
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                {[7, 14, 31, 60, 90].map((value) => (
                  <option key={value} value={value}>
                    {value} ngày
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Từ ngày</label>
                <input
                  type="date"
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFrom}
                  max={dateTo}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Đến ngày</label>
                <input
                  type="date"
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateTo}
                  min={dateFrom}
                  max={today}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>
            </>
          )}

          {isAdmin && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Người phụ trách</label>
              <select
                className="min-w-[160px] rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={assignedUserId}
                onChange={(event) => setAssignedUserId(event.target.value)}
              >
                <option value="all">Tất cả</option>
                {users.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.fullName || item.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Đang tải..." : "Xem"}
          </button>
        </div>
      </div>

      {error && <p className="mb-2 text-center text-red-600">{error}</p>}

      {!loading && rows.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-600">Tổng số đơn</div>
            <div className="mt-1 text-2xl font-bold text-blue-900">{totalCount.toLocaleString("vi-VN")}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-600">Tổng tiền</div>
            <div className="mt-1 text-2xl font-bold text-emerald-900">
              {totalAmount.toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-left font-semibold">Ngày</th>
              <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-right font-semibold">Tổng HĐ</th>
              <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-right font-semibold">Tổng tiền</th>
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

            {!loading &&
              rows.map((row) => {
                const isEmpty = row.totalCount === 0;
                return (
                  <tr key={row.date} className={isEmpty ? "text-gray-300" : ""}>
                    <td className="whitespace-nowrap border border-gray-300 px-3 py-2">{row.date}</td>
                    <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-right">
                      {isEmpty ? "" : row.totalCount.toLocaleString("vi-VN")}
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-right">
                      {isEmpty ? "" : row.totalAmount.toLocaleString("vi-VN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {isEmpty ? "" : row.assignedUsers.filter(Boolean).join(", ")}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

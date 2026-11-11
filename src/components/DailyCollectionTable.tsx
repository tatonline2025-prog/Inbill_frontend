"use client";

import { useEffect, useState } from "react";
import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select } from "@mui/material";
import { ensureAreaPrefixes } from "@/lib/area-prefix";

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
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [rows, setRows] = useState<IDailyCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);

  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setInitialized(false);
    setError(null);
    setRows([]);

    const initialize = async () => {
      try {
        let defaults: string[] = [];
        if (isAdmin) {
          const response = await fetchallUser();
          if (cancelled) return;
          const available = response.data.user.filter((item) => item.usertype === "internal");
          defaults = available.filter((item) => ensureAreaPrefixes(item.areaPrefixes).some((entry) =>
            ["Lấp Vò", "Lai Vung"].some((area) => entry.area.localeCompare(area, "vi", { sensitivity: "base" }) === 0)
          )).map((item) => item._id);
          setUsers(available);
          setAssignedUserIds(defaults);
        }
        setInitialized(true);
        if (isAdmin && defaults.length === 0) return;
        const response = await dailyCollectionSummaryAPI({
          days: 31,
          ...(isAdmin ? { assignedUserIds: defaults } : {}),
        });
        if (!cancelled) setRows(response.data);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("Không tải được dữ liệu thống kê hoặc danh sách người phụ trách. Vui lòng tải lại trang.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, [userId, isAdmin]);

  const load = async () => {
    if (!initialized || (isAdmin && assignedUserIds.length === 0)) return;
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...(mode === "range" ? { dateFrom, dateTo } : { days }),
        ...(isAdmin ? { assignedUserIds } : {}),
      };
      const response = await dailyCollectionSummaryAPI(params);
      setRows(response.data);
    } catch (loadError) {
      console.error(loadError);
      setRows([]);
      setError("Không tải được dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

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
            <FormControl size="small" sx={{ minWidth: 240, width: 320, maxWidth: "100%" }}>
              <InputLabel id="daily-assignees-label" shrink>Người phụ trách</InputLabel>
              <Select<string[]>
                labelId="daily-assignees-label"
                label="Người phụ trách"
                multiple
                value={assignedUserIds}
                disabled={!initialized || loading}
                onChange={(event) => {
                  const value = event.target.value;
                  const selected = typeof value === "string" ? value.split(",") : value;
                  if (selected.includes("__all")) setAssignedUserIds(users.map((item) => item._id));
                  else if (selected.includes("__clear") || selected.length === 0) {
                    setAssignedUserIds([]);
                    setRows([]);
                  } else setAssignedUserIds(selected);
                }}
                renderValue={(selected) => selected.length === users.length && users.length > 0
                  ? `Tất cả (${selected.length})`
                  : `Đã chọn ${selected.length} người`}
                displayEmpty
                MenuProps={{ PaperProps: { sx: { maxHeight: 280, maxWidth: "calc(100vw - 32px)" } } }}
              >
                <MenuItem value="__all" dense>
                  <Checkbox size="small" checked={users.length > 0 && assignedUserIds.length === users.length}
                    indeterminate={assignedUserIds.length > 0 && assignedUserIds.length < users.length} />
                  <ListItemText primary="Chọn tất cả" />
                </MenuItem>
                <MenuItem value="__clear" dense><ListItemText primary="Bỏ chọn tất cả" sx={{ ml: 4 }} /></MenuItem>
                {users.map((item) => (
                  <MenuItem key={item._id} value={item._id} dense>
                    <Checkbox size="small" checked={assignedUserIds.includes(item._id)} />
                    <ListItemText primary={item.fullName || item.username} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <button
            className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={load}
            disabled={loading || !initialized || (isAdmin && assignedUserIds.length === 0)}
          >
            {loading ? "Đang tải..." : "Xem"}
          </button>
        </div>
      </div>

      {isAdmin && (
        <p className="mb-3 text-xs text-gray-500">
          {initialized && assignedUserIds.length === 0
            ? "Chưa chọn người phụ trách. Hãy chọn ít nhất một người để xem thống kê."
            : "Mặc định chọn người thuộc Lấp Vò, Lai Vung. Có thể chọn nhiều người rồi bấm Xem."}
        </p>
      )}

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

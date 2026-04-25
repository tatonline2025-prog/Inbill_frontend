"use client";

import { useEffect, useState } from "react";
import { dailyCollectionSummaryAPI, IDailyCollectionSummary } from "@/services/invoice.api";

interface Props {
  days?: number;
}

export default function DailyCollectionTable({ days = 31 }: Props) {
  const [rows, setRows] = useState<IDailyCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await dailyCollectionSummaryAPI(days);
        if (!cancelled) setRows(res.data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Không tải được dữ liệu thống kê.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="w-full max-w-3xl bg-white shadow-lg rounded-2xl p-4 sm:p-6">
      {error && <p className="text-center text-red-600 mb-2">{error}</p>}

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
            {!loading &&
              rows.map((r) => {
                const empty = r.totalCount === 0;
                return (
                  <tr key={r.date} className={empty ? "text-gray-400" : ""}>
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
        </table>
      </div>
    </div>
  );
}

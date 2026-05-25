"use client";

import DailyCollectionTable from "@/components/DailyCollectionTable";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  return (
    <ProtectedRoute fallback={<p>Đang chuyển hướng...</p>}>
      <div className="flex flex-col items-center px-4 py-10">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Thống kê hóa đơn đã thu</h2>
        <DailyCollectionTable />
      </div>
    </ProtectedRoute>
  );
}

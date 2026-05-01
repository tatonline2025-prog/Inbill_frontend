"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DailyCollectionTable from "@/components/DailyCollectionTable";

export default function Dashboard() {
  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="flex flex-col items-center py-10 px-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">📈 Thống kê hoá đơn đã thu</h2>
        <DailyCollectionTable />
      </div>
    </ProtectedRoute>
  );
}

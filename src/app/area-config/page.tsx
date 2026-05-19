"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { PROVINCES } from "@/constants/invoice.constants";
import { createAreaConfig, deleteAreaConfig, updateAreaConfig } from "@/services/areaConfig.api";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AreaConfigPage() {
  const { map, configs, isLoading, reload } = useAreaPrefixMap();

  const [newProvince, setNewProvince] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editArea, setEditArea] = useState("");
  const [editPrefix, setEditPrefix] = useState("");

  const handleAdd = async () => {
    if (!newProvince || !newArea.trim() || !newPrefix.trim()) {
      toast.error("Vui lòng điền đầy đủ tỉnh, xã/phường và prefix");
      return;
    }
    try {
      setIsAdding(true);
      await createAreaConfig({ province: newProvince, area: newArea.trim(), prefix: newPrefix.trim() });
      toast.success("Đã thêm khu vực mới");
      setNewArea("");
      setNewPrefix("");
      await reload();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Lỗi khi thêm");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editArea.trim() || !editPrefix.trim()) {
      toast.error("Xã/phường và prefix không được để trống");
      return;
    }
    try {
      await updateAreaConfig(id, { area: editArea.trim(), prefix: editPrefix.trim() });
      toast.success("Đã cập nhật");
      setEditId(null);
      await reload();
    } catch {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async (id: string, area: string) => {
    if (!confirm(`Xoá khu vực "${area}"?`)) return;
    try {
      await deleteAreaConfig(id);
      toast.success("Đã xoá");
      await reload();
    } catch {
      toast.error("Lỗi khi xoá");
    }
  };

  // Nhóm configs theo province, theo thứ tự PROVINCES
  const sortedProvinces = PROVINCES.filter((p) => map[p]);
  // Thêm các tỉnh trong DB nhưng không có trong PROVINCES constant
  const extraProvinces = Object.keys(map).filter((p) => !PROVINCES.includes(p));

  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-6 text-xl font-bold text-blue-700 sm:text-2xl">Quản lý Xã/Phường &amp; Prefix mã hóa đơn</h1>

          {/* Form thêm mới */}
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">Thêm khu vực mới</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex-[2] min-w-[160px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tỉnh / Thành phố</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                >
                  <option value="">-- Chọn tỉnh --</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex-[2] min-w-[140px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Xã / Phường</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Lấp Vò"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prefix mã HĐ</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PB070900"
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                />
              </div>
              <button
                className="w-full whitespace-nowrap rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                onClick={handleAdd}
                disabled={isAdding}
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* Danh sách theo tỉnh */}
          {isLoading ? (
            <div className="text-center text-gray-400 py-10">Đang tải...</div>
          ) : configs.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Chưa có khu vực nào</div>
          ) : (
            <div className="space-y-4">
              {[...sortedProvinces, ...extraProvinces].map((province) => (
                <div key={province} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between">
                    <span className="font-bold text-blue-700">{province}</span>
                    <span className="text-xs text-gray-400">{map[province]?.length} khu vực</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                        <th className="text-left px-4 py-2">Xã / Phường</th>
                        <th className="text-right px-4 py-2">Prefix mã HĐ</th>
                        <th className="px-4 py-2 w-28"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(map[province] || []).map((item) =>
                        editId === item._id ? (
                          <tr key={item._id} className="border-b bg-blue-50">
                            <td className="px-4 py-2">
                              <input
                                className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                value={editArea}
                                onChange={(e) => setEditArea(e.target.value)}
                                autoFocus
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                className="w-full border rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                                value={editPrefix}
                                onChange={(e) => setEditPrefix(e.target.value.toUpperCase())}
                              />
                            </td>
                            <td className="px-4 py-2 text-right space-x-2">
                              <button
                                className="text-green-600 hover:text-green-800 font-bold"
                                onClick={() => handleSaveEdit(item._id)}
                              >
                                ✓ Lưu
                              </button>
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => setEditId(null)}
                              >
                                Hủy
                              </button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={item._id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-800">{item.area}</td>
                            <td className="px-4 py-2 text-right font-mono text-gray-500">{item.prefix}</td>
                            <td className="px-4 py-2 text-right space-x-3">
                              <button
                                className="text-blue-400 hover:text-blue-600"
                                title="Chỉnh sửa"
                                onClick={() => {
                                  setEditId(item._id);
                                  setEditArea(item.area);
                                  setEditPrefix(item.prefix);
                                }}
                              >
                                ✏
                              </button>
                              <button
                                className="text-red-400 hover:text-red-600"
                                title="Xoá"
                                onClick={() => handleDelete(item._id, item.area)}
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";
import { FREE_AREA_NAME, formatAreaPrefixLabel, isFreeArea } from "@/lib/area-prefix";
import { createAreaConfig, deleteAreaConfig, updateAreaConfig } from "@/services/areaConfig.api";

export default function AreaConfigPage() {
  const { groupedConfigs, configs, isLoading, reload } = useAreaPrefixMap();

  const [newArea, setNewArea] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editArea, setEditArea] = useState("");
  const [editPrefix, setEditPrefix] = useState("");

  const groupedAreaNames = useMemo(() => Object.keys(groupedConfigs), [groupedConfigs]);

  const isFreeAreaDraft = isFreeArea(newArea);
  const isFreeAreaEditing = isFreeArea(editArea);

  const handleAdd = async () => {
    if (!newArea.trim()) {
      toast.error("Vui lòng nhập xã/phường.");
      return;
    }

    if (!isFreeAreaDraft && !newPrefix.trim()) {
      toast.error("Prefix không được để trống, trừ khu vực Tự do.");
      return;
    }

    try {
      setIsAdding(true);
      await createAreaConfig({
        area: newArea.trim(),
        prefix: isFreeAreaDraft ? "" : newPrefix.trim().toUpperCase(),
      });
      toast.success("Đã thêm mã vùng mới.");
      setNewArea("");
      setNewPrefix("");
      await reload();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Lỗi khi thêm mã vùng.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editArea.trim()) {
      toast.error("Xã/phường không được để trống.");
      return;
    }

    if (!isFreeAreaEditing && !editPrefix.trim()) {
      toast.error("Prefix không được để trống, trừ khu vực Tự do.");
      return;
    }

    try {
      await updateAreaConfig(id, {
        area: editArea.trim(),
        prefix: isFreeAreaEditing ? "" : editPrefix.trim().toUpperCase(),
      });
      toast.success("Đã cập nhật mã vùng.");
      setEditId(null);
      await reload();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Lỗi khi cập nhật mã vùng.");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Xoá khu vực "${label}"?`)) return;
    try {
      await deleteAreaConfig(id);
      toast.success("Đã xoá.");
      await reload();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Lỗi khi xoá mã vùng.");
    }
  };

  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-6 text-xl font-bold text-blue-700 sm:text-2xl">
            Quản lý Xã/Phường &amp; Prefix mã hóa đơn
          </h1>

          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="font-semibold text-gray-700 mb-2">Thêm khu vực mới</h2>
            <p className="text-sm text-gray-500 mb-4">
              Nếu cần người phụ trách linh hoạt nhiều nơi, nhập <strong>{FREE_AREA_NAME}</strong>. Khi đó prefix có thể để trống.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex-[2] min-w-[180px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Xã / Phường</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Ví dụ: Lấp Vò hoặc ${FREE_AREA_NAME}`}
                  value={newArea}
                  onChange={(event) => setNewArea(event.target.value)}
                />
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prefix mã HĐ</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isFreeAreaDraft ? "Để trống cho Tự do" : "PB070900"}
                  value={newPrefix}
                  disabled={isFreeAreaDraft}
                  onChange={(event) => setNewPrefix(event.target.value.toUpperCase())}
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

          {isLoading ? (
            <div className="text-center text-gray-400 py-10">Đang tải...</div>
          ) : configs.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Chưa có khu vực nào.</div>
          ) : (
            <div className="space-y-4">
              {groupedAreaNames.map((areaName) => (
                <div key={areaName} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between">
                    <span className="font-bold text-blue-700">{areaName}</span>
                    <span className="text-xs text-gray-400">{groupedConfigs[areaName]?.length || 0} prefix</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                          <th className="text-left px-4 py-2">Xã / Phường</th>
                          <th className="text-right px-4 py-2">Prefix mã HĐ</th>
                          <th className="px-4 py-2 w-28" />
                        </tr>
                      </thead>
                      <tbody>
                        {(groupedConfigs[areaName] || []).map((item) =>
                          editId === item._id ? (
                            <tr key={item._id} className="border-b bg-blue-50">
                              <td className="px-4 py-2">
                                <input
                                  className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  value={editArea}
                                  onChange={(event) => setEditArea(event.target.value)}
                                  autoFocus
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  className="w-full border rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  value={editPrefix}
                                  disabled={isFreeAreaEditing}
                                  placeholder={isFreeAreaEditing ? "Để trống cho Tự do" : "PB070900"}
                                  onChange={(event) => setEditPrefix(event.target.value.toUpperCase())}
                                />
                              </td>
                              <td className="px-4 py-2 text-right space-x-2">
                                <button
                                  className="text-green-600 hover:text-green-800 font-bold"
                                  onClick={() => handleSaveEdit(item._id)}
                                >
                                  Lưu
                                </button>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setEditId(null)}>
                                  Huỷ
                                </button>
                              </td>
                            </tr>
                          ) : (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-800">{item.area}</td>
                              <td className="px-4 py-2 text-right font-mono text-gray-500">
                                {item.prefix || "Tự do"}
                              </td>
                              <td className="px-4 py-2 text-right space-x-3">
                                <button
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Chỉnh sửa"
                                  onClick={() => {
                                    setEditId(item._id);
                                    setEditArea(item.area);
                                    setEditPrefix(item.prefix);
                                  }}
                                >
                                  ✎
                                </button>
                                <button
                                  className="text-red-400 hover:text-red-600"
                                  title="Xoá"
                                  onClick={() => handleDelete(item._id, formatAreaPrefixLabel(item))}
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

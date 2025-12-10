"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios"; // Giả sử bạn đang dùng axios (có thể thay bằng fetch)
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";

interface ComboOption {
  sum: number;
  count: number;
  subset: number[];
  indices: number[];
  invoicenumbers: string[];
}

interface Result {
  success: boolean;
  message: string;
  results: ComboOption[]; // Thay thế cho bestSum và bestSubset đơn lẻ cũ
}

interface BillRow {
  id: string; // ID để xử lý xóa chính xác
  mkh: string;
  moneyRaw: string; // Dữ liệu thô từ ô input
  moneyVal: number; // Dữ liệu số đã parse
  originalIndex: number; // Để theo dõi thứ tự gốc
}

const SETTINGS_STORAGE_KEY = "optimal_sum_settings";

// --- Component Chính ---
const OptimalSumFinder = () => {
  const [error, setError] = useState<string>("");

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  // Chúng ta lưu 2 chuỗi text lớn đại diện cho 2 cột input
  const [textMkh, setTextMkh] = useState<string>("");
  const [textMoney, setTextMoney] = useState<string>("");

  // Settings
  const [isFilterOn, setIsFilterOn] = useState<boolean>(false); // Mặc định bật lọc
  const [minTarget, setMinTarget] = useState<number>(0); // Để string để check rỗng
  const [maxTarget, setMaxTarget] = useState<number>(3000000);
  const [count, setCount] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);

        // Kiểm tra từng giá trị trước khi set để tránh lỗi null/undefined
        if (parsed.maxTarget) setMaxTarget(Number(parsed.maxTarget));
        if (parsed.minTarget !== undefined) setMinTarget(parsed.minTarget); // Cho phép chuỗi rỗng
        if (parsed.count) setCount(Number(parsed.count));
        if (parsed.isFilterOn !== undefined) setIsFilterOn(Boolean(parsed.isFilterOn));

        // Lưu cả dữ liệu text nhập
        if (parsed.textMkh) setTextMkh(parsed.textMkh);
        if (parsed.textMoney) setTextMoney(parsed.textMoney);
      }
    } catch (err) {
      console.error("Lỗi khi load settings:", err);
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      const settingsToSave = {
        maxTarget,
        minTarget,
        count,
        isFilterOn,
        textMkh, // Uncomment nếu muốn lưu luôn nội dung đang nhập
        textMoney, // Uncomment nếu muốn lưu luôn nội dung đang nhập
      };

      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
      toast.success("Đã lưu cấu hình thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể lưu cấu hình.");
    }
  };

  // --- XỬ LÝ DỮ LIỆU TỪ INPUT (CORE LOGIC) ---
  // Hàm này chuyển đổi 2 ô textarea thành danh sách đối tượng để xử lý
  const rawData = useMemo(() => {
    const mkhLines = textMkh
      .split(/\n/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
    const moneyLines = textMoney
      .split(/\n/)
      .map((s) => s.trim())
      .filter((s) => s !== "");

    // Lấy độ dài lớn nhất của 2 cột để duyệt
    const maxLength = Math.max(mkhLines.length, moneyLines.length);

    const data: BillRow[] = [];
    for (let i = 0; i < maxLength; i++) {
      const mRaw = moneyLines[i] || "";
      // Parse số: Bỏ dấu chấm, phẩy, khoảng trắng
      const mVal = parseFloat(mRaw.replace(/[^0-9]/g, ""));

      // Chỉ tạo row nếu ít nhất 1 trong 2 cột có dữ liệu
      if (mkhLines[i]?.trim() || mRaw.trim()) {
        data.push({
          id: `row-${i}`, // ID tạm thời theo index dòng
          originalIndex: i,
          mkh: mkhLines[i] || "",
          moneyRaw: mRaw,
          moneyVal: isNaN(mVal) ? 0 : mVal,
        });
      }
    }
    return data;
  }, [textMkh, textMoney]);

  // --- LOGIC LỌC VÀ SẮP XẾP (FILTER & SORT) ---
  const processedData = useMemo(() => {
    if (!isFilterOn) {
      return rawData;
    }

    // Nếu CÓ lọc:
    // 1. Loại bỏ dòng không phải là số hợp lệ (moneyVal === 0 hoặc text rỗng)
    const validData = rawData.filter((item) => item.moneyVal > 0);

    // 2. Xử lý trùng lặp: Giữ lại bản ghi đầu tiên xuất hiện của mỗi mệnh giá
    const seenMap = new Set<number>();
    const uniqueData: BillRow[] = [];

    for (const item of validData) {
      if (!seenMap.has(item.moneyVal)) {
        seenMap.add(item.moneyVal);
        uniqueData.push(item);
      }
      // Nếu đã có trong seenMap -> Bỏ qua (ẩn đi)
    }

    return uniqueData;
  }, [rawData, isFilterOn]);

  const renderMoneyItem = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  // --- HÀM XÓA DÒNG ---
  const handleDeleteRow = (originalIndex: number) => {
    // Logic: Xóa dòng đó khỏi 2 ô Textarea gốc
    const mkhLines = textMkh.split(/\n/);
    const moneyLines = textMoney.split(/\n/);

    // Xóa tại index tương ứng
    mkhLines.splice(originalIndex, 1);
    moneyLines.splice(originalIndex, 1);

    // Cập nhật lại state -> Giao diện tự render lại
    // Nếu số bị xóa đang che số ẩn, số ẩn sẽ tự động được processedData tính toán lại và hiện lên
    setTextMkh(mkhLines.join("\n"));
    setTextMoney(moneyLines.join("\n"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (processedData.length > 200) {
      setError(`Số lượng ${processedData.length} đã vượt quá giới hạn (200). Vui lòng giảm số lượng.`);
      return;
    }

    if (processedData.length === 0) {
      setError("Chưa có dữ liệu để tính toán.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // 2. Gọi API Backend
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/finance/optimal-sum`, {
        moneyList: processedData,
        minTarget,
        maxTarget,
        count,
      });

      setResult(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const renderResult = () => {
    if (loading) {
      return <p>Đang tính toán tối ưu... (Có thể mất vài giây cho đến vài phút)</p>;
    }
    if (error) {
      return <p style={{ color: "red" }}>Lỗi: {error}</p>;
    }
    if (!result) {
      return null;
    }

    // Đảm bảo results luôn là mảng (phòng trường hợp api cũ trả về object)
    const resultsList = Array.isArray(result.results) ? result.results : [];

    return (
      <div
        style={{
          padding: "15px",
          border: `2px solid ${result.success ? "#4caf50" : "#ff9800"}`,
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ color: result.success ? "#2e7d32" : "#e65100", marginTop: 0 }}>
          {result.success ? "✅ ĐÃ TÌM THẤY KẾT QUẢ" : "⚠️ KHÔNG TÌM THẤY TỔ HỢP PHÙ HỢP"}
        </h3>

        <p style={{ fontStyle: "italic", marginBottom: "20px" }}>
          <strong>Thông báo:</strong> {result.message}
        </p>

        {resultsList.length === 0 && <p>Không có dữ liệu chi tiết để hiển thị.</p>}

        {resultsList.map((combo, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              fontSize: "clamp(11px, 3.5vw, 15px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                borderBottom: "1px solid #eee",
                paddingBottom: "8px",
              }}
            >
              <h4 style={{ margin: 0, color: "#333" }}># {index + 1}</h4>
              <span
                style={{
                  fontSize: "0.9em",
                  color: "#666",
                  background: "#e9ecef",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {combo.count} số hạng
              </span>
              <button
                onClick={() => handleCopyCombo(combo.invoicenumbers)}
                title="Sao chép các MKH của tổ hợp này"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "#fff",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: "#495057",
                  fontSize: "12px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e2e6ea";
                  e.currentTarget.style.borderColor = "#adb5bd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#ced4da";
                }}
              >
                {/* SVG Icon Copy */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy MKH</span>
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap", // Cho phép xuống dòng nếu quá dài
                alignItems: "center", // Căn giữa theo chiều dọc của dòng
                gap: "10px", // Khoảng cách giữa các phần tử
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
            >
              {combo.subset.map((item, idx) => (
                <React.Fragment key={idx}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "1.1em", fontWeight: "bold", color: "#333" }}>
                      {renderMoneyItem(item)}
                    </span>

                    <span style={{ fontSize: "0.75em", color: "#888", marginTop: "2px" }}>
                      ({combo.invoicenumbers ? combo.invoicenumbers[idx] : "?"})
                    </span>
                  </div>

                  {idx < combo.subset.length - 1 && (
                    <span style={{ color: "#bbb", fontWeight: "bold", fontSize: "1.2em" }}>+</span>
                  )}
                </React.Fragment>
              ))}

              <span style={{ color: "#bbb", fontWeight: "bold", fontSize: "1.2em" }}>=</span>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ color: "#d32f2f", fontWeight: "bold", fontSize: "1.3em" }}>{combo.sum}</span>
                <span style={{ fontSize: "0.75em", color: "#d32f2f", marginTop: "2px" }}>(Tổng tiền)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleCopyCombo = (mkhs: string[]) => {
    const selectedMkhs = mkhs.map((mkh) => mkh.trim()).filter((m) => m !== ""); // Loại bỏ các chuỗi rỗng nếu có

    // Ghép lại thành chuỗi để copy (ngăn cách bằng xuống dòng)
    const textToCopy = selectedMkhs.join("\n");

    // Thực hiện copy
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast.success(`Đã sao chép ${selectedMkhs.length} MKH vào bộ nhớ tạm!`);
      })
      .catch((err) => {
        console.error("Không thể copy:", err);
      });
  };

  // Hỗ trợ copy paste từ Excel khi copy cả 2 cột MKH và số tiền
  const handleSmartPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData.getData("text");

    // Kiểm tra xem có dấu tab (\t) không. Excel luôn dùng tab để ngăn cách cột.
    if (clipboardData.includes("\t")) {
      e.preventDefault(); // Chặn hành vi paste mặc định để tự xử lý

      const lines = clipboardData.split(/\r\n|\n|\r/); // Tách từng dòng
      const newMkh: string[] = [];
      const newMoney: string[] = [];

      lines.forEach((line) => {
        if (!line.trim()) return; // Bỏ qua dòng trống

        const columns = line.split("\t"); // Tách cột bằng dấu tab

        const validCols = columns
          .map((c) => c.trim()) // Xóa khoảng trắng thừa đầu đuôi
          .filter((c) => c !== "");

        if (validCols.length > 0) {
          newMkh.push(validCols[0]);

          if (validCols.length >= 2) {
            newMoney.push(validCols[1]);
          } else {
            newMoney.push("");
          }
        }
      });

      // Cập nhật State: Nối thêm vào dữ liệu cũ (hoặc ghi đè tùy bạn)
      // Ở đây mình làm logic: Nối thêm xuống dưới
      setTextMkh((prev) => (prev ? prev + "\n" : "") + newMkh.join("\n"));
      setTextMoney((prev) => (prev ? prev + "\n" : "") + newMoney.join("\n"));

      toast.success(`Đã dán ${newMkh.length} dòng dữ liệu!`);
    }
    // Nếu không có tab (copy 1 cột bình thường), để mặc định cho trình duyệt xử lý
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "collaborator"]} fallback={<p>Redirecting...</p>}>
      <div style={{ margin: "0", padding: "20px" }}>
        {/* --- HEADER --- */}
        <div
          style={{
            padding: "20px",
            maxWidth: "1200px",
            margin: "auto",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "32px",
              fontWeight: "800",
              marginBottom: "10px",
              color: "#2c3e50",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Công cụ Tìm Tổng Hoá Đơn
          </h1>
        </div>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {/* --- CỘT TRÁI: NHẬP LIỆU --- */}
          <div style={{ flex: "1 1 150px" }}>
            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                Nhập Dữ Liệu (Copy/Paste)
              </h3>

              <div style={{ display: "flex", marginBottom: "10px" }}>
                {/* CỘT MKH */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#555" }}>Cột MKH</label>
                  <textarea
                    value={textMkh}
                    onChange={(e) => setTextMkh(e.target.value)}
                    onPaste={handleSmartPaste}
                    placeholder={`Nhập MKH:\nPB07090020069\nPB05030000046\nPB05030079464\n...`}
                    style={{
                      width: "80%",
                      height: "500px",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "13px",
                      whiteSpace: "pre",
                    }}
                  />
                </div>

                {/* CỘT SỐ TIỀN */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#555" }}>Cột Số Tiền</label>
                  <textarea
                    value={textMoney}
                    onChange={(e) => setTextMoney(e.target.value)}
                    onPaste={handleSmartPaste}
                    placeholder={`Nhập số tiền:\n1019358\n1019358\n1019358\n...`}
                    style={{
                      width: "80%",
                      height: "500px",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "13px",
                      whiteSpace: "pre",
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#666", fontStyle: "italic", margin: "0" }}>
                * Paste dữ liệu vào 2 cột trên. Các dòng sẽ tự động đối chiếu ngang hàng.
              </p>
            </div>
          </div>

          {/* --- CỘT GIỮA: DANH SÁCH ĐÃ XỬ LÝ (PREVIEW) --- */}
          <div style={{ flex: "1 1 300px" }}>
            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "16px", marginBottom: "15px", color: "#2c3e50" }}>
                Cấu hình & Tìm kiếm
              </h3>

              {/* Hàng 1: Các ô Input nằm ngang */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "flex-end" }}>
                {/* Min */}
                <div style={{ flex: "1 1 150px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                    Min (VND)
                  </label>
                  <input
                    type="number"
                    placeholder={`0`}
                    value={minTarget}
                    onChange={(e) => setMinTarget(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Max */}
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                    Max (VND)
                  </label>
                  <div style={{ display: "flex" }}>
                    <input
                      type="number"
                      value={maxTarget}
                      onChange={(e) => setMaxTarget(Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px 0 0 4px",
                        borderRight: "none",
                      }}
                    />
                    <select
                      onChange={(e) => setMaxTarget(Number(e.target.value))}
                      value={maxTarget}
                      style={{
                        width: "70px",
                        border: "1px solid #ddd",
                        borderRadius: "0 4px 4px 0",
                        background: "#f8f9fa",
                        fontSize: "12px",
                      }}
                    >
                      <option value={3000000}>3 Tr</option>
                      {[...Array(20)].map((_, i) => (
                        <option key={i} value={(i + 1) * 1000000}>
                          {i + 1}Tr
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Số hóa đơn */}
                <div style={{ flex: "0 0 120px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                    Số lượng HĐ
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    {[...Array(8)].map((_, i) => (
                      <option key={i} value={i + 2}>
                        {i + 2}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nút Tìm & Lưu */}
                <div style={{ flex: "1 1 200px", display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleSubmit}
                    style={{
                      flex: 2,
                      padding: "9px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      boxShadow: "0 2px 4px rgba(0,123,255,0.3)",
                    }}
                  >
                    {loading ? "..." : "🔍 TÌM"}
                  </button>
                  <button
                    onClick={() => {
                      handleSaveSettings();
                    }}
                    style={{
                      flex: 1,
                      padding: "9px",
                      background: "#56a463ff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    title="Lưu cấu hình hiện tại"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px" }}>Danh sách tính toán</h3>

                {/* CHECKBOX LỌC TRÙNG */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "13px",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isFilterOn}
                    onChange={(e) => setIsFilterOn(e.target.checked)}
                    style={{ marginRight: "5px" }}
                  />
                  Lọc trùng
                </label>
              </div>

              <div
                style={{
                  flex: 1, // Tự mở rộng chiều cao
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: "1px solid #b9b9b9ff",
                  borderRadius: "4px",
                  padding: "10px",
                  background: "#fafafa",
                }}
              >
                {processedData.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#999", margin: "20px 0" }}>Chưa có dữ liệu</p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      alignContent: "flex-start",
                    }}
                  >
                    {processedData.map((row) => (
                      <div
                        key={row.id}
                        title={`MKH: ${row.mkh || "Trống"}`} // Hover vào sẽ thấy MKH
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "#ffffffff",
                          border: "1px solid #c8e6c9",
                          borderRadius: "16px", // Bo tròn kiểu viên thuốc
                          padding: "4px 10px",
                          fontSize: "clamp(9px, 2vw, 12px)",
                          fontWeight: "bold",
                          color: "#2e7d32",
                          cursor: "default",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                      >
                        {formatCurrency(row.moneyVal)}

                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Tránh sự kiện click lan ra ngoài
                            handleDeleteRow(row.originalIndex);
                          }}
                          style={{
                            marginLeft: "8px",
                            border: "none",
                            background: "#ffcdd2", // Nền đỏ nhạt cho nút xóa
                            color: "#c62828",
                            borderRadius: "50%",
                            width: "18px",
                            height: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "10px",
                            lineHeight: "1",
                            padding: 0,
                          }}
                          title="Xóa số này"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "10px", fontSize: "12px", textAlign: "right", color: "#666" }}>
                Hiển thị: <b>{processedData.length}</b> kết quả
                {isFilterOn && <span> (Đã ẩn số trùng/lỗi)</span>}
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: SETTINGS & ACTION --- */}
          <div style={{ flex: "1 1 300px" }}>
            <div
              style={{
                marginTop: "10px",
                marginBottom: "10px",
                fontSize: "14px",
                color: "#856404",
                background: "#fff3cd",
                padding: "5px 10px",
                borderRadius: "4px",
              }}
            >
              <p>⚠ Min để trống = Max - 10k. Xóa số tiền sẽ mất luôn MKH tương ứng.</p>
              <p>⚠ Số lượng đơn tối ưu 10-100.</p>
              <p>⚠ Số hoá đơn cần lấy từ 2-10.</p>
            </div>

            {renderResult()}
          </div>
        </div>

        {/* --- KẾT QUẢ (Placeholder) --- */}
        {/* Phần hiển thị kết quả sẽ nằm ở đây sau khi bấm Tìm */}
      </div>
    </ProtectedRoute>
  );
};

export default OptimalSumFinder;

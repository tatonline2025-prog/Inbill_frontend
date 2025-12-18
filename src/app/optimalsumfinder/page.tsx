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
  const [minOffset, setMinOffset] = useState(0);
  const [count, setCount] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Result | null>(null);

  const [isLocked, setIsLocked] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteMkhInput, setDeleteMkhInput] = useState("");

  useEffect(() => {
    let initialMkh = "";
    let initialMoney = "";

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
        if (parsed.textMkh) initialMkh = parsed.textMkh;
        if (parsed.textMoney) initialMoney = parsed.textMoney;

        setTextMkh(initialMkh);
        setTextMoney(initialMoney);
      }
    } catch (err) {
      console.error("Lỗi khi load settings:", err);
    }

    if (initialMkh.length > 0 || initialMoney.length > 0) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      const settingsToSave = {
        maxTarget,
        minTarget,
        count,
        isFilterOn,
        textMkh,
        textMoney,
        isLocked,
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
          padding: "10px",
          border: `2px solid ${result.success ? "#4caf50" : "#ff9800"}`,
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        {/* <h3 style={{ color: result.success ? "#2e7d32" : "#e65100", marginTop: 0 }}>
          {result.success ? "✅ ĐÃ TÌM THẤY KẾT QUẢ" : "⚠️ KHÔNG TÌM THẤY TỔ HỢP PHÙ HỢP"}
        </h3> */}

        <p style={{ marginBottom: "20px", fontWeight: "bold" }}>{result.message}</p>

        {resultsList.length === 0 && <p>Không có dữ liệu chi tiết để hiển thị.</p>}

        <div
          style={{
            maxHeight: "500px", // hoặc 500px tùy UI của bạn
            overflowY: "auto",
            paddingRight: "5px", // tránh bị che bởi thanh scroll
          }}
        >
          {resultsList.map((combo, index) => (
            <div
              key={index}
              style={{
                paddingLeft: "15px",
                paddingTop: "10px",
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
                  // justifyContent: "space-between",
                  flexWrap: "wrap",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  gap: 7,
                }}
              >
                <h4 style={{ margin: 0, color: "#333", fontSize: "0.8em" }}>{index + 1}.</h4>
                <span
                  style={{
                    fontSize: "0.8em",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}
                >
                  ({combo.count})
                </span>

                <button
                  onClick={() => handleCopyCombo(combo.invoicenumbers, combo.subset)}
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
                    fontSize: "10px",
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

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ color: "#d32f2f", fontWeight: "bold", fontSize: "1.0em" }}>{combo.sum}</span>
                </div>

                <span style={{ color: "#bbb", fontWeight: "bold", fontSize: "1.0em" }}>=</span>

                {combo.subset.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: "0.9em", fontWeight: "bold", color: "#333" }}>
                        {renderMoneyItem(item)}
                      </span>

                      <span style={{ fontSize: "0.75em", color: "#888", marginTop: "2px" }}>
                        ({combo.indices ? combo.indices[idx] + 1 : "?"})
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleCopyCombo = (mkhs: string[], amounts: number[]) => {
    const selectedMkhs = mkhs.map((mkh) => mkh.trim()).filter((m) => m !== "");

    const part1 = selectedMkhs.join("\n");

    const part2 = selectedMkhs
      .map((mkh, index) => {
        const amount = amounts[index] !== undefined ? amounts[index] : "";
        return `${mkh}\t${amount}`;
      })
      .join("\n");

    const finalText = `${part1}\n${part2}`;

    navigator.clipboard
      .writeText(finalText)
      .then(() => {
        toast.success(`Đã copy ${selectedMkhs.length} MKH (kèm chi tiết) vào bộ nhớ tạm!`);
      })
      .catch((err) => {
        console.error("Không thể copy:", err);
        toast.error("Lỗi khi copy!");
      });
  };

  const handlePasteInput = (e: React.ClipboardEvent<HTMLTextAreaElement>, type: "mkh" | "money") => {
    const clipboardData = e.clipboardData.getData("text");
    e.preventDefault(); // Chặn hành vi mặc định

    if (clipboardData.includes("\t")) {
      const lines = clipboardData.split(/\r\n|\n|\r/);
      const newMkh: string[] = [];
      const newMoney: string[] = [];

      lines.forEach((line) => {
        if (!line.trim()) return;
        const columns = line.split("\t");
        const validCols = columns.map((c) => c.trim()).filter((c) => c !== "");

        if (validCols.length > 0) {
          newMkh.push(validCols[0]);
          if (validCols.length >= 2) {
            newMoney.push(validCols[1]);
          } else {
            newMoney.push("");
          }
        }
      });

      setTextMkh((prev) => (prev ? prev + "\n" : "") + newMkh.join("\n"));
      setTextMoney((prev) => (prev ? prev + "\n" : "") + newMoney.join("\n"));

      toast.success(`Đã dán thông minh ${newMkh.length} dòng!`);
      setIsLocked(true); // <--- Khóa ngay vì đã có dữ liệu cả 2 bên
      return;
    }

    const cleanText = clipboardData.trim();

    if (type === "mkh") {
      setTextMkh((prev) => (prev ? prev + "\n" : "") + cleanText);
      toast.success("Đã thêm vào cột MKH");
    } else {
      setTextMoney((prev) => (prev ? prev + "\n" : "") + cleanText);
      toast.success("Đã thêm vào cột Số tiền");
    }

    if (textMkh && textMkh.trim().length > 0) {
      setIsLocked(true);
      toast.success("Dữ liệu đã được khóa!");
    } else {
      toast.success("Đã dán Số tiền. Hãy dán tiếp cột MKH!");
    }
  };

  // --- Xóa hàng loạt theo MKH (thực chất là tạo mảng mới không bao gồm các MKH trong DS xoá) ---
  const handleConfirmBulkDelete = () => {
    if (!deleteMkhInput.trim()) {
      toast.error("Vui lòng nhập danh sách MKH cần xóa");
      return;
    }

    const mkhToDeleteSet = new Set(
      deleteMkhInput
        .split(/\n/)
        .map((s) => s.trim())
        .filter((s) => s !== "")
    );

    const currentMkhLines = textMkh.split(/\n/);
    const currentMoneyLines = textMoney.split(/\n/);
    const maxLength = Math.max(currentMkhLines.length, currentMoneyLines.length);

    const newMkhLines: string[] = [];
    const newMoneyLines: string[] = [];
    let deletedCount = 0;

    for (let i = 0; i < maxLength; i++) {
      const mkh = currentMkhLines[i] || "";
      const money = currentMoneyLines[i] || "";

      // Nếu MKH của dòng này nằm trong danh sách cần xóa -> Bỏ qua (không push vào mảng mới)
      if (mkhToDeleteSet.has(mkh.trim())) {
        deletedCount++;
      } else {
        newMkhLines.push(mkh);
        newMoneyLines.push(money);
      }
    }

    if (deletedCount === 0) {
      toast("Không tìm thấy MKH nào khớp để xóa.", { icon: "ℹ️" });
    } else {
      setTextMkh(newMkhLines.join("\n"));
      setTextMoney(newMoneyLines.join("\n"));
      toast.success(`Đã xóa thành công ${deletedCount} dòng!`);

      setIsDeleteModalOpen(false);
      setDeleteMkhInput("");
    }
  };

  const handleResetInput = () => {
    setTextMkh("");
    setTextMoney("");
    setIsLocked(false);
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "0.8 1 80px" }}>
            <div
              style={{
                background: "#fff",
                paddingTop: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                position: "relative",
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
                  paddingRight: "15px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px" }}>Nhập Dữ Liệu (Copy/Paste)</h3>

                <button
                  onClick={handleResetInput}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    backgroundColor: "#ff0000ff",
                    cursor: "pointer",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  Xóa dữ liệu
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  marginBottom: "10px",
                  gap: "10px",
                }}
              >
                {/* CỘT MKH */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#555" }}>Cột MKH</label>
                  <textarea
                    value={textMkh}
                    onChange={(e) => setTextMkh(e.target.value)}
                    onPaste={(e) => handlePasteInput(e, "mkh")}
                    placeholder={`Nhập MKH:\nPB07090020069\nPB05030000046\nPB05030079464\n...`}
                    style={{
                      width: "100%", // CHỈNH: full cột
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
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#555" }}>Cột Số Tiền</label>
                  <textarea
                    value={textMoney}
                    onChange={(e) => setTextMoney(e.target.value)}
                    onPaste={(e) => handlePasteInput(e, "money")}
                    disabled={isLocked}
                    placeholder={`Nhập số tiền:\n1019358\n1019358\n1019358\n...`}
                    style={{
                      width: "100%",
                      height: "500px",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "13px",
                      whiteSpace: "pre",
                      backgroundColor: isLocked ? "#f5f5f5" : "#fff",
                      cursor: isLocked ? "not-allowed" : "text",
                      color: isLocked ? "#888" : "#000",
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
          <div style={{ flex: "1 1 100px" }}>
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

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ display: "flex" }}>
                  {/* Min */}
                  <div style={{ flex: "0.5 1 130px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                      Min (x1000)
                    </label>
                    <div style={{ display: "flex" }}>
                      <input
                        type="number"
                        step="any"
                        value={minTarget ? minTarget / 1000 : 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMinTarget(val ? Number(val) * 1000 : 0);
                        }}
                        style={{
                          width: "100%",
                          padding: "6px",
                          fontSize: "12px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />

                      <select
                        onChange={(e) => {
                          const offset = Number(e.target.value);
                          setMinOffset(offset);
                          if (offset === 0) {
                            setMinTarget(0);
                          } else {
                            setMinTarget(Math.max(0, maxTarget + offset));
                          }
                        }}
                        value={minOffset}
                        style={{
                          width: "100%",
                          border: "1px solid #ddd",
                          borderRadius: "0 4px 4px 0",
                          background: "#f8f9fa",
                          fontSize: "12px",
                        }}
                      >
                        <option value={0}>0</option>
                        {maxTarget > 100000 && <option value={-100000}>-100K</option>}
                        {maxTarget > 10000 && <option value={-10000}>-10K</option>}
                        {maxTarget > 1000 && <option value={-1000}>-1K</option>}
                      </select>
                    </div>
                  </div>

                  {/* Max */}
                  <div style={{ flex: "1 1 100px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                      Max (x1000)
                    </label>
                    <div style={{ display: "flex" }}>
                      <input
                        type="number"
                        step="any" // Cho phép nhập số thập phân thoải mái
                        value={maxTarget ? maxTarget / 1000 : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newMaxTarget = val ? Number(val) * 1000 : 0;
                          setMaxTarget(newMaxTarget);
                          if (minOffset === 0) {
                            setMinTarget(0);
                          } else {
                            setMinTarget(Math.max(0, newMaxTarget + minOffset));
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "6px",
                          fontSize: "12px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                        placeholder="VD: 1000 = 1 triệu"
                      />

                      <select
                        // onChange={(e) => setMaxTarget(Number(e.target.value))}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newMaxTarget = val ? Number(val) : 0;
                          setMaxTarget(newMaxTarget);
                          if (minOffset === 0) {
                            setMinTarget(0);
                          } else {
                            setMinTarget(Math.max(0, newMaxTarget + minOffset));
                          }
                        }}
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
                </div>

                {/* Số hóa đơn */}
                <div style={{ flex: "0 0 120px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                    Số lượng HĐ
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
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
                      padding: "7px",
                      fontSize: "13px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
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
                      padding: "7px",
                      fontSize: "13px",
                      background: "#56a463",
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
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px" }}>Danh sách số tiền</h3>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    background: "#ffebEE",
                    color: "#c62828",
                    border: "1px solid #ffcdd2",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  title="Dán danh sách MKH để xóa các dòng tương ứng"
                >
                  Xóa MKH
                </button>

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
                  flex: 1,
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
                        title={`MKH: ${row.mkh || "Trống"}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "#ffffffff",
                          border: "1px solid #c8e6c9",
                          borderRadius: "16px",
                          padding: "4px 10px",
                          fontSize: "clamp(8px, 2vw, 11px)",
                          fontWeight: "bold",
                          color: "#2e7d32",
                          cursor: "default",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                      >
                        {formatCurrency(row.moneyVal)}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(row.originalIndex);
                          }}
                          style={{
                            marginLeft: "8px",
                            border: "none",
                            background: "#1a22f0",
                            color: "white",
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
                marginBottom: "10px",
                fontSize: "14px",
                color: "#856404",
                background: "#fff3cd",
                padding: "5px 10px",
                borderRadius: "4px",
              }}
            >
              <p>⚠ Số lượng đơn tối ưu 10-100.</p>
              <p>⚠ Số hoá đơn cần lấy từ 2-10.</p>
            </div>

            {renderResult()}
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#c62828" }}>Xóa hàng loạt</h3>
            <p style={{ fontSize: "13px", color: "#555" }}>
              Nhập danh sách Mã Khách Hàng (MKH) cần xóa vào bên dưới. Hệ thống sẽ tìm và xóa cả MKH lẫn Số tiền tương
              ứng.
            </p>

            <textarea
              value={deleteMkhInput}
              onChange={(e) => setDeleteMkhInput(e.target.value)}
              placeholder={`Dán danh sách MKH vào đây...\nPB07090020069\nPB05030000046`}
              style={{
                width: "100%",
                height: "200px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                marginBottom: "15px",
                fontSize: "13px",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteMkhInput("");
                }}
                style={{
                  padding: "8px 15px",
                  background: "#e0e0e0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                style={{
                  padding: "8px 15px",
                  background: "#d32f2f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default OptimalSumFinder;

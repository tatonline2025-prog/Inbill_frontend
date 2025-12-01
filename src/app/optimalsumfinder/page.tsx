"use client";

import React, { useState } from "react";
import axios from "axios"; // Giả sử bạn đang dùng axios (có thể thay bằng fetch)
import ProtectedRoute from "@/components/ProtectedRoute";

interface ComboOption {
  sum: number;
  count: number;
  subset: number[];
  indices: number[];
}

interface Result {
  success: boolean;
  message: string;
  results: ComboOption[]; // Thay thế cho bestSum và bestSubset đơn lẻ cũ
}

// --- Component Chính ---
const OptimalSumFinder = () => {
  const [moneyListInput, setMoneyListInput] = useState<string>("");
  const [minTarget, setMinTarget] = useState<number>(0);
  const [maxTarget, setMaxTarget] = useState<number>(0);
  const [count, setCount] = useState<number>(5);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [originalFormatMap, setOriginalFormatMap] = useState<Record<number, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    setOriginalFormatMap({});

    try {
      // Tách chuỗi thô ra
      const rawStrings = moneyListInput
        .split(/[\n\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const moneyList: number[] = [];
      const tempMap: Record<number, string> = {};

      // Duyệt qua từng chuỗi thô để vừa lấy số, vừa lưu format
      for (const str of rawStrings) {
        // Chuyển sang số để tính toán (bỏ dấu . ,)
        const numVal = Number(str.replace(/[.,]/g, ""));

        if (!isNaN(numVal)) {
          moneyList.push(numVal);
          // Lưu vào map: Key là số tính toán, Value là chuỗi gốc (VD: 123456 -> "123.456")
          // Chỉ lưu nếu chưa có (để tránh ghi đè nếu có số trùng)
          if (tempMap[numVal] === undefined) {
            tempMap[numVal] = str;
          }
        }
      }

      // Lưu map vào state để dùng lúc render
      setOriginalFormatMap(tempMap);

      if (moneyList.some(isNaN)) {
        setError("Danh sách tiền chứa các giá trị không hợp lệ.");
        setLoading(false);
        return;
      }

      if (moneyList.length > 200) {
        setError(`Danh sách các số tiền (${moneyList.length}) vượt quá số lượng cho phép.`);
        setLoading(false);
        return;
      }
      if (count > 9) {
        setError(`Số lượng số hạng (${count}) vượt quá số lượng cho phép.`);
        setLoading(false);
        return;
      }

      if (minTarget > maxTarget) {
        setError(`Số tiền tối thiểu phải nhỏ hơn số tiền tối đa.`);
        setLoading(false);
        return;
      }

      const payload = {
        moneyList,
        minTarget,
        maxTarget,
        count,
      };

      // 2. Gọi API Backend
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/finance/optimal-sum`, payload);

      // console.log(res.data);

      // 3. Xử lý kết quả
      setResult(res.data as Result);
    } catch (err) {
      console.log(err);
      setError("Có lỗi xảy ra khi kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  const renderMoneyItem = (val: number) => {
    if (originalFormatMap[val]) {
      return originalFormatMap[val];
    }
    // Fallback nếu không tìm thấy trong map (thường là cho biến Sum tổng)
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
              <h4 style={{ margin: 0, color: "#333" }}>Tổ hợp {index + 1}</h4>
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
                      ({combo.indices ? combo.indices[idx] + 1 : "?"})
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

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "collaborator"]} fallback={<p>Redirecting...</p>}>
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
          Công cụ Tìm Tổng Tiền Tối Ưu
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: "16px",
            maxWidth: "700px",
            margin: "0 auto 25px",
            lineHeight: "1.6",
            color: "#555",
            background: "#f8f9fa",
            padding: "12px 18px",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          Công cụ sử dụng thuật toán để giúp bạn tìm ra tổ hợp các số tiền có tổng gần nhất với giá trị mong muốn —{" "}
          <b>nhanh chóng, chính xác và tối ưu chi phí</b>.
        </p>

        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            padding: "12px 15px",
            borderRadius: "8px",
            color: "#856404",
            fontSize: "14px",
            lineHeight: "1.6", // Tăng khoảng cách dòng một chút cho dễ đọc
            marginBottom: "18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <b>⚠️ Lưu ý / Mẹo để có kết quả chính xác & nhanh nhất:</b>
          <ul style={{ margin: "5px 0 0 0", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "4px" }}>
              <b>Dữ liệu nhập:</b> Khuyến khích nhập <b>khoảng 100 số tiền</b> trở xuống để tối ưu tốc độ.
            </li>
            <li style={{ marginBottom: "4px" }}>
              <b>Số hạng tối đa:</b> Nên chọn từ <b>5 đến 6</b>.
              <br />
              <span style={{ fontSize: "0.9em", opacity: 0.9 }}>
                (Chỉ nên chọn 7-9 khi danh sách tiền rất ít, dưới 50 số tiền hoặc trên một chút).
              </span>
            </li>
            <li>
              <b>Nếu hệ thống tự ngắt (do quá lâu):</b> Vui lòng <b>giảm số hạng tối đa</b> hoặc điều chỉnh số tiền mục
              tiêu gần hơn với các số tiền trong danh sách nhập.
            </li>
          </ul>
        </div>

        {/* --- THÊM FLEX ROW 2 CỘT --- */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* CỘT TRÁI: FORM NHẬP LIỆU */}
          <form
            onSubmit={handleSubmit}
            style={{
              flex: "1 1 400px",
              width: "100%",

              background: "white",
              borderRadius: "12px",
              padding: "22px 25px",

              border: "1px solid #e0e0e0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              transition: "0.25s ease",
            }}
          >
            {/* Tiêu đề nhỏ cho form */}
            <h3
              style={{
                marginBottom: "15px",
                fontSize: "20px",
                fontWeight: "700",
                color: "#007bff",
                textAlign: "center",
                letterSpacing: "0.3px",
              }}
            >
              Nhập Dữ Liệu Tính Toán
            </h3>

            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Danh sách Số tiền:
              </label>

              <textarea
                value={moneyListInput}
                onChange={(e) => setMoneyListInput(e.target.value)}
                rows={7}
                placeholder="Ví dụ: 3656500, 180198, 171342, ..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  outline: "none",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  transition: "0.25s",
                }}
                onFocus={(e) => (e.target.style.border = "1px solid #007bff")}
                onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "15px", marginBottom: "22px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 150px" }}>
                {" "}
                {/* Thêm flex-basis 150px để tự co giãn */}
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "13px",
                  }}
                >
                  Số tiền tối thiểu:
                </label>
                <input
                  type="number"
                  value={minTarget}
                  onChange={(e) => setMinTarget(Number(e.target.value))}
                  placeholder="VD: 10000000"
                  style={{
                    padding: "10px",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    outline: "none",
                    fontSize: "14px",
                    transition: "0.25s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid #007bff";
                    e.target.select();
                  }}
                  onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
                  required
                />
              </div>

              <div style={{ flex: "1 1 150px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "13px",
                  }}
                >
                  Số tiền tối đa:
                </label>
                <input
                  type="number"
                  value={maxTarget}
                  onChange={(e) => setMaxTarget(Number(e.target.value))}
                  placeholder="VD: 10500000"
                  style={{
                    padding: "10px",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    outline: "none",
                    fontSize: "14px",
                    transition: "0.25s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid #007bff";
                    e.target.select();
                  }}
                  onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
                  required
                />
              </div>

              <div style={{ flex: "1 1 150px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "13px",
                  }}
                >
                  Số lượng số hạng tối đa:
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  min="1"
                  style={{
                    padding: "10px",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    outline: "none",
                    fontSize: "14px",
                    transition: "0.25s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid #007bff";
                    e.target.select();
                  }}
                  onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 20px",
                background: "#007bff",
                color: "white",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                width: "100%",
                cursor: "pointer",
                fontSize: "15px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
                transition: "0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLInputElement).style.background = "#005dc1")}
              onMouseLeave={(e) => ((e.target as HTMLInputElement).style.background = "#007bff")}
            >
              {loading ? "Đang Xử lý..." : "🔍 Tìm Tổng Tối Ưu"}
            </button>
          </form>

          {/* CỘT PHẢI: KẾT QUẢ */}

          <div style={{ flex: "1 1 400px", width: "100%" }}>{renderResult()}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default OptimalSumFinder;

"use client";

import React, { useState } from "react";
import axios from "axios"; // Giả sử bạn đang dùng axios (có thể thay bằng fetch)

interface Result {
  success: boolean;
  message: string;
  bestSum: number;
  bestSubset: number[];
}

// --- Component Chính ---
const OptimalSumFinder = () => {
  const [moneyListInput, setMoneyListInput] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    try {
      // 1. Chuẩn bị dữ liệu
      const moneyList = moneyListInput
        .split(/[\n,\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map(Number);

      if (moneyList.some(isNaN)) {
        setError("Danh sách tiền chứa các giá trị không hợp lệ.");
        setLoading(false);
        return;
      }

      if (moneyList.length > 500) {
        setError(`Danh sách các số tiền (${moneyList.length}) vượt quá số lượng cho phép.`);
        setLoading(false);
        return;
      }
      if (count > 9) {
        setError(`Số lượng số hạng (${count}) vượt quá số lượng cho phép.`);
        setLoading(false);
        return;
      }

      const payload = {
        moneyList,
        targetAmount,
        count,
      };

      // 2. Gọi API Backend
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/finance/optimal-sum`, payload);

      // console.log(res.data);

      // 3. Xử lý kết quả
      setResult(res.data as Result);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null) return "N/A";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const renderResult = () => {
    if (loading) {
      return <p>Đang tính toán tối ưu... (Có thể mất vài giây nếu số lượng lớn)</p>;
    }
    if (error) {
      return <p style={{ color: "red" }}>Lỗi: {error}</p>;
    }
    if (!result) {
      return null;
    }

    return (
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          border: `1px solid ${result.success ? "green" : "orange"}`,
          borderRadius: "5px",
        }}
      >
        <h3 style={{ color: result.success ? "green" : "orange" }}>
          {result.success ? "✅ THÀNH CÔNG" : "⚠️ KHÔNG THỎA MÃN CHÍNH XÁC"}
        </h3>
        <p>
          <strong>Thông báo:</strong> {result.message}
        </p>
        <hr />
        <h4>Kết quả Tối ưu</h4>
        <p>
          <strong>Tổng tiền tốt nhất:</strong> {formatCurrency(result.bestSum)}
        </p>
        <p>
          <strong>Các số tiền được chọn:</strong>
          <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
            {result.bestSubset.map((item, index) => (
              <li
                key={index}
                style={{ background: "#f0f0f0", margin: "3px 0", padding: "2px 5px", borderRadius: "3px" }}
              >
                {formatCurrency(item)}
              </li>
            ))}
          </ul>
        </p>
      </div>
    );
  };

  return (
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

      {/* --- THÊM FLEX ROW 2 CỘT --- */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            minWidth: "350px",

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
              Danh sách Số tiền (ngăn cách bằng dấu phẩy):
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

          <div style={{ display: "flex", gap: "20px", marginBottom: "22px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Tổng tiền Mong muốn:
              </label>

              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                style={{
                  padding: "10px",
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  outline: "none",
                  fontSize: "14px",
                  transition: "0.25s",
                }}
                onFocus={(e) => (e.target.style.border = "1px solid #007bff")}
                onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
                required
              />
              <small style={{ color: "#777" }}>VND (Ví dụ: 10000000)</small>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Số lượng Số hạng:
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
                }}
                onFocus={(e) => (e.target.style.border = "1px solid #007bff")}
                onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
                required
              />
              <small style={{ color: "#777" }}>Giới hạn an toàn: {9}</small>
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

        <div style={{ flex: 1, minWidth: "350px" }}>
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              padding: "12px 15px",
              borderRadius: "8px",
              color: "#856404",
              fontSize: "14px",
              lineHeight: "1.5",
              marginBottom: "18px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <b>⚠️ Lưu ý:</b> Hệ thống chỉ chấp nhận danh sách khoảng <b>500 số tiền</b> với số lượng số hạng là{" "}
            <b>9 số hạng</b>. Nếu lớn hơn, hệ thống có thể quá tải và không thể tính toán được.
          </div>

          {renderResult()}
        </div>
      </div>
    </div>
  );
};

export default OptimalSumFinder;

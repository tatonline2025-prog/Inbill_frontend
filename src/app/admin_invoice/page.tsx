"use client";

import { useEffect, useState } from "react";
import { fetchallInvoice, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import AdminRoute from "@/components/AdminRoute";
import { Switch } from "@mui/material";
import Header from "@/components/Header";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 15;

  // --- Gọi API khi component mount ---
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchallInvoice();
        const data = res.data; // nếu backend trả trực tiếp mảng
        // const data = res.data.result; // nếu backend trả { result: [...] }

        console.log(data);

        setInvoices(data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
        setError("Không thể tải dữ liệu hóa đơn. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // --- Hàm xuất Excel ---
  const handleExport = () => {
    window.location.href = "http://localhost:5000/api/invoices/exportExcel";
  };

  // --- Tính toán dữ liệu trang hiện tại ---
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = invoices.slice(indexOfFirstInvoice, indexOfLastInvoice);

  const totalPages = Math.ceil(invoices.length / invoicesPerPage);

  // --- Hàm đổi trang ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleToggle = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
    try {
      // Gọi API cập nhật trạng thái
      const res = await handleToggle_API(invoiceId, field);

      // if (!res.ok) throw new Error("Cập nhật thất bại");

      // Nếu bạn đang lưu danh sách invoice trong state, cập nhật lại UI:
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === invoiceId
            ? {
                ...inv,
                [field]:
                  field === "printStatus"
                    ? inv.printStatus === "printed"
                      ? "not_printed"
                      : "printed"
                    : inv.collectionStatus === "collected"
                    ? "not_collected"
                    : "collected",
              }
            : inv
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // --- Trạng thái hiển thị ---
  if (loading) return <p style={{ padding: "2rem" }}>Đang tải dữ liệu hóa đơn...</p>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  return (
    <AdminRoute fallback={<p>Redirecting...</p>}>
      <div style={{ padding: "2rem" }}>
        <h1>Danh Sách Hóa Đơn</h1>

        <button
          onClick={handleExport}
          style={{
            marginBottom: "1rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
          }}
          disabled={invoices.length === 0}
        >
          Xuất ra Excel
        </button>

        {invoices.length === 0 ? (
          <p>Không có hóa đơn nào được tìm thấy.</p>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f2f2f2" }}>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Số Hóa Đơn</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Tên Khách Hàng</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Địa Chỉ</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Kỳ Thanh Toán</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Tổng tiền</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Nhân viên phụ trách</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Đã in bill</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Đã thu</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Ngày thu</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Ngày giao</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.invoiceNumber}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.customerName}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.customerAddress}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.billing_period}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.totalAmount}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.assignedTo.fullName}</td>
                    {/* ✅ Toggle Đã in bill */}
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                      <Switch
                        checked={invoice.printStatus === "printed"}
                        onChange={() => handleToggle(invoice._id, "printStatus")}
                        color="primary"
                      />
                    </td>

                    {/* ✅ Toggle Đã thu */}
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                      <Switch
                        checked={invoice.collectionStatus === "collected"}
                        onChange={() => handleToggle(invoice._id, "collectionStatus")}
                        color="success"
                      />
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.collectionDate}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {new Date(invoice.issueDate).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* --- Thanh phân trang --- */}
            <div
              style={{ marginTop: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  backgroundColor: currentPage === 1 ? "#eee" : "white",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                « Trước
              </button>

              <span>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  backgroundColor: currentPage === totalPages ? "#eee" : "white",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Sau »
              </button>
            </div>
          </>
        )}
      </div>
    </AdminRoute>
  );
}

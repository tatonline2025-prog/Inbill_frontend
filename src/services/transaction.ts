import { ITransaction, ITransactionFilterParams, ITransactionPaymentBank } from "@/types/transaction";
import axios from "axios";

export const createTransaction = async (data: Partial<ITransaction>) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const createTransactionType = async (
  name: string,
  discountPercent: number,
  description: string,
  selectedBankId: string
) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/config/types`,
    { name, discountPercent, description, selectedBankId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
};

export const updateTransactionType = async (
  transactionTypeId: string,
  name: string,
  discountPercent: number,
  selectedBankId: string,
  description: string
) => {
  const token = localStorage.getItem("token");

  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/config/types`,
    { transactionTypeId, name, discountPercent, description, selectedBankId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
};

export const deleteTransactionType = async (transactionTypeId: string) => {
  const token = localStorage.getItem("token");

  const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/config/types`, {
    headers: { Authorization: `Bearer ${token}` },
    // Thêm data để truyền body cho phương thức DELETE
    data: { transactionTypeId },
  });
  return res;
};

export const getTransactionTypes = async () => {
  const token = localStorage.getItem("token");

  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/config/types`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res;
};

export const getUserTransactions = async () => {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined.");
  }

  const token = localStorage.getItem("token");

  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res;
};

export const deleteTransaction = async (id: string) => {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined.");
  }

  const token = localStorage.getItem("token");

  const res = await axios.delete(
    // URL cần có ID giao dịch trong đường dẫn
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/${id}`,

    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res;
};

export const updateTransaction = async (id: string, data: Partial<ITransaction>) => {
  const token = localStorage.getItem("token");

  const res = await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

// CÁC HÀM CHỨC NĂNG CỦA ADMIN
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const getAllTransactions = async (params: ITransactionFilterParams) => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/admin`, {
    headers: getHeaders(),
    params, // searchName, startDate, endDate, status
  });
  return res.data;
};

export const approveTransaction = async (id: string) => {
  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/admin/${id}/approve`,
    {},
    { headers: getHeaders() }
  );
  return res.data;
};

export const cancelTransaction = async (id: string) => {
  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/admin/${id}/cancel`,
    {},
    { headers: getHeaders() }
  );
  return res.data;
};

export const createBank = async (formData: Partial<ITransactionPaymentBank>) => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/config/banks`,
    { formData },
    {
      headers: getHeaders(),
    }
  );
  return res.data;
};

export const updateBank = async (bankId: string, formData: Partial<ITransactionPaymentBank>) => {
  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/config/banks`,
    { bankId, formData },
    {
      headers: getHeaders(),
    }
  );
  return res.data;
};

export const getBanks = async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/config/banks`, {
    headers: getHeaders(),
  });
  return res.data; // Giả sử trả về { banks: [...] }
};

export const getDailyReport = async (startDate?: string, endDate?: string) => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/reports/daily`, {
    headers: getHeaders(),
    params: { startDate, endDate },
  });

  return res.data;
};

export const deleteTransactionByAdmin = async (id: string) => {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined.");
  }

  const token = localStorage.getItem("token");

  const res = await axios.delete(
    // URL cần có ID giao dịch trong đường dẫn
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/admin/${id}`,

    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res;
};

export const updateTransactionByAdmin = async (id: string, data: Partial<ITransaction>) => {
  const token = localStorage.getItem("token");

  const res = await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/admin/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const fetchCollaborators = async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/admin/collaborators`, {
    headers: getHeaders(),
  });

  return res.data;
};

export const exportTransactionsToExcelAPI = async (filter: { type: string; date: string; collaborator: string }) => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transaction/admin/export`, {
      headers: getHeaders(),
      params: filter,
      responseType: "blob",
    });

    const contentType = res.headers["content-type"];

    // Nếu backend trả JSON → nghĩa là không có dữ liệu
    if (!contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
      const text = await res.data.text();
      const json = JSON.parse(text);
      throw new Error(json.message || "Không có dữ liệu để xuất.");
    }

    // Tạo Blob URL
    const blob = new Blob([res.data], { type: contentType });

    const url = window.URL.createObjectURL(blob);

    // Tạo thẻ a để tải file
    const link = document.createElement("a");
    link.href = url;

    // Lấy tên file từ headers
    const disposition = res.headers["content-disposition"];
    let fileName = "bao_cao.xlsx";

    if (disposition && disposition.includes("filename=")) {
      fileName = disposition.split("filename=")[1].replace(/"/g, "");
    }

    link.setAttribute("download", fileName);

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Lỗi tải file:", error);
    throw error;
  }
};

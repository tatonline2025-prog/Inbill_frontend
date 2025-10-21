import axios from "axios";

export const excelUp = async (formData: FormData, token: string) => {
  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/upload-preview`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};

export const excelUpProvince = async (formData: FormData) => {
  const token = localStorage.getItem("token");

  console.log(formData);

  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/uploadWithProvince`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};

import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-base-url";

export const excelUp = async (formData: FormData, token: string) => {
  const res = await axios.post(`${getApiBaseUrl()}/api/invoices/upload-preview`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};

export const excelUpProvince = async (formData: FormData) => {
  const token = localStorage.getItem("token");

  // console.log(formData);

  const res = await axios.post(`${getApiBaseUrl()}/api/invoices/uploadWithProvince`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};


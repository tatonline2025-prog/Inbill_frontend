import { IUser } from "@/types/user";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-base-url";

export const fetchallUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chua dang nhap");
  const res = await axios.get<{ user: IUser[] }>(`${getApiBaseUrl()}/api/user/fetchall`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const updateUserByAdmin = async (editinguserId: string, formData: Partial<IUser>, token: string) => {
  const res = await axios.put(
    `${getApiBaseUrl()}/api/user/changeinfo`,
    {
      editinguserId,
      formData,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
};

export const deleteUserByAdmin = async (userId: string, token: string) => {
  const res = await axios.delete(`${getApiBaseUrl()}/api/user/deleteuser/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const apiUpdateUser = async (editinguserId: string, formData: Partial<IUser>) => {
  const token = await localStorage.getItem("token");
  if (!token) throw new Error("Chua dang nhap");

  const res = await axios.put(
    `${getApiBaseUrl()}/api/user/changeinfo-self`,
    {
      editinguserId,
      formData,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
};


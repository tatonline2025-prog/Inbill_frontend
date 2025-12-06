import { IUser } from "@/types/user";
import axios from "axios";

export const fetchallUser = async () => {
  const res = await axios.get<{ user: IUser[] }>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/fetchall`);
  return res;
};

export const updateUserByAdmin = async (editinguserId: string, formData: Partial<IUser>, token: string) => {
  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/changeinfo`,
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
  const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/deleteuser/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const apiUpdateUser = async (editinguserId: string, formData: Partial<IUser>) => {
  const token = await localStorage.getItem("token");

  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/changeinfo`,
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

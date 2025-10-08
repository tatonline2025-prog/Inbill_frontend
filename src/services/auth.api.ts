import { IUserResponse } from "@/types/user";
import axios from "axios";

export const login = async (userName: string, password: string) => {
  const res = await axios.post<IUserResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
    userName,
    password,
  });
  return res;
};

export const register = async (userName: string, email: string, password: string, fullName: string) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
    {
      userName,
      email,
      password,
      fullName,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`, // Token của admin
      },
    }
  );
  return res;
};

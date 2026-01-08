import { IUserResponse } from "@/types/user";
import axios from "axios";

export const login = async (userName: string, password: string) => {
  const res = await axios.post<IUserResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
    userName,
    password,
  });
  return res;
};

export const register = async (
  userName: string,
  password: string,
  fullName: string,
  province: string,
  usertype: string,
  phone: string,
  stt: string
) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
    {
      userName,
      password,
      fullName,
      province,
      usertype,
      phone,
      stt,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`, // Token của admin
      },
    }
  );
  return res;
};

export const changepass = async (newpass: string, token: string) => {
  const res = await axios.post<IUserResponse>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/changepass`,
    {
      newpass,
      token,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`, // Token của admin
      },
    }
  );
  return res;
};

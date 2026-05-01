import { IUserResponse } from "@/types/user";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-base-url";

export const login = async (userName: string, password: string) => {
  const safeUserName = String(userName ?? "").trim();
  const safePassword = String(password ?? "");

  if (!safeUserName || !safePassword) {
    throw new Error("Vui long nhap day du ten dang nhap va mat khau.");
  }

  const res = await axios.post<IUserResponse>(`${getApiBaseUrl()}/api/auth/login`, {
    username: safeUserName,
    userName: safeUserName,
    password: safePassword,
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
  stt: string,
  areaPrefixes?: { area: string; prefix: string }[]
) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${getApiBaseUrl()}/api/auth/register`,
    {
      userName,
      password,
      fullName,
      province,
      usertype,
      phone,
      stt,
      areaPrefixes: areaPrefixes ?? [],
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
    `${getApiBaseUrl()}/api/auth/changepass`,
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


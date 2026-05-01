import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-base-url";

export interface IAreaConfig {
  _id: string;
  province: string;
  area: string;
  prefix: string;
}

const authHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Chưa đăng nhập");
  return { Authorization: `Bearer ${token}` };
};

export const fetchAreaConfigs = async (): Promise<IAreaConfig[]> => {
  const res = await axios.get<{ configs: IAreaConfig[] }>(`${getApiBaseUrl()}/api/area-config`, {
    headers: authHeader(),
  });
  return res.data.configs;
};

export const createAreaConfig = async (data: { province: string; area: string; prefix: string }): Promise<IAreaConfig> => {
  const res = await axios.post<{ config: IAreaConfig }>(`${getApiBaseUrl()}/api/area-config`, data, {
    headers: authHeader(),
  });
  return res.data.config;
};

export const updateAreaConfig = async (id: string, data: { area?: string; prefix?: string }): Promise<IAreaConfig> => {
  const res = await axios.put<{ config: IAreaConfig }>(`${getApiBaseUrl()}/api/area-config/${id}`, data, {
    headers: authHeader(),
  });
  return res.data.config;
};

export const deleteAreaConfig = async (id: string): Promise<void> => {
  await axios.delete(`${getApiBaseUrl()}/api/area-config/${id}`, {
    headers: authHeader(),
  });
};

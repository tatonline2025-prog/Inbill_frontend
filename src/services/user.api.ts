import { IUser } from "@/types/user";
import axios from "axios";

export const fetchallUser = async () => {
  const res = await axios.get<{ user: IUser[] }>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/fetchall`);
  return res;
};

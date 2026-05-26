import { AreaPrefixEntry } from "@/lib/area-prefix";

export interface IUser {
  _id: string;
  username: string;
  fullName: string;
  email?: string;
  pass?: string;
  role: "admin" | "user";
  phone?: string;
  stt?: string;
  usertype?: string;
  bankAccount?: string;
  bankName?: string;
  areaPrefixes?: AreaPrefixEntry[];
  collectionFee?: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface IUserResponse {
  message: string;
  token: string;
  user: IUser;
}

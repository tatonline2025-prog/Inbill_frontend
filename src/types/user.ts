// Ví dụ: trong file src/types/user.ts
export interface IUser {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  province: string;
  pass: string;
  role: "admin" | "user";
  phone: string;
  stt: string;
  usertype: string;
  bankAccount: string;
  bankName: string;
  areaPrefixes: { area: string; prefix: string }[];
  createdAt: string; // Hoặc Date nếu bạn parse nó
  updatedAt: string; // Hoặc Date
}

export interface IUserResponse {
  message: string;
  token: string;
  user: IUser;
}

export const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

const pad2 = (value: number) => String(value).padStart(2, "0");

export const getNowVNDate = (date: Date = new Date()): Date => {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};

export const formatDateVN = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatDateTimeVN = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const toDateKeyVN = (date: Date = new Date()): string => {
  const vn = getNowVNDate(date);
  const year = vn.getUTCFullYear();
  const month = pad2(vn.getUTCMonth() + 1);
  const day = pad2(vn.getUTCDate());
  return `${year}-${month}-${day}`;
};

export const toISOStringVN = (date: Date = new Date()): string => {
  const vn = getNowVNDate(date);
  const year = vn.getUTCFullYear();
  const month = pad2(vn.getUTCMonth() + 1);
  const day = pad2(vn.getUTCDate());
  const hours = pad2(vn.getUTCHours());
  const minutes = pad2(vn.getUTCMinutes());
  const seconds = pad2(vn.getUTCSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
};

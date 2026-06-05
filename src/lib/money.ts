export const normalizeMoneyInputValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return Math.max(0, Math.trunc(value)).toString();
  }

  const digits = String(value).trim().replace(/[^\d]/g, "");
  if (!digits) return "";

  return digits.replace(/^0+(?=\d)/, "");
};

export const normalizeMoneyPayloadValue = (value: unknown): string => {
  return normalizeMoneyInputValue(value) || "0";
};

export const parseMoneyInputNumber = (value: unknown): number => {
  const normalized = normalizeMoneyPayloadValue(value);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const sumMoneyInputValues = (...values: unknown[]): string => {
  return String(values.reduce((sum, value) => sum + parseMoneyInputNumber(value), 0));
};

const hasMoneyInputValue = (value: unknown): boolean => {
  return value !== null && value !== undefined && String(value).trim() !== "";
};

export const resolveInvoiceAmounts = (input: {
  currentAmount?: unknown;
  previousAmount?: unknown;
  totalAmount?: unknown;
}) => {
  const hasCurrent = hasMoneyInputValue(input.currentAmount);
  const hasPrevious = hasMoneyInputValue(input.previousAmount);
  const hasTotal = hasMoneyInputValue(input.totalAmount);

  const previousAmountNum = hasPrevious ? parseMoneyInputNumber(input.previousAmount) : 0;

  let currentAmountNum: number;
  let totalAmountNum: number;

  if (hasTotal) {
    const requestedTotal = parseMoneyInputNumber(input.totalAmount);
    currentAmountNum = Math.max(0, requestedTotal - previousAmountNum);
    totalAmountNum = currentAmountNum + previousAmountNum;
  } else {
    currentAmountNum = hasCurrent ? parseMoneyInputNumber(input.currentAmount) : 0;
    totalAmountNum = currentAmountNum + previousAmountNum;
  }

  return {
    hasAnyAmount: hasCurrent || hasPrevious || hasTotal,
    currentAmount: String(currentAmountNum),
    previousAmount: String(previousAmountNum),
    totalAmount: String(totalAmountNum),
  };
};

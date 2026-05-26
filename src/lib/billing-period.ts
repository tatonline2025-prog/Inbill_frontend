import { getNowVNDate } from "@/lib/date-vn";

const BILLING_PERIOD_PATTERN = /^(0[1-9]|1[0-2])\/\d{4}$/;

type BillingPeriodParts = {
  month: number;
  year: number;
};

export const normalizeBillingPeriod = (value?: string | null) => {
  const period = String(value ?? "").trim();
  return BILLING_PERIOD_PATTERN.test(period) ? period : "";
};

export const parseBillingPeriod = (value?: string | null): BillingPeriodParts | null => {
  const normalized = normalizeBillingPeriod(value);
  if (!normalized) {
    return null;
  }

  const [month, year] = normalized.split("/");
  return {
    month: Number(month),
    year: Number(year),
  };
};

export const formatBillingPeriod = (month: number, year: number) => {
  return `${String(month).padStart(2, "0")}/${year}`;
};

export const getCurrentBillingPeriod = (date: Date = new Date()) => {
  const nowVN = getNowVNDate(date);
  return formatBillingPeriod(nowVN.getUTCMonth() + 1, nowVN.getUTCFullYear());
};

export const shiftBillingPeriod = (period: string, offset = 0) => {
  const parsed = parseBillingPeriod(period);

  if (!parsed) {
    return getCurrentBillingPeriod();
  }

  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1 + offset, 1));
  return formatBillingPeriod(shifted.getUTCMonth() + 1, shifted.getUTCFullYear());
};

export const sortBillingPeriodsAsc = (values: string[]) => {
  return Array.from(new Set(values.map((value) => normalizeBillingPeriod(value)).filter(Boolean))).sort((left, right) => {
    const leftParts = parseBillingPeriod(left);
    const rightParts = parseBillingPeriod(right);

    if (!leftParts && !rightParts) {
      return String(left).localeCompare(String(right), "vi");
    }
    if (!leftParts) {
      return 1;
    }
    if (!rightParts) {
      return -1;
    }

    if (leftParts.year !== rightParts.year) {
      return leftParts.year - rightParts.year;
    }

    return leftParts.month - rightParts.month;
  });
};

export const resolveBillingPeriodBase = ({
  preferredPeriod,
  fallbackPeriods = [],
}: {
  preferredPeriod?: string | null;
  fallbackPeriods?: string[];
}) => {
  const normalizedPreferred = normalizeBillingPeriod(preferredPeriod);
  if (normalizedPreferred) {
    return normalizedPreferred;
  }

  const firstFallback = sortBillingPeriodsAsc(fallbackPeriods)[0];
  if (firstFallback) {
    return firstFallback;
  }

  return getCurrentBillingPeriod();
};

export const getBillingPeriodOffset = (basePeriod?: string | null, targetPeriod?: string | null) => {
  const base = parseBillingPeriod(basePeriod);
  const target = parseBillingPeriod(targetPeriod);

  if (!base || !target) {
    return null;
  }

  return (target.year - base.year) * 12 + (target.month - base.month);
};

export const createSequentialBillingPeriods = (basePeriod: string, count: number) => {
  const safeBasePeriod = resolveBillingPeriodBase({ preferredPeriod: basePeriod });
  const safeCount = Math.max(count, 1);

  return Array.from({ length: safeCount }, (_, index) => shiftBillingPeriod(safeBasePeriod, index));
};

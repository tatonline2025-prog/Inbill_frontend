import { useEffect, useMemo, useState } from "react";

import {
  createSequentialBillingPeriods,
  getBillingPeriodOffset,
  resolveBillingPeriodBase,
} from "@/lib/billing-period";

interface UseExpandableBillingPeriodsOptions {
  basePeriod?: string | null;
  fallbackPeriods?: string[];
  initialVisibleCount?: number;
  resetKey?: string | number | boolean;
  selectedPeriod?: string | null;
}

export const useExpandableBillingPeriods = ({
  basePeriod,
  fallbackPeriods = [],
  initialVisibleCount = 2,
  resetKey,
  selectedPeriod,
}: UseExpandableBillingPeriodsOptions) => {
  const resolvedBasePeriod = useMemo(
    () =>
      resolveBillingPeriodBase({
        preferredPeriod: basePeriod,
        fallbackPeriods,
      }),
    [basePeriod, fallbackPeriods]
  );

  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  useEffect(() => {
    setVisibleCount(initialVisibleCount);
  }, [initialVisibleCount, resetKey, resolvedBasePeriod]);

  const requiredCount = useMemo(() => {
    const offset = getBillingPeriodOffset(resolvedBasePeriod, selectedPeriod);
    if (offset === null || offset < 0) {
      return 0;
    }

    return offset + 1;
  }, [resolvedBasePeriod, selectedPeriod]);

  const effectiveCount = Math.max(initialVisibleCount, visibleCount, requiredCount);

  const visiblePeriods = useMemo(
    () => createSequentialBillingPeriods(resolvedBasePeriod, effectiveCount),
    [effectiveCount, resolvedBasePeriod]
  );

  return {
    basePeriod: resolvedBasePeriod,
    visiblePeriods,
    expandPeriods: () => setVisibleCount((currentCount) => currentCount + 1),
  };
};

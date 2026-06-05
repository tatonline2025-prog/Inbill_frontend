import { useEffect, useMemo, useState } from "react";

import {
  createBillingPeriodWindow,
  getBillingPeriodOffset,
  resolveBillingPeriodBase,
} from "@/lib/billing-period";

interface UseExpandableBillingPeriodsOptions {
  basePeriod?: string | null;
  fallbackPeriods?: string[];
  initialPastCount?: number;
  initialFutureCount?: number;
  resetKey?: string | number | boolean;
  selectedPeriod?: string | null;
}

export const useExpandableBillingPeriods = ({
  basePeriod,
  fallbackPeriods = [],
  initialPastCount = 1,
  initialFutureCount = 1,
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

  const [pastCount, setPastCount] = useState(initialPastCount);
  const [futureCount, setFutureCount] = useState(initialFutureCount);

  useEffect(() => {
    setPastCount(initialPastCount);
    setFutureCount(initialFutureCount);
  }, [initialFutureCount, initialPastCount, resetKey, resolvedBasePeriod]);

  const requiredCounts = useMemo(() => {
    const offset = getBillingPeriodOffset(resolvedBasePeriod, selectedPeriod);
    if (offset === null) {
      return {
        past: 0,
        future: 0,
      };
    }

    if (offset > 0) {
      return {
        past: 0,
        future: offset,
      };
    }

    return {
      past: Math.abs(offset),
      future: 0,
    };
  }, [resolvedBasePeriod, selectedPeriod]);

  const effectivePastCount = Math.max(initialPastCount, pastCount, requiredCounts.past);
  const effectiveFutureCount = Math.max(initialFutureCount, futureCount, requiredCounts.future);

  const visiblePeriods = useMemo(
    () => createBillingPeriodWindow(resolvedBasePeriod, effectivePastCount, effectiveFutureCount),
    [effectiveFutureCount, effectivePastCount, resolvedBasePeriod]
  );

  return {
    basePeriod: resolvedBasePeriod,
    visiblePeriods,
    expandPeriods: () => {
      setPastCount((currentCount) => currentCount + 1);
      setFutureCount((currentCount) => currentCount + 1);
    },
  };
};

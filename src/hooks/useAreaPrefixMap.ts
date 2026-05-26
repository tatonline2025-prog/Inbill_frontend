"use client";

import { useEffect, useState } from "react";

import { compareAreaPrefixEntries } from "@/lib/area-prefix";
import { fetchAreaConfigs, IAreaConfig } from "@/services/areaConfig.api";

export type AreaPrefixMap = Record<string, IAreaConfig[]>;

export function useAreaPrefixMap() {
  const [groupedConfigs, setGroupedConfigs] = useState<AreaPrefixMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [configs, setConfigs] = useState<IAreaConfig[]>([]);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAreaConfigs();
      const sorted = [...data].sort((left, right) => compareAreaPrefixEntries(left, right));
      setConfigs(sorted);

      const grouped: AreaPrefixMap = {};
      for (const config of sorted) {
        if (!grouped[config.area]) grouped[config.area] = [];
        grouped[config.area].push(config);
      }
      setGroupedConfigs(grouped);
    } catch {
      setConfigs([]);
      setGroupedConfigs({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { map: groupedConfigs, groupedConfigs, configs, isLoading, reload: load };
}

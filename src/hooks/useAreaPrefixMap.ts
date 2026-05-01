"use client";
import { useEffect, useState } from "react";
import { fetchAreaConfigs, IAreaConfig } from "@/services/areaConfig.api";

export type AreaPrefixMap = Record<string, { _id: string; area: string; prefix: string }[]>;

/**
 * Hook trả về AREA_PREFIX_MAP lấy từ DB (tự cache trong session).
 * Tự động fetch khi mount, refetch khi gọi reload().
 */
export function useAreaPrefixMap() {
  const [map, setMap] = useState<AreaPrefixMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [configs, setConfigs] = useState<IAreaConfig[]>([]);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAreaConfigs();
      setConfigs(data);

      // Nhóm theo province
      const grouped: AreaPrefixMap = {};
      for (const c of data) {
        if (!grouped[c.province]) grouped[c.province] = [];
        grouped[c.province].push({ _id: c._id, area: c.area, prefix: c.prefix });
      }
      setMap(grouped);
    } catch {
      // Nếu lỗi → trả về map rỗng, form vẫn hoạt động
      setMap({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { map, configs, isLoading, reload: load };
}

export const FREE_AREA_NAME = "Tự do";

export interface AreaPrefixEntry {
  area: string;
  prefix: string;
}

const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, " ");

const normalizeComparableText = (value: string): string =>
  normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const normalizeAreaName = (value: unknown): string => {
  const raw = normalizeWhitespace(typeof value === "string" ? value : "");
  if (!raw) return "";

  const comparable = normalizeComparableText(raw).replace(/[^\p{L}\p{N}]+/gu, " ");
  if (comparable === "tu do" || comparable === "xa phuong tu do") {
    return FREE_AREA_NAME;
  }

  return raw;
};

export const normalizePrefix = (value: unknown): string =>
  normalizeWhitespace(typeof value === "string" ? value : "").toUpperCase();

export const isFreeArea = (value: unknown): boolean => normalizeAreaName(value) === FREE_AREA_NAME;

export const normalizeAreaPrefixEntry = (value: unknown): AreaPrefixEntry | null => {
  if (!value || typeof value !== "object") return null;

  const item = value as { area?: unknown; prefix?: unknown };
  const area = normalizeAreaName(item.area);
  const prefix = normalizePrefix(item.prefix);

  if (!area) return null;
  if (isFreeArea(area)) {
    return { area: FREE_AREA_NAME, prefix: "" };
  }
  if (!prefix) return null;
  return { area, prefix };
};

export const ensureAreaPrefixes = (value: unknown): AreaPrefixEntry[] => {
  if (!Array.isArray(value)) {
    return [{ area: FREE_AREA_NAME, prefix: "" }];
  }

  const seen = new Set<string>();
  const entries = value
    .map((item) => normalizeAreaPrefixEntry(item))
    .filter((entry): entry is AreaPrefixEntry => Boolean(entry))
    .filter((entry) => {
      const key = `${entry.area}__${entry.prefix}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return entries.length > 0 ? entries : [{ area: FREE_AREA_NAME, prefix: "" }];
};

export const isFlexibleAreaEntry = (entry: AreaPrefixEntry | null | undefined): boolean =>
  !!entry && isFreeArea(entry.area) && !entry.prefix;

export const compareAreaPrefixEntries = (left: AreaPrefixEntry, right: AreaPrefixEntry): number => {
  const leftFree = isFlexibleAreaEntry(left);
  const rightFree = isFlexibleAreaEntry(right);
  if (leftFree && !rightFree) return -1;
  if (!leftFree && rightFree) return 1;

  return left.area.localeCompare(right.area, "vi") || left.prefix.localeCompare(right.prefix, "vi");
};

export const formatAreaPrefixLabel = (entry: AreaPrefixEntry | null | undefined): string => {
  if (!entry) return FREE_AREA_NAME;
  if (isFlexibleAreaEntry(entry)) return FREE_AREA_NAME;
  return `${entry.area} (${entry.prefix})`;
};

export const getAreaPrefixKey = (entry: AreaPrefixEntry | null | undefined): string => {
  if (!entry) return `${FREE_AREA_NAME}__`;
  return `${entry.area}__${entry.prefix}`;
};

export const getPrimaryAreaPrefix = (userLike: { areaPrefixes?: AreaPrefixEntry[] | null | undefined }): AreaPrefixEntry =>
  ensureAreaPrefixes(userLike.areaPrefixes)[0];

export const userMatchesAreaPrefixes = (
  userLike: { areaPrefixes?: AreaPrefixEntry[] | null | undefined },
  selectedPrefixes: string[]
): boolean => {
  if (selectedPrefixes.length === 0) return true;

  const normalizedAreas = ensureAreaPrefixes(userLike.areaPrefixes);
  if (normalizedAreas.some((entry) => isFlexibleAreaEntry(entry))) {
    return true;
  }

  return normalizedAreas.some((entry) => entry.prefix && selectedPrefixes.includes(entry.prefix));
};

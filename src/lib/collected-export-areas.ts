import {
  AreaPrefixEntry,
  compareAreaPrefixEntries,
  ensureAreaPrefixes,
  getAreaPrefixKey,
  isFlexibleAreaEntry,
} from "@/lib/area-prefix";

type AreaUser = { _id: string; areaPrefixes?: AreaPrefixEntry[] };
export type CollectedExportAreaOption = [string, AreaPrefixEntry];
export type CollectedExportAreaScope = { prefixes: string[]; unrestrictedUserIds: string[] };

export function getCollectedExportAreaOptions(users: AreaUser[]): CollectedExportAreaOption[] {
  const options = new Map<string, AreaPrefixEntry>();
  users.forEach((user) => ensureAreaPrefixes(user.areaPrefixes).forEach((entry) => {
    options.set(getAreaPrefixKey(entry), entry);
  }));
  return [...options.entries()].sort(([, left], [, right]) => compareAreaPrefixEntries(left, right));
}

export function getDefaultCollectedExportAreaKeys(options: CollectedExportAreaOption[]): string[] {
  const defaults = options.filter(([, entry]) => ["Lấp Vò", "Lai Vung"].some((name) =>
    entry.area.localeCompare(name, "vi", { sensitivity: "base" }) === 0
  )).map(([key]) => key);
  return defaults.length > 0 ? defaults : options.map(([key]) => key);
}

export function filterCollectedExportUsers<T extends AreaUser>(users: T[], selectedKeys: string[]): T[] {
  const selected = new Set(selectedKeys);
  return users.filter((user) => ensureAreaPrefixes(user.areaPrefixes).some((entry) => selected.has(getAreaPrefixKey(entry))));
}

export function getCollectedExportAreaScope(
  users: AreaUser[], options: CollectedExportAreaOption[], selectedKeys: string[]
): CollectedExportAreaScope | undefined {
  if (options.length > 0 && options.every(([key]) => selectedKeys.includes(key))) return undefined;
  const selected = new Set(selectedKeys);
  return {
    prefixes: [...new Set(options.filter(([key]) => selected.has(key)).map(([, entry]) => entry.prefix).filter(Boolean))],
    unrestrictedUserIds: users.filter((user) => ensureAreaPrefixes(user.areaPrefixes).some((entry) =>
      isFlexibleAreaEntry(entry) && selected.has(getAreaPrefixKey(entry))
    )).map((user) => user._id),
  };
}

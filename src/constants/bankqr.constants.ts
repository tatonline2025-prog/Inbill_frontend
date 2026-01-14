export interface IBankConstant {
  name: string;
  code: string;
  bin: string;
  shortName: string;
}

export const VIET_BANKS: IBankConstant[] = [
  { name: "Vietcombank", code: "vcb", bin: "970436", shortName: "VCB" },
  { name: "VietinBank", code: "icb", bin: "970415", shortName: "VietinBank" },
  { name: "BIDV", code: "bidv", bin: "970418", shortName: "BIDV" },
  { name: "Agribank", code: "agribank", bin: "970405", shortName: "Agribank" },
  { name: "MBBank", code: "mbb", bin: "970422", shortName: "MB" },
  { name: "Techcombank", code: "tcb", bin: "970407", shortName: "Techcombank" },
  { name: "VPBank", code: "vpb", bin: "970432", shortName: "VPBank" },
  { name: "ACB", code: "acb", bin: "970416", shortName: "ACB" },
  { name: "TPBank", code: "tpb", bin: "970423", shortName: "TPBank" },
  { name: "Sacombank", code: "stb", bin: "970403", shortName: "Sacombank" },
  { name: "HDBank", code: "hdb", bin: "970437", shortName: "HDBank" },
  { name: "VIB", code: "vib", bin: "970441", shortName: "VIB" },
];

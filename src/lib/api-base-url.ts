export const getApiBaseUrl = () => {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const isAbsoluteEnvBase = !!envBase && /^https?:\/\//i.test(envBase);

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return isAbsoluteEnvBase ? envBase : "/backend";
    }
  }

  return envBase || "/backend";
};


export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "禾苗地理社区版";
export const TIANDITU_KEY = process.env.NEXT_PUBLIC_TIANDITU_KEY?.trim() ?? "";
export const TIANDITU_CREDIT = process.env.NEXT_PUBLIC_TIANDITU_CREDIT?.trim() ?? "";
export const hasTianditu = !!(TIANDITU_KEY && TIANDITU_CREDIT);

export const OFFICIAL_SITE_URL = "https://geography.hemiaoji.com/home";
export const COMMUNITY_REPO_URL = "https://github.com/hemiao-ai/hemiao-geography-community";

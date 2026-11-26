export const TEXTBOOK_COVER_ART = {
  "junior-6a": { label: "六年级上册", theme: "地球与世界", color: "#123c79" },
  "junior-6b": { label: "六年级下册", theme: "世界区域", color: "#19624c" },
  "junior-7a": { label: "七年级上册", theme: "地球与世界", color: "#173a76" },
  "junior-7b": { label: "七年级下册", theme: "世界区域", color: "#126054" },
  "junior-8a": { label: "八年级上册", theme: "中国自然与人文地理", color: "#975014" },
  "junior-8b": { label: "八年级下册", theme: "中国区域地理", color: "#7c3d34" },
  "high-required-1": { label: "必修第一册", theme: "自然地理", color: "#243e71" },
  "high-required-2": { label: "必修第二册", theme: "人文地理", color: "#514168" },
  "high-elective-1": { label: "选择性必修1", theme: "自然地理基础", color: "#294c68" },
  "high-elective-2": { label: "选择性必修2", theme: "区域发展", color: "#624674" },
  "high-elective-3": { label: "选择性必修3", theme: "资源、环境与国家安全", color: "#15544b" },
} as const;

type Artwork = keyof typeof TEXTBOOK_COVER_ART;

export function textbookCoverArt(book: { volume: string; stage: string; edition: string }) {
  const title = book.volume.replace(/\s/g, "");
  const volume = (Object.keys(TEXTBOOK_COVER_ART) as Artwork[]).find(key => title.startsWith(TEXTBOOK_COVER_ART[key].label));
  if (!volume) return;
  let artwork = volume;
  if (book.stage === "初中（五•四学制）") {
    if (volume === "junior-7a") artwork = "junior-8a";
    if (volume === "junior-7b") artwork = "junior-8b";
  } else if (book.edition === "中图版（主编：王民）") {
    if (volume === "junior-7b") artwork = "junior-8b";
    if (volume === "junior-8a") artwork = "junior-7a";
    if (volume === "junior-8b") artwork = "junior-7b";
  }
  return { ...TEXTBOOK_COVER_ART[artwork], label: TEXTBOOK_COVER_ART[volume].label, src: "/book-covers/library/" + artwork + ".webp" };
}

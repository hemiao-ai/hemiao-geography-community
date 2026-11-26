import smartEduSnapshot from "./smartedu-geography.json";
import pdfPages from "./textbook-pdf-pages.json";

export const SMARTEDU_CATALOG_URL = "https://basic.smartedu.cn/elecEdu";
export const SMARTEDU_STAGES = ["初中", "初中（五•四学制）", "高中"] as const;
export const SMARTEDU_GROUPS = smartEduSnapshot.groups;
export const SMARTEDU_BOOK_COUNT = SMARTEDU_GROUPS.reduce((total, group) => total + group.books.length, 0);

export function smartEduCatalogHref(filterTag: string) {
  const url = new URL(SMARTEDU_CATALOG_URL);
  url.searchParams.set("defaultTag", filterTag);
  return url.href;
}

export function smartEduBookHref(resourceId: string) {
  const url = new URL("/tchMaterial/detail", SMARTEDU_CATALOG_URL);
  url.search = new URLSearchParams({
    contentType: "assets_document",
    contentId: resourceId,
    catalogType: "tchMaterial",
    subCatalog: "tchMaterial",
  }).toString();
  return url.href;
}

export const XIANGJIAO_RELEASE_URL = "https://news.bakclass.com/news/newsArticle?newsId=1772";

const XIANGJIAO_PDF_BASE = "https://bkw-legacy-1253158545.cos.ap-guangzhou.myqcloud.com/cms/news/";

export function publisherBookId(id: string) { return "xiangjiao-" + id; }

type PublisherBook = {
  id: string;
  stage: "初中" | "高中";
  volume: string;
  pdfUrl: string;
  chapters: string[];
};

export const XIANGJIAO_BOOKS: PublisherBook[] = [
  { id: "2020-junior-7b", pdfUrl: XIANGJIAO_PDF_BASE + "2020-02-03/fYE9_ZEhQc6Z94ETAhZh5Q.pdf", stage: "初中", volume: "七年级下册", chapters: ["第六章 认识大洲", "第七章 了解地区", "第八章 走近国家"] },
  { id: "2020-junior-8b", pdfUrl: XIANGJIAO_PDF_BASE + "2020-02-03/A88jO9a2Sji21bOuoAv-fQ.pdf", stage: "初中", volume: "八年级下册", chapters: ["第五章 中国的地域差异", "第六章 认识区域：位置与分布", "第七章 认识区域：联系与差异", "第八章 认识区域：环境与发展", "第九章 建设永续发展的美丽中国"] },
  { id: "high-required-1", pdfUrl: XIANGJIAO_PDF_BASE + "2020-07-28/UBkHWBcHT3yXSAfj-5uYTw.pdf", stage: "高中", volume: "必修 第一册", chapters: ["第一章 宇宙中的地球", "第二章 地球表面形态", "第三章 地球上的大气", "第四章 地球上的水", "第五章 地球上的植被与土壤"] },
  { id: "high-required-2", pdfUrl: XIANGJIAO_PDF_BASE + "2020-02-25/I5ZhVLemQYmswYsF7PEvSw.pdf", stage: "高中", volume: "必修 第二册", chapters: ["第一章 人口与地理环境", "第二章 城镇和乡村", "第三章 产业区位选择", "第四章 区域发展战略", "第五章 人地关系与可持续发展"] },
  { id: "high-elective-1", pdfUrl: XIANGJIAO_PDF_BASE + "2020-12-01/Q6Zgaw9wQDWookH2iK9r5w.pdf", stage: "高中", volume: "选择性必修1 自然地理基础", chapters: ["第一章 地球的运动", "第二章 岩石圈与地表形态", "第三章 大气的运动", "第四章 陆地水与洋流", "第五章 自然环境的整体性与差异性"] },
  { id: "high-elective-2", pdfUrl: XIANGJIAO_PDF_BASE + "2020-12-01/HcE6dJSZQg-efvEVIh8etw.pdf", stage: "高中", volume: "选择性必修2 区域发展", chapters: ["第一章 认识区域", "第二章 区域发展", "第三章 区域合作"] },
  { id: "high-elective-3", pdfUrl: XIANGJIAO_PDF_BASE + "2020-12-01/q4tUeVycSHiyQ81aLE2a2g.pdf", stage: "高中", volume: "选择性必修3 资源、环境与国家安全", chapters: ["第一章 资源、环境与人类活动", "第二章 自然资源与国家安全", "第三章 生态环境保护与国家安全"] },
];

export type LibraryBook = {
  id: string;
  stage: string;
  edition: string;
  volume: string;
  chapters: readonly string[];
  pages?: number;
  source: "smartedu" | "publisher";
  originalUrl: string;
};

const pageCounts: Partial<Record<string, number>> = pdfPages;

export const LIBRARY_BOOKS: LibraryBook[] = [
  ...SMARTEDU_GROUPS.flatMap(({ stage, edition, books }) => books.map(book => ({
    id: book.resourceId, stage, edition, volume: book.volume, chapters: book.chapters ?? [],
    pages: pageCounts[book.resourceId], source: "smartedu" as const, originalUrl: smartEduBookHref(book.resourceId),
  }))),
  ...XIANGJIAO_BOOKS.map(book => ({
    id: publisherBookId(book.id), stage: book.stage, edition: "湘教版", volume: book.volume, chapters: book.chapters,
    pages: pageCounts[publisherBookId(book.id)], source: "publisher" as const, originalUrl: book.pdfUrl,
  })),
];

export function libraryBookById(id: string) {
  return LIBRARY_BOOKS.find(book => book.id === id);
}

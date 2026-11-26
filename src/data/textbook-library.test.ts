import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BOOKS } from "./catalog";
import { textbookCoverArt } from "./textbook-cover-art";
import { LIBRARY_BOOKS, libraryBookById, SMARTEDU_BOOK_COUNT, SMARTEDU_GROUPS, SMARTEDU_STAGES, smartEduBookHref, smartEduCatalogHref, XIANGJIAO_BOOKS } from "./textbook-library";

describe("地理教材索引", () => {
  it("收录 61 册新增平台教材，不重复列出现有初中人教版", () => {
    const books = SMARTEDU_GROUPS.flatMap(group => group.books);
    expect(SMARTEDU_BOOK_COUNT).toBe(61);
    expect(new Set(books.map(book => book.resourceId)).size).toBe(books.length);
    expect(SMARTEDU_GROUPS.some(group => group.stage === "初中" && group.edition === "人教版")).toBe(false);
    expect(SMARTEDU_STAGES.map(stage => SMARTEDU_GROUPS.filter(group => group.stage === stage).flatMap(group => group.books).length)).toEqual([28, 8, 25]);
  });

  it("用原始分类标签构建官方教材索引入口", () => {
    for (const group of SMARTEDU_GROUPS) for (const book of group.books) {
      const url = new URL(smartEduCatalogHref(book.filterTag));
      expect(url.origin + url.pathname).toBe("https://basic.smartedu.cn/elecEdu");
      expect(url.searchParams.get("defaultTag")?.split("/")).toHaveLength(5);
    }
  });

  it("出版社电子版与平台索引分开，且每册有已核对的章目录", () => {
    expect(XIANGJIAO_BOOKS.filter(book => book.stage === "初中")).toHaveLength(2);
    expect(XIANGJIAO_BOOKS.filter(book => book.stage === "高中")).toHaveLength(5);
    expect(XIANGJIAO_BOOKS.every(book => book.chapters.length > 0)).toBe(true);
  });

  it("为所有教材分配独立的课程库入口并保留各自的官方原书来源", () => {
    const ids = [...BOOKS, ...LIBRARY_BOOKS].map(book => book.id);
    expect(LIBRARY_BOOKS).toHaveLength(68);
    expect(new Set(ids).size).toBe(ids.length);
    for (const book of LIBRARY_BOOKS) {
      expect(libraryBookById(book.id)).toBe(book);
      expect(book.pages).toBeGreaterThan(0);
      expect(book.chapters.length).toBeGreaterThan(0);
      const url = new URL(book.originalUrl);
      if (book.source === "smartedu") expect(url.searchParams.get("contentId")).toBe(book.id);
      else expect(url.pathname).toMatch(/\.pdf$/);
    }
    expect(libraryBookById("missing")).toBeUndefined();
  });

  it("为所有册别配上存在的封面，并保留准确的册名", () => {
    const paths = new Set<string>();
    for (const book of LIBRARY_BOOKS) {
      const cover = textbookCoverArt(book);
      expect(cover).toBeDefined();
      if (!cover) continue;
      expect(book.volume.replace(/\s/g, "").startsWith(cover.label)).toBe(true);
      paths.add(cover.src);
    }
    expect(paths.size).toBe(11);
    for (const path of paths) expect(existsSync(join(process.cwd(), "public", path))).toBe(true);
  });

  it("收录高中人教版必修第一册的六章目录及原书入口", () => {
    const resourceId = "e2c5fb9c-9a73-4f1a-8fb5-10b1299c7f5c";
    const book = SMARTEDU_GROUPS.find(group => group.stage === "高中" && group.edition === "人教版")
      ?.books.find(book => book.resourceId === resourceId);
    expect(book).toMatchObject({ volume: "必修 第一册", chapters: expect.arrayContaining(["第一章 宇宙中的地球", "第六章 自然灾害"]) });
    expect(book && "chapters" in book && book.chapters).toHaveLength(6);
    const url = new URL(smartEduBookHref(resourceId));
    expect(url.origin + url.pathname).toBe("https://basic.smartedu.cn/tchMaterial/detail");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      contentType: "assets_document",
      contentId: resourceId,
      catalogType: "tchMaterial",
      subCatalog: "tchMaterial",
    });
  });
});

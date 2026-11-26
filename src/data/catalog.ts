/** 人教版 2024 初中地理四册目录。七上已用人教版教材 PDF 复核（2026-11），其余三册待复核；知识点 ID 发布后不得重新编号。 */
export interface Point { id: string; title: string; kind: "lesson" | "project" }
export interface Chapter { id: string; no: string; title: string; points: Point[] }
export interface Book { id: string; title: string; short: string; grade: string; theme: string; color: string; cover?: string; chapters: Chapter[] }

const PROJECT = /^【跨学科主题学习】/;
const chapter = (id: string, no: string, title: string, points: string[]): Chapter => ({
  id, no, title, points: points.map((t, i) => ({ id: `${id}s${i + 1}`, title: t.replace(PROJECT, ""), kind: PROJECT.test(t) ? "project" : "lesson" })),
});

export const BOOKS: Book[] = [
  { id: "rj-g7a", title: "人教版 七年级上册", short: "七上", grade: "七年级", theme: "地球与世界", color: "#136f99", cover: "/book-covers/rj-g7a-v2.webp", chapters: [
    chapter("c0", "绪言", "与同学们谈地理", ["地理第一课"]),
    chapter("c1", "第一章", "地球", ["地球的宇宙环境", "地球与地球仪", "地球的运动"]),
    chapter("c2", "第二章", "地图", ["地图的阅读", "地形图的判读", "地图的选择和应用", "【跨学科主题学习】美化校园"]),
    chapter("c3", "第三章", "陆地和海洋", ["大洲和大洋", "世界的地形", "海陆的变迁"]),
    chapter("c4", "第四章", "天气与气候", ["多变的天气", "气温的变化与分布", "降水的变化与分布", "世界的气候"]),
    chapter("c5", "第五章", "居民与文化", ["人口与人种", "城镇与乡村", "多样的文化"]),
    chapter("c6", "第六章", "发展与合作", ["发展与合作", "【跨学科主题学习】探索外来食料作物传播史"]),
  ] },
  { id: "rj-g7b", title: "人教版 七年级下册", short: "七下", grade: "七年级", theme: "世界区域", color: "#2f8a55", cover: "/book-covers/rj-g7b-v2.webp", chapters: [
    chapter("c7", "第七章", "我们生活的大洲——亚洲", ["自然环境", "人文环境"]),
    chapter("c8", "第八章", "我们邻近的地区和国家", ["日本", "东南亚", "印度", "俄罗斯", "【跨学科主题学习】认识东南亚的世界遗产"]),
    chapter("c9", "第九章", "东半球其他的地区和国家", ["西亚", "欧洲西部", "撒哈拉以南非洲", "澳大利亚"]),
    chapter("c10", "第十章", "西半球的国家", ["美国", "巴西", "【跨学科主题学习】探寻热带雨林的固碳功能"]),
    chapter("c11", "第十一章", "极地地区", ["极地地区"]),
  ] },
  { id: "rj-g8a", title: "人教版 八年级上册", short: "八上", grade: "八年级", theme: "中国的自然与经济", color: "#c8841c", cover: "/book-covers/rj-g8a-v2.webp", chapters: [
    chapter("c1", "第一章", "从世界看中国", ["疆域", "人口", "民族"]),
    chapter("c2", "第二章", "中国的自然环境", ["地形", "气候", "河流与湖泊", "【跨学科主题学习】探究“束水攻沙”原理"]),
    chapter("c3", "第三章", "中国的自然资源", ["土地资源", "水资源", "矿产资源", "海洋资源", "【跨学科主题学习】认识我国的“世界灌溉工程遗产”"]),
    chapter("c4", "第四章", "中国的经济发展", ["农业", "工业", "交通运输"]),
    chapter("c5", "第五章", "建设美丽中国", ["自然灾害与防灾减灾", "环境保护与发展"]),
  ] },
  { id: "rj-g8b", title: "人教版 八年级下册", short: "八下", grade: "八年级", theme: "中国的区域", color: "#a2533b", cover: "/book-covers/rj-g8b-v2.webp", chapters: [
    chapter("c6", "第六章", "中国的地理差异", ["中国的地理差异", "【跨学科主题学习】了解二十四节气"]),
    chapter("c7", "第七章", "北方地区", ["自然特征与农业", "“白山黑水”——东北三省", "世界最大的黄土堆积区——黄土高原", "祖国的首都——北京"]),
    chapter("c8", "第八章", "南方地区", ["自然特征与农业", "“鱼米之乡”——长江三角洲地区", "特别行政区——香港和澳门", "祖国的神圣领土——台湾省", "【跨学科主题学习】认识地名的由来和演变"]),
    chapter("c9", "第九章", "西北地区", ["自然特征与农业", "干旱的宝地——塔里木盆地"]),
    chapter("c10", "第十章", "青藏地区", ["自然特征与农业", "“中华水塔”——三江源地区"]),
    chapter("c11", "第十一章", "奋进中的中国", ["奋进中的中国"]),
  ] },
];

export const bookById = (id: string) => BOOKS.find(b => b.id === id);
export function findPoint(bookId: string, pointId: string) {
  const book = bookById(bookId);
  for (const chapter of book?.chapters ?? []) {
    const point = chapter.points.find(p => p.id === pointId);
    if (point && book) return { book, chapter, point };
  }
  return null;
}
export const pointKey = (bookId: string, pointId: string) => `${bookId}/${pointId}`;
export const pointHref = (bookId: string, pointId: string) => `/learn/${bookId}/${pointId}`;

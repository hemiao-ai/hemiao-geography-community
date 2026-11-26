/** 八上中国地理的教学数据与判定。坐标为 [经度, 纬度]，只用于在标准底图上加标注，不绘制任何界线。 */
export type LonLat = [number, number];
export const CHINA_BBOX: [number, number, number, number] = [72, -4, 136, 54.5];

/* ---------- 地形：三级阶梯 ---------- */
export const RANGES: Record<string, { name: string; line: LonLat[] }> = {
  kunlun: { name: "昆仑山脉", line: [[78, 36.3], [86, 36], [95, 35.8]] },
  qilian: { name: "祁连山脉", line: [[95, 39], [99, 38.3], [102.5, 37.4]] },
  hengduan: { name: "横断山脉", line: [[98.5, 32], [99.3, 29], [99.8, 26]] },
  daxinganling: { name: "大兴安岭", line: [[122, 52.5], [121, 48], [119.5, 43.5]] },
  taihang: { name: "太行山脉", line: [[115, 40], [114, 37.5], [113, 35.2]] },
  wushan: { name: "巫山", line: [[110.5, 31.8], [110, 30.6]] },
  xuefeng: { name: "雪峰山", line: [[111.2, 28.6], [110.5, 26.5]] },
  tianshan: { name: "天山山脉", line: [[76, 42.2], [83, 43], [91, 43.2]] },
  qinling: { name: "秦岭", line: [[104.5, 34.2], [108, 34], [111.5, 33.8]] },
  nanling: { name: "南岭", line: [[110, 25.4], [113, 25], [115.5, 24.8]] },
  yinshan: { name: "阴山山脉", line: [[106.5, 41.2], [110.5, 41.2], [114, 41.5]] },
};
export const STEP_BOUNDS = { first: ["kunlun", "qilian", "hengduan"], second: ["daxinganling", "taihang", "wushan", "xuefeng"] } as const;
export const LANDFORMS: Record<string, { name: string; kind: "高原" | "盆地" | "平原"; at: LonLat; step: 1 | 2 | 3 }> = {
  qingzang: { name: "青藏高原", kind: "高原", at: [88, 33], step: 1 },
  neimenggu: { name: "内蒙古高原", kind: "高原", at: [112, 42.5], step: 2 },
  huangtu: { name: "黄土高原", kind: "高原", at: [108, 37], step: 2 },
  yungui: { name: "云贵高原", kind: "高原", at: [104, 25.5], step: 2 },
  tarim: { name: "塔里木盆地", kind: "盆地", at: [83, 39.3], step: 2 },
  sichuan: { name: "四川盆地", kind: "盆地", at: [105.5, 30.3], step: 2 },
  dongbei: { name: "东北平原", kind: "平原", at: [125.5, 45], step: 3 },
  huabei: { name: "华北平原", kind: "平原", at: [116, 36], step: 3 },
  changjiang: { name: "长江中下游平原", kind: "平原", at: [116, 30.5], step: 3 },
};
/** 沿北纬 32° 附近的地形剖面（经度, 平均海拔 m），依据公开地形资料概括 */
export const PROFILE_32N: [number, number][] = [[80, 4800], [84, 4950], [88, 4900], [92, 4800], [96, 4500], [99, 3900], [101.5, 3200], [103, 1800], [104, 520], [106, 450], [107.5, 1300], [109, 1500], [110.5, 900], [112, 200], [114, 80], [116, 40], [118, 20], [121, 4]];
export const stepOf = (elev: number) => (elev >= 3500 ? 1 : elev >= 500 ? 2 : 3);

/* ---------- 气候 ---------- */
export interface ClimateCity { name: string; at: LonLat; alt: number; t: number[]; p: number[] }
/** 1991～2020 年气候平均值的近似数据（月平均气温 ℃、月降水量 mm），用于教学示意 */
export const CLIMATE_CITIES: Record<string, ClimateCity> = {
  harbin: { name: "哈尔滨", at: [126.6, 45.8], alt: 142, t: [-17.6, -12.6, -3.0, 7.2, 14.8, 20.4, 23.1, 21.4, 15.0, 6.0, -5.0, -14.5], p: [4, 5, 11, 23, 45, 90, 140, 110, 55, 25, 8, 6] },
  beijing: { name: "北京", at: [116.4, 39.9], alt: 55, t: [-3.1, 0.3, 6.7, 14.8, 20.8, 24.9, 26.7, 25.5, 20.8, 13.7, 5.0, -0.9], p: [3, 5, 9, 26, 29, 71, 176, 182, 49, 19, 6, 2] },
  wuhan: { name: "武汉", at: [114.3, 30.6], alt: 23, t: [4.0, 6.9, 11.4, 17.6, 22.8, 26.5, 29.4, 28.8, 24.5, 18.6, 12.0, 6.3], p: [50, 65, 100, 140, 165, 230, 210, 125, 75, 80, 55, 30] },
  haikou: { name: "海口", at: [110.3, 20.0], alt: 14, t: [18.0, 19.2, 22.0, 25.2, 27.8, 28.9, 29.1, 28.5, 27.5, 25.6, 22.8, 19.5], p: [22, 30, 50, 100, 180, 240, 200, 260, 280, 200, 80, 30] },
  urumqi: { name: "乌鲁木齐", at: [87.6, 43.8], alt: 935, t: [-12.6, -9.7, -1.7, 9.9, 16.7, 21.5, 23.5, 22.1, 16.6, 7.6, -2.2, -9.6], p: [10, 10, 18, 30, 30, 35, 25, 25, 20, 20, 15, 12] },
  lhasa: { name: "拉萨", at: [91.1, 29.6], alt: 3650, t: [-1.6, 1.8, 5.5, 8.8, 12.6, 15.6, 15.6, 14.8, 13.2, 8.8, 3.4, -0.7], p: [1, 1, 3, 8, 26, 78, 130, 130, 63, 9, 1, 1] },
};
export type ClimateType = "热带季风气候" | "亚热带季风气候" | "温带季风气候" | "温带大陆性气候" | "高原山地气候";
/** 按教材判读思路分类：先看海拔，再看最冷月气温，最后看年降水量 */
export function classifyChina(c: Pick<ClimateCity, "alt" | "t" | "p">): ClimateType {
  if (c.alt >= 3000) return "高原山地气候";
  const cold = Math.min(...c.t), total = c.p.reduce((a, b) => a + b, 0);
  if (cold >= 15) return "热带季风气候";
  if (cold >= 0) return "亚热带季风气候";
  return total >= 400 ? "温带季风气候" : "温带大陆性气候";
}
/** 夏季风雨带：各月雨带中心纬度（东部季风区，约 105°E 以东），null 表示雨带已退出大陆 */
export const RAIN_BELT: (number | null)[] = [null, null, null, 22, 24, 30, 37, 39, 25, null, null, null];
export const RAIN_BELT_LABEL = (m: number) => ({ 4: "华南", 5: "华南", 6: "长江中下游（梅雨）", 7: "华北、东北", 8: "华北、东北", 9: "退回华南" } as Record<number, string>)[m] ?? "雨带不在大陆上空";
export const MONSOON = { winter: "西北风", summer: "东南风" } as const;

/* ---------- 河流 ---------- */
export const RIVER_POINTS: Record<string, { name: string; at: LonLat; river: "changjiang" | "huanghe" }> = {
  chongqing: { name: "重庆", at: [106.5, 29.6], river: "changjiang" }, yichang: { name: "宜昌", at: [111.3, 30.7], river: "changjiang" }, wuhan: { name: "武汉", at: [114.3, 30.6], river: "changjiang" },
  hukou: { name: "湖口", at: [116.2, 29.7], river: "changjiang" }, nanjing: { name: "南京", at: [118.8, 32.1], river: "changjiang" },
  lanzhou: { name: "兰州", at: [103.8, 36.1], river: "huanghe" }, hekouzhen: { name: "河口镇", at: [111.2, 40.3], river: "huanghe" }, sanmenxia: { name: "三门峡", at: [111.2, 34.8], river: "huanghe" },
  taohuayu: { name: "桃花峪", at: [113.4, 34.9], river: "huanghe" }, jinan: { name: "济南", at: [117, 36.7], river: "huanghe" },
};
export const RIVER_SPLITS = { changjiang: ["yichang", "hukou"], huanghe: ["hekouzhen", "taohuayu"] } as const;
/** 月平均流量的相对值（示意）：长江汛期长、黄河汛期短且有凌汛 */
export const FLOW = { changjiang: [30, 28, 36, 52, 75, 100, 128, 118, 100, 80, 56, 38], huanghe: [14, 16, 30, 20, 22, 30, 62, 82, 74, 48, 24, 26] };
/** 地上河：每年淤积抬高河床，单位 cm */
export const silt = (years: number) => Math.round(years * 10);

/* ---------- 农业 ---------- */
export const FARM_REGIONS: Record<string, { name: string; at: LonLat; cue: string; answer: string }> = {
  dongbei: { name: "东北平原", at: [125.5, 45], cue: "中温带，夏季温暖、冬季寒冷，黑土肥沃，一年一熟", answer: "春小麦、玉米、大豆" },
  huabei: { name: "华北平原", at: [116, 36], cue: "暖温带，半湿润，地势平坦，两年三熟", answer: "冬小麦、棉花" },
  changjiang: { name: "长江中下游平原", at: [116, 30.5], cue: "亚热带，湿润，河湖众多，水热充足", answer: "水稻、油菜" },
  nanfang: { name: "南方低山丘陵", at: [117, 26.5], cue: "亚热带，湿润，丘陵广布，土壤偏酸", answer: "茶叶、柑橘、林业" },
  neimenggu: { name: "内蒙古草原", at: [112, 43], cue: "温带，半干旱，草原广阔", answer: "畜牧业（牛羊）" },
  qingzang: { name: "青藏高原", at: [90, 32], cue: "海拔高、气温低，高寒草甸", answer: "高寒牧业（牦牛、藏绵羊）" },
};
export const FARM_CHOICES = ["春小麦、玉米、大豆", "冬小麦、棉花", "水稻、油菜", "茶叶、柑橘、林业", "畜牧业（牛羊）", "高寒牧业（牦牛、藏绵羊）"];
export const QINLING_HUAIHE: LonLat[] = [[104.5, 34.2], [108, 34], [111.5, 33.8], [113.5, 33.2], [116, 32.6], [118.5, 33.5], [120.5, 33.8]];

/* ---------- 自然灾害 ---------- */
export const DISASTERS: Record<string, { name: string; at: LonLat; answer: string }> = {
  typhoon: { name: "台风", at: [121, 26], answer: "东南沿海" },
  cold: { name: "寒潮", at: [115, 43], answer: "北方地区" },
  quake: { name: "地震", at: [102, 30], answer: "西南地区" },
  flood: { name: "洪涝", at: [115, 30], answer: "长江中下游" },
  drought: { name: "干旱", at: [111, 37], answer: "华北、西北" },
};
export const DISASTER_REGIONS = ["东南沿海", "北方地区", "西南地区", "长江中下游", "华北、西北"];
/** 台风路径（示意）：从西北太平洋向西北移动登陆东南沿海 */
export const TYPHOON_TRACK: LonLat[] = [[134, 16], [130.5, 19], [127, 22.5], [124, 25.5], [121.6, 28], [119.5, 30.2], [118, 32.5]];
export const QUAKE_ACTIONS: Record<string, [string, boolean]> = {
  table: ["就近躲到坚固的桌子下，护住头颈", true], corner: ["躲到承重墙墙角或小开间", true], elevator: ["乘电梯赶快下楼", false],
  jump: ["从楼上窗户跳下", false], open: ["震后迅速撤到空旷地带", true], wire: ["躲在高压线和广告牌下", false],
};

/** 八上其余知识点的教学数据。坐标为 [经度, 纬度]，只用于在天地图标准底图上叠加标注，不绘制界线。数值为公开资料的概括值。 */
import type { LonLat } from "./china";
type Pinned = { name: string; at: LonLat; answer: string };

/* ---------- 1.1 疆域 ---------- */
export const EXTREMES: Record<string, { name: string; at: LonLat }> = {
  north: { name: "最北端（漠河以北的黑龙江主航道中心线）", at: [123.3, 53.5] },
  east: { name: "最东端（黑龙江与乌苏里江主航道中心线相汇处）", at: [134.8, 48.4] },
  south: { name: "最南端（南沙群岛的曾母暗沙）", at: [112.3, 3.9] },
  west: { name: "最西端（帕米尔高原）", at: [73.6, 39.4] },
};
export const PROVINCES: [string, string, string][] = [
  ["北京市", "京", "北京"], ["天津市", "津", "天津"], ["河北省", "冀", "石家庄"], ["山西省", "晋", "太原"], ["内蒙古自治区", "内蒙古", "呼和浩特"], ["辽宁省", "辽", "沈阳"], ["吉林省", "吉", "长春"], ["黑龙江省", "黑", "哈尔滨"],
  ["上海市", "沪", "上海"], ["江苏省", "苏", "南京"], ["浙江省", "浙", "杭州"], ["安徽省", "皖", "合肥"], ["福建省", "闽", "福州"], ["江西省", "赣", "南昌"], ["山东省", "鲁", "济南"], ["河南省", "豫", "郑州"],
  ["湖北省", "鄂", "武汉"], ["湖南省", "湘", "长沙"], ["广东省", "粤", "广州"], ["广西壮族自治区", "桂", "南宁"], ["海南省", "琼", "海口"], ["重庆市", "渝", "重庆"], ["四川省", "川（蜀）", "成都"], ["贵州省", "贵（黔）", "贵阳"],
  ["云南省", "云（滇）", "昆明"], ["西藏自治区", "藏", "拉萨"], ["陕西省", "陕（秦）", "西安"], ["甘肃省", "甘（陇）", "兰州"], ["青海省", "青", "西宁"], ["宁夏回族自治区", "宁", "银川"], ["新疆维吾尔自治区", "新", "乌鲁木齐"],
  ["香港特别行政区", "港", "香港"], ["澳门特别行政区", "澳", "澳门"], ["台湾省", "台", "台北"],
];

/* ---------- 1.2 人口 ---------- */
/** 历次全国人口普查（亿人，不含港澳台） */
export const CENSUS: [number, number][] = [[1953, 5.8], [1964, 6.9], [1982, 10.1], [1990, 11.3], [2000, 12.7], [2010, 13.4], [2020, 14.1]];
export const HU_LINE: LonLat[] = [[127.5, 50.2], [98.5, 25.0]];
/** 人口金字塔（各年龄组占总人口 %，男女合计的一半；示意） */
export const PYRAMIDS = {
  y1982: [11.5, 13.0, 12.0, 9.5, 7.5, 6.5, 5.0, 4.0, 3.0, 2.2, 1.4, 0.7],
  y2020: [5.6, 6.2, 6.0, 7.2, 8.4, 8.0, 8.5, 9.2, 7.3, 6.0, 4.5, 3.6],
};
export const PYRAMID_AGES = ["0-4", "5-14", "15-19", "20-24", "25-29", "30-34", "35-44", "45-54", "55-59", "60-64", "65-74", "75+"];

/* ---------- 1.3 民族 ---------- */
export const ETHNIC: Record<string, Pinned> = {
  xizang: { name: "西藏", at: [91.1, 29.7], answer: "藏族" }, xinjiang: { name: "新疆", at: [87.6, 43.8], answer: "维吾尔族" }, neimenggu: { name: "内蒙古", at: [111.7, 40.8], answer: "蒙古族" },
  guangxi: { name: "广西", at: [108.3, 22.8], answer: "壮族" }, yanbian: { name: "吉林延边", at: [129.5, 42.9], answer: "朝鲜族" }, xishuangbanna: { name: "云南西双版纳", at: [100.8, 22.0], answer: "傣族" },
};
export const FESTIVALS: Record<string, string> = { naadam: "蒙古族", water: "傣族", sanyuesan: "壮族", shoton: "藏族" };
export const FESTIVAL_NAMES: Record<string, string> = { naadam: "那达慕大会（赛马、摔跤、射箭）", water: "泼水节", sanyuesan: "“三月三”歌圩", shoton: "雪顿节（晒佛、藏戏）" };

/* ---------- 3.1 土地资源 ---------- */
/** 第三次全国国土调查（2021 年公布）各类土地约占国土面积的比重（%） */
export const LAND_SHARE: [string, number][] = [["林地", 29.6], ["草地", 27.5], ["耕地", 13.3], ["建设用地", 4.3], ["湿地", 2.4], ["园地", 2.1], ["其他（沙漠、戈壁、裸岩等）", 20.8]];
export const LAND_REGIONS: Record<string, Pinned> = {
  dongbei: { name: "东北平原", at: [125.5, 45], answer: "耕地" }, huabei: { name: "华北平原", at: [116, 36], answer: "耕地" },
  xinganling: { name: "大、小兴安岭", at: [124, 50.5], answer: "林地" }, hengduan: { name: "横断山区", at: [99.5, 28], answer: "林地" },
  neimenggu: { name: "内蒙古高原", at: [112, 43], answer: "草地" }, qingzang: { name: "青藏高原", at: [90, 33], answer: "草地" },
};

/* ---------- 3.2 水资源 ---------- */
export const WATER_SPLIT = { south: { water: 81, farmland: 38 }, north: { water: 19, farmland: 62 } };
export const TRANSFER_ROUTES: Record<string, { name: string; line: LonLat[] }> = {
  east: { name: "东线工程", line: [[119.4, 32.4], [118.3, 34.3], [116.9, 36.3], [116.5, 38.0], [117.2, 39.1]] },
  middle: { name: "中线工程", line: [[111.5, 32.6], [113.6, 34.7], [114.5, 38.0], [116.4, 39.9]] },
  west: { name: "西线工程（规划）", line: [[97.2, 33.6], [99.0, 34.0], [100.5, 34.6]] },
};
export const SAVE_WATER: Record<string, [string, boolean]> = {
  drip: ["农田推广喷灌、滴灌", true], recycle: ["工厂循环使用工业用水", true], tap: ["刷牙时一直开着水龙头", false],
  fix: ["及时修好漏水的水龙头", true], lawn: ["用自来水大水漫灌草坪", false], reuse: ["用洗菜水浇花、冲厕所", true],
};

/* ---------- 3.3 矿产资源 ---------- */
export const MINES: Record<string, Pinned> = {
  daqing: { name: "大庆", at: [125.0, 46.6], answer: "石油" }, shengli: { name: "胜利", at: [118.5, 37.4], answer: "石油" },
  shanxi: { name: "山西", at: [112.5, 37.8], answer: "煤炭" }, anshan: { name: "鞍山", at: [123.0, 41.1], answer: "铁矿" },
  panzhihua: { name: "攀枝花", at: [101.7, 26.6], answer: "铁矿" }, baiyun: { name: "白云鄂博", at: [110.0, 41.8], answer: "稀土" },
};
export const GAS_PIPE: LonLat[] = [[84.5, 41.7], [93.5, 42.8], [103.8, 36.1], [108.9, 34.3], [113.6, 34.7], [117.3, 31.9], [121.4, 31.2]];

/* ---------- 3.4 海洋资源 ---------- */
export const SEAS: Record<string, { name: string; at: LonLat }> = {
  bohai: { name: "渤海", at: [120.2, 38.8] }, huanghai: { name: "黄海", at: [123.2, 35.5] }, donghai: { name: "东海", at: [125.0, 29.0] }, nanhai: { name: "南海", at: [114.0, 14.5] },
};
export const SEA_RESOURCES: Record<string, Pinned> = {
  zhoushan: { name: "舟山渔场", at: [122.6, 30.0], answer: "海洋渔业" }, bohaioil: { name: "渤海油田", at: [119.6, 38.6], answer: "海底油气" },
  changlu: { name: "长芦盐场", at: [117.7, 39.0], answer: "海盐" }, sanya: { name: "三亚", at: [109.5, 18.25], answer: "海滨旅游" },
};

/* ---------- 4.2 工业 ---------- */
export const INDUSTRY_BASES: Record<string, { name: string; at: LonLat }> = {
  liaozhongnan: { name: "辽中南工业基地", at: [123.0, 41.3] }, jingjintang: { name: "京津唐工业基地", at: [117.3, 39.6] },
  hunihang: { name: "沪宁杭工业基地", at: [120.3, 31.2] }, zhusanjiao: { name: "珠江三角洲工业基地", at: [113.3, 22.8] },
};
export const INDUSTRY_SITES: Record<string, [string, string]> = {
  steel: ["钢铁厂", "靠近煤炭、铁矿产地"], chip: ["芯片设计与制造", "靠近高校、科研机构和便利交通"], sugar: ["甘蔗制糖厂", "靠近原料产地"], beer: ["啤酒厂", "靠近消费市场"],
};

/* ---------- 4.3 交通运输 ---------- */
export const CARGO: Record<string, [string, string]> = {
  flower: ["昆明的鲜花一天内运到北京", "航空运输"], coal: ["山西的大量煤炭运往上海", "铁路运输"], veg: ["城郊的蔬菜每天运到市区菜场", "公路运输"],
  ore: ["澳大利亚的大批铁矿石运到宁波", "水路运输"], gas: ["新疆的天然气源源不断送往东部", "管道运输"],
};
export const RAIL_LINES: Record<string, { name: string; line: LonLat[] }> = {
  jingguang: { name: "京广线", line: [[116.4, 39.9], [114.5, 38.0], [113.6, 34.7], [114.3, 30.6], [113.0, 28.2], [113.3, 23.1]] },
  jinghu: { name: "京沪线", line: [[116.4, 39.9], [117.2, 39.1], [117.0, 36.7], [117.2, 34.3], [118.8, 32.1], [121.4, 31.2]] },
  longhai: { name: "陇海线", line: [[119.2, 34.6], [117.2, 34.3], [113.6, 34.7], [108.9, 34.3], [103.8, 36.1]] },
  lanxin: { name: "兰新线", line: [[103.8, 36.1], [98.5, 39.7], [93.5, 42.8], [87.6, 43.8]] },
};
export const HUB_OPTIONS: Record<string, LonLat> = { "郑州": [113.6, 34.7], "武汉": [114.3, 30.6], "西安": [108.9, 34.3], "兰州": [103.8, 36.1] };

/* ---------- 5.2 环境保护与发展 ---------- */
export const ENV_MEASURES: Record<string, [string, string]> = {
  haze: ["城市雾霾", "发展清洁能源，减少燃煤"], water: ["河流污染", "建设污水处理厂"], desert: ["土地荒漠化", "植树种草，建设防护林"], erosion: ["水土流失", "修梯田、打淤地坝、退耕还林"],
};
export const LOW_CARBON: Record<string, [string, boolean]> = {
  bus: ["上学乘公交、骑自行车", true], light: ["随手关灯", true], plastic: ["多用一次性塑料袋", false], ac: ["夏天空调设定在 26 ℃ 以上", true], idle: ["电器长期待机不拔插头", false],
};

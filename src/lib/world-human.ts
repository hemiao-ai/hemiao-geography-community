import type { LonLat } from "./china";

export const POP_YEARS = [1804, 1927, 1960, 1974, 1987, 1999, 2011, 2022];
export const POP_TREND = "间隔先大幅缩短，近几十年稳定在 12 年左右";
export const SPARSE: Record<string, { name: string; at: LonLat; reason: string }> = {
  sahara: { name: "撒哈拉沙漠", at: [10, 23], reason: "dry" },
  amazon: { name: "亚马孙平原", at: [-62, -4], reason: "humid" },
  siberia: { name: "西伯利亚北部", at: [100, 68], reason: "cold" },
  tibet: { name: "青藏高原", at: [88, 33], reason: "high" },
};
export const SPARSE_CATS = { dry: "极端干旱", humid: "过于湿热", cold: "终年严寒", high: "地势高峻、空气稀薄" };
export const UN_LANGUAGES = ["汉语", "英语", "法语", "俄语", "西班牙语", "阿拉伯语"];
export const LANGUAGE_OPTIONS = [...UN_LANGUAGES, "德语", "日语", "葡萄牙语"];
export const RELIGIONS = { christianity: ["基督教", "westAsia"], islam: ["伊斯兰教", "arabia"], buddhism: ["佛教", "southAsia"] } as const;
export const RELIGION_ORIGINS = { westAsia: "亚洲西部", arabia: "阿拉伯半岛", southAsia: "亚洲南部", westEurope: "欧洲西部" };
export const CUSTOMS = {
  fur: ["皮毛衣物，配长靴和帽子", "cold"], linen: ["棉麻或丝织衣物，薄而宽松", "hot"], boat: ["用船在河道上交易，形成水上市场", "water"],
  camel: ["骆驼商队在古老商道上行走", "desert"], robe: ["长袍和头巾，遮挡烈日和风沙", "desert"], sled: ["驯鹿拉雪橇", "cold"],
} as const;
export const FOODS = { europe: ["欧洲（以小麦为主）", "wheat"], eastAsia: ["亚洲东部和东南部（以水稻为主）", "rice"], latin: ["拉丁美洲（以玉米为主）", "corn"] } as const;
export const HOUSES = { stilt: "斜屋顶、底层架空的竹木楼，墙体较薄、通风", adobe: "平屋顶、墙体厚、窗户小的土房" };
export const HOUSE_ANSWER = { stilt: "yangon", adobe: "cairo" };
export const MATERIALS = { stilt: "当地竹木丰富", adobe: "当地林木稀少，多用泥土石块" };
export const DEVELOPED = ["德国", "法国", "意大利", "英国", "美国", "加拿大", "日本", "韩国", "澳大利亚", "新西兰"];
export const DEVELOPING = ["中国", "印度", "巴西", "埃及", "尼日利亚", "墨西哥", "印度尼西亚"];
export const RAIL_CITIES: { name: string; at: LonLat }[] = [
  { name: "重庆", at: [106.55, 29.56] }, { name: "阿拉山口", at: [82.57, 45.17] }, { name: "阿斯塔纳", at: [71.45, 51.17] },
  { name: "莫斯科", at: [37.62, 55.75] }, { name: "明斯克", at: [27.56, 53.9] }, { name: "华沙", at: [21.01, 52.23] }, { name: "杜伊斯堡", at: [6.76, 51.43] },
];
export const ROUTE_COUNTRIES = ["中国", "哈萨克斯坦", "俄罗斯", "白俄罗斯", "波兰", "德国"];
export const SPAN_COUNTRIES = ["俄罗斯", "哈萨克斯坦"];
export const CARGO7 = { laptop: ["急需送达的笔记本电脑零件", "rail"], ore: ["数十万吨铁矿石，不急用", "sea"], oil: ["大批原油", "sea"], fruit: ["要尽快送到的高档鲜果", "rail"], grain: ["大量粮食，运到远方港口", "sea"] } as const;
export const COOP = { ozone: ["臭氧层破坏", "montreal"], warming: ["全球变暖", "paris"], south: ["发展中国家之间互助合作", "southSouth"], connect: ["加强互联互通和经济合作", "belt"] } as const;
export const COOP_OPTIONS = { montreal: "《蒙特利尔议定书》", paris: "《巴黎协定》", southSouth: "南南合作", belt: "“一带一路”倡议" };
export const QUESTIONS = { day: ["为什么夏天白天比冬天长", "nature"], desert: ["为什么沙漠地区降水少", "nature"], peak: ["为什么山顶比山脚冷", "nature"], river: ["为什么许多城市建在河流沿岸", "human"], food: ["为什么各地人们的饮食习惯不同", "human"], bridge: ["为什么要修建跨海大桥", "human"] } as const;
export const ADAPT = { terrace: ["山区修筑梯田", "slope"], boat: ["水乡以船代步", "waterway"], yurt: ["草原上住可移动的毡房", "herd"], stilt: ["湿热地区房屋底层架空", "wet"] } as const;
export const ADAPT_OPTIONS = { slope: "山高坡陡，平地少", waterway: "河网密布", herd: "逐水草而居的畜牧业", wet: "湿热多雨" };
export const GEO_TOOLS = { locate: ["查找一个城市的位置", "地图"], daynight: ["观察全球昼夜交替", "地球仪"], rain: ["分析一个地方各月降水的变化", "统计图表"], forest: ["查看一片森林最近的变化", "遥感影像"] } as const;
export const TOOL_OPTIONS = ["地图", "地球仪", "统计图表", "遥感影像"];

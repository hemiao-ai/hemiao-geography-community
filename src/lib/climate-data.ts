/**
 * 世界气候教学测站：1991–2020 年 WMO 气候标准平均值（Climatological Standard Normals）。
 * 来源：NOAA NCEI 存档的 WMO 1991–2020 Normals 汇总文件（accession 0253808，v6.6）
 * wmo_normals_9120_TAVG.csv（月平均气温 ℃）与 wmo_normals_9120_PRCP.csv（月降水量 mm），由脚本原样提取，不做修改。
 * at 为 [经度, 纬度]，alt 为测站海拔（m）。type 是按七上教材的气候类型划分，只为逐站核对过的测站填写。
 */
export type ClimateType = "rainforest" | "savanna" | "tropicalMonsoon" | "desert" | "subtropicalMonsoon" | "mediterranean" | "temperateMonsoon" | "oceanic" | "continental" | "polar" | "highland";
export const CLIMATE_TYPES: Record<ClimateType, string> = {
  rainforest: "热带雨林气候", savanna: "热带草原气候", tropicalMonsoon: "热带季风气候", desert: "热带沙漠气候",
  subtropicalMonsoon: "亚热带季风气候", mediterranean: "地中海气候", temperateMonsoon: "温带季风气候", oceanic: "温带海洋性气候",
  continental: "温带大陆性气候", polar: "寒带气候", highland: "高原山地气候",
};
export interface Station { name: string; wmo: string; station: string; at: [number, number]; alt: number; type?: ClimateType; t: number[]; p: number[] }
export const STATIONS = {
  singapore: { name: "新加坡", wmo: "48698", station: "ChangiAirport", at: [103.982, 1.368], alt: 14, type: "rainforest", t: [26.8, 27.3, 27.8, 28.2, 28.6, 28.5, 28.2, 28.1, 28, 27.9, 27.2, 26.8], p: [221.6, 105, 151.1, 163.8, 163.8, 137.1, 144.8, 148.9, 124.6, 166.4, 254.1, 332.1] },
  bamako: { name: "巴马科（马里）", wmo: "61291", station: "BamakoSenou", at: [-7.95, 12.5], alt: 380, type: "savanna", t: [24.9, 27.9, 30.6, 32.3, 31.6, 29.1, 26.8, 26.1, 26.7, 27.8, 26.7, 25.1], p: [2.1, 0.8, 3.7, 17.7, 70.9, 129.9, 227.4, 263.8, 175.7, 52.6, 2.2, 0] },
  yangon: { name: "仰光（缅甸）", wmo: "48097", station: "Kabaaye", at: [96.183, 16.867], alt: 20, type: "tropicalMonsoon", t: [24.9, 26.6, 28.9, 30.6, 29.2, 27.3, 26.7, 26.6, 27, 27.7, 27.4, 25.4], p: [4.5, 3, 15.1, 37.9, 333.8, 554, 624.5, 562.2, 426.8, 217.4, 52.6, 9.2] },
  cairo: { name: "开罗（埃及）", wmo: "62366", station: "CairoAP", at: [31.4, 30.133], alt: 64.1, type: "desert", t: [14.4, 15.6, 18.3, 21.8, 25.6, 28.2, 29.1, 29.2, 27.6, 24.6, 20, 15.9], p: [4.8, 3.8, 6.3, 1.3, 0.2, 0, 0, 0, 0, 0.7, 4.3, 3.4] },
  shanghai: { name: "上海", wmo: "58362", station: "SHANGHAI__BAOSHAN", at: [121.45, 31.42], alt: 9, type: "subtropicalMonsoon", t: [4.9, 6.5, 10.3, 15.7, 20.9, 24.4, 28.8, 28.5, 24.7, 19.7, 13.9, 7.5], p: [69.8, 64, 86.5, 77.1, 90.2, 196.7, 146.9, 210.1, 116.5, 71.4, 57.5, 49.3] },
  algiers: { name: "阿尔及尔（阿尔及利亚）", wmo: "60390", station: "AlgerDarElBeida", at: [3.217, 36.69], alt: 25, type: "mediterranean", t: [11.3, 11.5, 13.6, 15.6, 18.8, 22.6, 25.7, 26.6, 23.9, 20.4, 15.7, 12.6], p: [84.2, 72.1, 58.9, 58, 39, 8.6, 1.5, 10.6, 27.5, 51.5, 102.7, 86.4] },
  beijing: { name: "北京", wmo: "54511", station: "BEIJING", at: [116.28, 39.93], alt: 32.5, type: "temperateMonsoon", t: [-2.7, 0.6, 7.5, 15.1, 21.3, 25.3, 27.2, 26.1, 21.2, 13.8, 5.2, -1], p: [2.2, 5.8, 8.6, 21.7, 36.1, 72.4, 169.7, 113.4, 53.7, 28.7, 13.5, 2.2] },
  london: { name: "伦敦（英国）", wmo: "03772", station: "Heathrow", at: [-0.451, 51.479], alt: 25, type: "oceanic", t: [5.6, 5.8, 7.9, 10.5, 13.7, 16.8, 19, 18.7, 15.9, 12.3, 8.4, 5.9], p: [58.8, 45, 38.8, 42.3, 45.9, 47.2, 45.8, 52.8, 49.6, 65.1, 66.6, 57] },
  urumqi: { name: "乌鲁木齐", wmo: "51463", station: "WU_LU_MU_QI", at: [87.65, 43.78], alt: 936, type: "continental", t: [-12.2, -8.9, 0.4, 11.5, 17.3, 22.4, 24.2, 22.9, 17.2, 8.8, -0.9, -9.2], p: [11, 13.6, 18.8, 38.3, 41.3, 28.8, 35.4, 30.4, 19.8, 23.8, 23.7, 20.3] },
  barrow: { name: "乌特恰维克（美国阿拉斯加）", wmo: "70026", station: "BARROW_POST_ROGERS_AP", at: [-156.781, 71.283], alt: 9, type: "polar", t: [-24.2, -24.4, -23.6, -15.5, -5.2, 2.2, 5.4, 4.3, 0.9, -6, -14.6, -21.3], p: [3.7, 5.4, 4.5, 4.5, 7.2, 10.9, 24.8, 27.6, 19.7, 13.8, 9.3, 5.7] },
  lhasa: { name: "拉萨", wmo: "55591", station: "LHASA", at: [91.13, 29.67], alt: 3650, type: "highland", t: [-0.3, 2.7, 6.1, 9.2, 13.2, 16.7, 16.5, 15.8, 14.2, 9.8, 4.1, 0.3], p: [0.9, 1.9, 3.5, 8.3, 31.1, 84, 140.5, 129.8, 64.8, 6.5, 0.9, 0.7] },
  harbin: { name: "哈尔滨", wmo: "50953", station: "HARBIN", at: [126.57, 45.93], alt: 117.7, t: [-17.3, -11.9, -2.4, 8, 15.7, 21.3, 23.7, 21.9, 15.7, 6.8, -4.6, -14.6], p: [3.8, 4.5, 11.5, 19.3, 51.4, 100.4, 137, 112.7, 52.3, 24.5, 14.4, 7.6] },
  moscow: { name: "莫斯科（俄罗斯）", wmo: "27612", station: "Moskva", at: [37.617, 55.833], alt: 147, t: [-6.2, -5.9, -0.7, 6.9, 13.6, 17.3, 19.7, 17.6, 11.9, 5.8, -0.5, -4.4], p: [53, 43.9, 38.9, 36.6, 61.2, 77.1, 83.8, 78.2, 66.1, 70, 52, 50.9] },
} satisfies Record<string, Station>;
export type StationKey = keyof typeof STATIONS;

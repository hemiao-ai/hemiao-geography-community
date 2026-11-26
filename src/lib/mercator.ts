/** Web 墨卡托投影（天地图 _w 瓦片，EPSG:3857）。纯函数。 */
export const TILE = 256;
export function toWorld(lon: number, lat: number, z: number): [number, number] {
  const s = TILE * 2 ** z, r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return [((lon + 180) / 360) * s, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s];
}
export interface Frame { z: number; x0: number; y0: number; w: number; h: number }
/** 覆盖经纬度范围 [西, 南, 东, 北] 的画幅 */
export function frameOf([w, s, e, n]: [number, number, number, number], z: number): Frame {
  const [x0, y0] = toWorld(w, n, z), [x1, y1] = toWorld(e, s, z);
  return { z, x0, y0, w: x1 - x0, h: y1 - y0 };
}
export const proj = (f: Frame, lon: number, lat: number): [number, number] => { const [x, y] = toWorld(lon, lat, f.z); return [x - f.x0, y - f.y0]; };
export function tiles(f: Frame) {
  const out: { x: number; y: number; px: number; py: number }[] = [];
  for (let x = Math.floor(f.x0 / TILE); x <= Math.floor((f.x0 + f.w) / TILE); x++)
    for (let y = Math.floor(f.y0 / TILE); y <= Math.floor((f.y0 + f.h) / TILE); y++) out.push({ x, y, px: x * TILE - f.x0, py: y * TILE - f.y0 });
  return out;
}
/** 两个经纬度点之间的近似距离（度），用于点击判定 */
export const degDist = (a: [number, number], b: [number, number]) => Math.hypot((a[0] - b[0]) * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180), a[1] - b[1]);

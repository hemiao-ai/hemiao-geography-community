"use client";
import type { LessonType } from "@/lib/lessons";
import { LessonShell, type LessonConfig } from "./LessonShell";
import { earth } from "./EarthLesson";
import { contour } from "./ContourLesson";
import { disaster, farm, monsoon, river, terrain3 } from "./ChinaLessons";
import { environment, ethnic, industry, land, mineral, ocean, population, territory, transport, water } from "./ChinaLessons2";
import { cosmos, globe, landform, settlement } from "./G7aLessons";
import { climate, precipitation, temperature, weather } from "./G7aClimateLessons";
import { continents, mapchoose, mapread, plates } from "./G7aMapLessons";
import { culture, develop, intro, population7 } from "./G7aHumanLessons";

const CONFIGS: Record<LessonType, (seed: number) => LessonConfig> = { earth, contour, terrain3, monsoon, river, farm, disaster, territory, population, ethnic, land, water, mineral, ocean, industry, transport, environment, cosmos, globe, landform, settlement, weather, temperature, precipitation, climate, mapread, mapchoose, continents, plates, population7, culture, develop, intro };
export function LessonView({ type, seed, onFinish }: { type: LessonType; seed: number; onFinish: (e: unknown) => void }) {
  return <LessonShell type={type} config={CONFIGS[type](seed)} onFinish={onFinish} />;
}

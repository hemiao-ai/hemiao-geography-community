import type { LessonType } from "./lessons";
import { hasTianditu } from "./site";

const MAP_LESSONS = new Set<LessonType>([
  "continents", "plates", "landform", "population7", "develop",
  "territory", "population", "ethnic", "terrain3", "monsoon", "river", "land", "water", "mineral",
  "ocean", "farm", "industry", "transport", "disaster",
]);

export function canStartLesson(type: LessonType) {
  return hasTianditu || !MAP_LESSONS.has(type);
}

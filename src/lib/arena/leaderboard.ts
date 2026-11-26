import { ROUND, type LatlonInput } from "./latlon";
import { replay, type Submission } from "./play";

export const ARENA_RUN_LIMIT_MS = 2 * 60 * 60 * 1000;
export const ARENA_LEADERBOARD_CHANGED = "geography:arena-leaderboard";
export type LeaderboardEntry = { rank: number; name: string; score: number; elapsedMs: number; mine: boolean };
export type RoomLeaderboard = { leaders: LeaderboardEntry[]; mine: LeaderboardEntry | null; viewerId: string };

function validInput(input: unknown): input is LatlonInput {
  return (typeof input === "string" && input.length <= 120) ||
    (Array.isArray(input) && input.length === 2 && input.every(value => typeof value === "number" && Number.isFinite(value)) &&
      Math.abs(input[0]) <= 540 && Math.abs(input[1]) <= 90);
}

export function verifyArenaRun(seed: number, evidence: unknown, wallMs: number) {
  if (!Array.isArray(evidence) || evidence.length < ROUND || evidence.length > ROUND * 2) return null;
  const submissions: Submission[] = [];
  for (const item of evidence) {
    if (!item || typeof item !== "object" || !validInput(item.input) || !Number.isSafeInteger(item.at) ||
      item.at <= 0 || item.at > Math.min(wallMs, ARENA_RUN_LIMIT_MS) || item.at <= (submissions.at(-1)?.at ?? 0)) return null;
    submissions.push({ input: item.input, at: item.at });
  }
  return replay(seed, submissions);
}

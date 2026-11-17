import test from "node:test";
import assert from "node:assert/strict";
import {
  levelFromXp,
  calculateAccuracy,
  calculateMasteryScore,
  touchActivityHelper,
  determineStatusBadge,
  XP_PER_LEVEL,
} from "./store-helpers";

test("levelFromXp correctly converts XP to levels", () => {
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(499), 1);
  assert.equal(levelFromXp(500), 2);
  assert.equal(levelFromXp(1200), 3);
  assert.equal(levelFromXp(-10), 1);
});

test("calculateAccuracy computes clamped percentages", () => {
  assert.equal(calculateAccuracy(0, 0), 0);
  assert.equal(calculateAccuracy(4, 5), 80);
  assert.equal(calculateAccuracy(10, 10), 100);
  assert.equal(calculateAccuracy(1, 3), 33);
});

test("calculateMasteryScore computes score from correct and wrong answers", () => {
  assert.equal(calculateMasteryScore(0, 0), 0);
  assert.equal(calculateMasteryScore(5, 5), 50);
  assert.equal(calculateMasteryScore(8, 2), 80);
});

test("touchActivityHelper handles streaks across days", () => {
  const base = new Date("2026-10-28T10:00:00Z");

  // First time activity
  assert.equal(touchActivityHelper(0, null, base), 1);

  // Same day activity maintains streak
  const sameDay = new Date("2026-10-28T14:30:00Z");
  assert.equal(touchActivityHelper(5, base.toISOString(), sameDay), 5);

  // Next day consecutive activity increments streak
  const nextDay = new Date("2026-10-29T09:00:00Z");
  assert.equal(touchActivityHelper(5, base.toISOString(), nextDay), 6);

  // Missed day resets streak to 1
  const afterTwoDays = new Date("2026-10-31T09:00:00Z");
  assert.equal(touchActivityHelper(5, base.toISOString(), afterTwoDays), 1);
});

test("determineStatusBadge produces appropriate tags", () => {
  assert.equal(determineStatusBadge("READY").label, "Siap");
  assert.equal(determineStatusBadge("FAILED").label, "Gagal");
  assert.equal(determineStatusBadge("ANALYZING").label, "Diproses");
});

import fs from "fs";
import path from "path";
import { levelFromXp, touchActivityHelper } from "./store-helpers";

export interface User {
  id: string;
  email: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface Concept {
  id: string;
  topicId: string;
  name: string;
  definition?: string;
  formulas?: string;
  examples?: string;
  keyTerms?: string;
  order: number;
}

export interface Topic {
  id: string;
  materialId: string;
  title: string;
  description?: string;
  order: number;
  concepts: Concept[];
}

export interface ConceptMastery {
  id: string;
  userId: string;
  conceptId: string;
  correct: number;
  wrong: number;
  score: number;
  updatedAt: string;
}

export interface Summary {
  id: string;
  materialId: string;
  content: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  materialId: string;
  conceptId?: string | null;
  front: string;
  back: string;
  mastered: boolean;
  order: number;
}

export interface Question {
  id: string;
  materialId: string;
  conceptId?: string | null;
  difficulty: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  order: number;
}

export interface Answer {
  id: string;
  userId: string;
  materialId: string;
  questionId: string;
  selected: number;
  correct: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  materialId: string;
  role: "user" | "assistant";
  content: string;
  level?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  userId: string;
  title: string;
  sourceType: string;
  sourceName?: string | null;
  rawText: string;
  status: "EXTRACTING" | "ANALYZING" | "GENERATING" | "READY" | "FAILED";
  step?: string | null;
  error?: string | null;
  subject?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  materials: Material[];
  topics: Topic[];
  summaries: Summary[];
  flashcards: Flashcard[];
  questions: Question[];
  masteries: ConceptMastery[];
  answers: Answer[];
  chats: ChatMessage[];
}

const DB_FILE =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? "/tmp/academic-db.json"
    : path.resolve(process.cwd(), "academic-db.json");

function getInitialDb(): DatabaseSchema {
  return {
    users: [],
    materials: [],
    topics: [],
    summaries: [],
    flashcards: [],
    questions: [],
    masteries: [],
    answers: [],
    chats: [],
  };
}

let dbCache: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbCache) return dbCache;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      dbCache = JSON.parse(raw);
      return dbCache!;
    }
  } catch (err) {
    console.warn("Failed to load existing db, initializing fresh:", err);
  }
  dbCache = getInitialDb();
  saveDb();
  return dbCache;
}

export function saveDb(): void {
  if (!dbCache) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
  } catch (err) {
    // Ignore read-only disk errors in ephemeral serverless containers
    console.warn("Local file db write skipped:", (err as Error)?.message || err);
  }
}

export function getCurrentUser(userId = "usr-guest"): User {
  const db = getDb();
  let user = db.users.find((u) => u.id === userId);
  if (!user) {
    user = {
      id: userId,
      email: `${userId}@student.cames.my.id`,
      name: "Pelajar Baru",
      xp: 0,
      level: 1,
      streak: 1,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb();
  }
  return user;
}

export function awardUserXp(userId: string, amount: number) {
  const user = getCurrentUser(userId);
  user.xp += amount;
  user.level = levelFromXp(user.xp);
  touchActivity(userId);
  saveDb();
  return { xp: user.xp, level: user.level };
}

export function touchActivity(userId: string) {
  const user = getCurrentUser(userId);
  const now = new Date();
  user.streak = touchActivityHelper(user.streak, user.lastActiveAt, now);
  user.lastActiveAt = now.toISOString();
  saveDb();
}

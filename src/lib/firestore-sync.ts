import fs from "fs";
import path from "path";
import {
  getDb,
  saveDb,
  Material,
  Topic,
  Summary,
  Flashcard,
  Question,
  ConceptMastery,
  Answer,
  ChatMessage,
  User,
} from "./store";

function loadFirebaseIds(): { projectId: string; firestoreDatabaseId: string } {
  const candidates = [
    path.resolve(process.cwd(), "firebase-applet-config.json"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../firebase-applet-config.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const parsed = JSON.parse(fs.readFileSync(p, "utf-8"));
        if (parsed?.projectId) {
          return {
            projectId: parsed.projectId,
            firestoreDatabaseId: parsed.firestoreDatabaseId || "(default)",
          };
        }
      }
    } catch {
      // Fallback below
    }
  }
  return {
    projectId: "camesawesome",
    firestoreDatabaseId: "ai-studio-camesacademic-a9ffb683-705a-4d5b-8222-164d43bf634d",
  };
}

const { projectId: PROJECT_ID, firestoreDatabaseId: DATABASE_ID } = loadFirebaseIds();
const DOCS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

type FsValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { arrayValue: { values?: FsValue[] } }
  | { mapValue: { fields?: Record<string, FsValue> } };

function toFsValue(val: unknown): FsValue {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFsValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, FsValue> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = toFsValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFsFields(obj: Record<string, unknown>): Record<string, FsValue> {
  const fields: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFsValue(v);
  }
  return fields;
}

function fromFsValue(val: FsValue | undefined): unknown {
  if (!val) return undefined;
  if ("nullValue" in val) return null;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("stringValue" in val) return val.stringValue;
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(fromFsValue);
  if ("mapValue" in val) return fromFsFields(val.mapValue.fields || {});
  return undefined;
}

function fromFsFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromFsValue(v);
  }
  return out;
}

const hydratedAt = new Map<string, number>();
const syncedAnswerIds = new Set<string>();

function mergeById<T extends { id: string }>(target: T[], incoming: T[]) {
  const map = new Map(target.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (item && item.id) map.set(item.id, item);
  }
  target.length = 0;
  target.push(...map.values());
}

async function queryCollectionByUser(
  collectionId: string,
  userId: string,
  idToken: string
): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${DOCS_BASE}:runQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath: "userId" },
            op: "EQUAL",
            value: { stringValue: userId },
          },
        },
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ document?: { fields?: Record<string, FsValue> } }>;
  return rows
    .filter((r) => r.document?.fields)
    .map((r) => fromFsFields(r.document!.fields!));
}

async function getUserDoc(userId: string, idToken: string): Promise<User | null> {
  const res = await fetch(`${DOCS_BASE}/users/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const doc = (await res.json()) as { fields?: Record<string, FsValue> };
  if (!doc.fields) return null;
  return fromFsFields(doc.fields) as unknown as User;
}

export async function ensureUserLoadedFromFirestore(
  userId: string,
  idToken?: string
): Promise<void> {
  if (!idToken || !userId || userId === "usr-guest") return;
  const last = hydratedAt.get(userId) || 0;
  if (Date.now() - last < 15_000) return;

  try {
    const [fsUser, rawMaterials, rawSummaries, rawFlashcards, rawQuestions, rawMasteries, rawAnswers, rawChats] =
      await Promise.all([
        getUserDoc(userId, idToken),
        queryCollectionByUser("materials", userId, idToken),
        queryCollectionByUser("summaries", userId, idToken),
        queryCollectionByUser("flashcards", userId, idToken),
        queryCollectionByUser("questions", userId, idToken),
        queryCollectionByUser("conceptMastery", userId, idToken),
        queryCollectionByUser("answers", userId, idToken),
        queryCollectionByUser("chats", userId, idToken),
      ]);

    const db = getDb();

    if (fsUser) {
      mergeById(db.users, [fsUser]);
    }

    const materials: Material[] = [];
    const topics: Topic[] = [];
    for (const raw of rawMaterials) {
      const { topics: embeddedTopics, ...matFields } = raw as Record<string, unknown>;
      materials.push(matFields as unknown as Material);
      if (Array.isArray(embeddedTopics)) {
        for (const t of embeddedTopics) {
          topics.push(t as Topic);
        }
      }
    }

    if (materials.length > 0) mergeById(db.materials, materials);
    if (topics.length > 0) mergeById(db.topics, topics);
    if (rawSummaries.length > 0) mergeById(db.summaries, rawSummaries as unknown as Summary[]);
    if (rawFlashcards.length > 0) mergeById(db.flashcards, rawFlashcards as unknown as Flashcard[]);
    if (rawQuestions.length > 0) mergeById(db.questions, rawQuestions as unknown as Question[]);
    if (rawMasteries.length > 0) mergeById(db.masteries, rawMasteries as unknown as ConceptMastery[]);
    if (rawAnswers.length > 0) {
      const answers = rawAnswers as unknown as Answer[];
      for (const a of answers) syncedAnswerIds.add(a.id);
      mergeById(db.answers, answers);
    }
    if (rawChats.length > 0) mergeById(db.chats, rawChats as unknown as ChatMessage[]);

    hydratedAt.set(userId, Date.now());
    saveDb();
  } catch (err) {
    console.warn("Firestore hydration warning:", (err as Error)?.message || err);
  }
}

export async function syncUserToFirestore(
  userId: string,
  idToken?: string
): Promise<void> {
  if (!idToken || !userId || userId === "usr-guest") return;

  try {
    const db = getDb();
    const user = db.users.find((u) => u.id === userId);
    const userMaterials = db.materials.filter((m) => m.userId === userId);
    const matIds = new Set(userMaterials.map((m) => m.id));

    const writes: Array<{
      update: { name: string; fields: Record<string, FsValue> };
      currentDocument?: { exists: boolean };
    }> = [];

    const docPath = (collection: string, id: string) =>
      `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collection}/${id}`;

    if (user) {
      writes.push({
        update: {
          name: docPath("users", user.id),
          fields: toFsFields({
            id: user.id,
            email: (user.email || `${user.id}@student.cames.my.id`).slice(0, 160),
            name: (user.name || "Pelajar Baru").slice(0, 120),
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            lastActiveAt: user.lastActiveAt || new Date().toISOString(),
            createdAt: user.createdAt,
          }),
        },
      });
    }

    for (const m of userMaterials) {
      const mTopics = db.topics.filter((t) => t.materialId === m.id);
      writes.push({
        update: {
          name: docPath("materials", m.id),
          fields: toFsFields({
            id: m.id,
            userId: m.userId,
            title: (m.title || "Materi Pembelajaran").slice(0, 180),
            subject: (m.subject || "Pelajaran Umum").slice(0, 100),
            sourceType: (m.sourceType || "text").slice(0, 32),
            sourceName: m.sourceName ? m.sourceName.slice(0, 180) : "",
            rawText: (m.rawText || "").slice(0, 80000),
            status: m.status,
            step: m.step || "",
            error: m.error ? m.error.slice(0, 500) : "",
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            topics: mTopics,
          }),
        },
      });
    }

    for (const s of db.summaries.filter((x) => matIds.has(x.materialId))) {
      writes.push({
        update: {
          name: docPath("summaries", s.id),
          fields: toFsFields({
            id: s.id,
            materialId: s.materialId,
            userId,
            content: (s.content || "").slice(0, 40000),
            updatedAt: s.updatedAt,
          }),
        },
      });
    }

    for (const fc of db.flashcards.filter((x) => matIds.has(x.materialId))) {
      writes.push({
        update: {
          name: docPath("flashcards", fc.id),
          fields: toFsFields({
            id: fc.id,
            materialId: fc.materialId,
            userId,
            conceptId: fc.conceptId || "",
            front: (fc.front || "").slice(0, 500),
            back: (fc.back || "").slice(0, 1000),
            mastered: Boolean(fc.mastered),
            order: fc.order,
          }),
        },
      });
    }

    for (const q of db.questions.filter((x) => matIds.has(x.materialId))) {
      writes.push({
        update: {
          name: docPath("questions", q.id),
          fields: toFsFields({
            id: q.id,
            materialId: q.materialId,
            userId,
            conceptId: q.conceptId || "",
            difficulty: q.difficulty,
            question: (q.question || "").slice(0, 800),
            options: q.options || [],
            answerIndex: q.answerIndex,
            explanation: (q.explanation || "").slice(0, 1200),
            order: q.order,
          }),
        },
      });
    }

    for (const mas of db.masteries.filter((x) => x.userId === userId)) {
      writes.push({
        update: {
          name: docPath("conceptMastery", mas.id),
          fields: toFsFields({
            id: mas.id,
            userId: mas.userId,
            conceptId: mas.conceptId,
            correct: mas.correct,
            wrong: mas.wrong,
            score: mas.score,
            updatedAt: mas.updatedAt,
          }),
        },
      });
    }

    for (const c of db.chats.filter((x) => x.userId === userId)) {
      writes.push({
        update: {
          name: docPath("chats", c.id),
          fields: toFsFields({
            id: c.id,
            userId: c.userId,
            materialId: c.materialId,
            role: c.role,
            content: (c.content || "").slice(0, 4000),
            level: c.level || "normal",
            createdAt: c.createdAt,
          }),
        },
      });
    }

    const pendingAnswers: Answer[] = [];
    for (const a of db.answers.filter((x) => x.userId === userId && !syncedAnswerIds.has(x.id))) {
      pendingAnswers.push(a);
      writes.push({
        update: {
          name: docPath("answers", a.id),
          fields: toFsFields({
            id: a.id,
            userId: a.userId,
            materialId: a.materialId,
            questionId: a.questionId,
            selected: a.selected,
            correct: Boolean(a.correct),
            createdAt: a.createdAt,
          }),
        },
        currentDocument: { exists: false },
      });
    }

    for (let i = 0; i < writes.length; i += 400) {
      const chunk = writes.slice(i, i + 400);
      const res = await fetch(`${DOCS_BASE}:commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ writes: chunk }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn("Firestore sync commit warning:", res.status, text.slice(0, 200));
        return;
      }
    }

    for (const a of pendingAnswers) {
      syncedAnswerIds.add(a.id);
    }
    hydratedAt.set(userId, Date.now());
  } catch (err) {
    console.warn("Firestore sync warning:", (err as Error)?.message || err);
  }
}

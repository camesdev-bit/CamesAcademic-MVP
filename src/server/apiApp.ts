import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import dotenv from "dotenv";
import {
  getDb,
  saveDb,
  getCurrentUser,
  awardUserXp,
  touchActivity,
  Material,
  Topic,
  User,
} from "../lib/store";
import {
  serapMateri,
  buatRingkasan,
  buatFlashcards,
  buatSoal,
  tanyaTutor,
  structureText,
  SerapTopic,
} from "../lib/ai";
import {
  XP_CORRECT,
  XP_WRONG,
  XP_FLASHCARD,
  calculateAccuracy,
  calculateMasteryScore,
} from "../lib/store-helpers";
import {
  ensureUserLoadedFromFirestore,
  syncUserToFirestore,
} from "../lib/firestore-sync";
import {
  cleanFileTitle,
  extractMaterialText,
  hasBinaryGarbage,
  sanitizeReadableText,
} from "../lib/extract";

dotenv.config();

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } });

function getReqUserId(req: Request): string {
  const h = req.headers["x-user-id"];
  if (typeof h === "string" && h.trim()) return h.trim();
  const q = req.query.userId;
  if (typeof q === "string" && q.trim()) return q.trim();
  const b = req.body?.userId;
  if (typeof b === "string" && b.trim()) return b.trim();
  return "usr-guest";
}

function getBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || undefined;
  }
  return undefined;
}

const formatDateLabel = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "Baru saja";
  }
};

function safeDisplayTitle(m: Pick<Material, "title" | "sourceName">): string {
  const cleaned = sanitizeReadableText(m.title || "");
  if (!cleaned || hasBinaryGarbage(m.title || "") || /^jfif$/i.test(cleaned)) {
    return m.sourceName ? cleanFileTitle(m.sourceName) : "Materi Pembelajaran";
  }
  return cleaned;
}

export function createApiApp() {
  const app = express();

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // Hydrate authenticated user state from Firestore on cold starts (essential for Vercel Serverless)
  app.use("/api", async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const uid = getReqUserId(req);
      const token = getBearerToken(req);
      await ensureUserLoadedFromFirestore(uid, token);
    } catch {
      // Proceed gracefully with local/tmp cache
    }
    next();
  });

  const flushFirestore = (req: Request, overrideUid?: string) =>
    syncUserToFirestore(overrideUid || getReqUserId(req), getBearerToken(req));

  /* ---------------- Dashboard API ---------------- */
  app.get("/api/dashboard", (req: Request, res: Response) => {
    const db = getDb();
    const user = getCurrentUser(getReqUserId(req));
    const materials = db.materials.filter((m) => m.userId === user.id);
    const latest = materials.length > 0 ? materials[materials.length - 1] : null;

    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7;
    const weekActive = [false, false, false, false, false, false, false];
    let weekAnswers = 0;

    const oneWeekAgo = Date.now() - 7 * 86400000;
    const userAnswers = db.answers.filter((a) => a.userId === user.id);
    userAnswers.forEach((ans) => {
      const ansTime = new Date(ans.createdAt).getTime();
      if (ansTime >= oneWeekAgo) {
        weekAnswers++;
        const d = (new Date(ans.createdAt).getDay() + 6) % 7;
        weekActive[d] = true;
      }
    });

    const totalCorrect = userAnswers.filter((a) => a.correct).length;
    const masteredConcepts = db.masteries.filter(
      (m) => m.userId === user.id && m.score >= 70
    ).length;

    const formattedMaterials = materials.map((m) => ({
      id: m.id,
      title: safeDisplayTitle(m),
      subject: m.subject || "Umum",
      status: m.status,
      dateLabel: formatDateLabel(m.createdAt),
    }));

    const continueHref = latest
      ? `/materi/${latest.id}${latest.status === "READY" ? "" : "/proses"}`
      : "/materi";

    res.json({
      user: {
        name: user.name,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
      },
      latest: latest
        ? {
            id: latest.id,
            title: safeDisplayTitle(latest),
            subject: latest.subject,
            status: latest.status,
          }
        : null,
      continueHref,
      weekAnswers,
      weeklyTarget: 20,
      weekActive,
      todayIndex: dayOfWeek,
      totalCorrect,
      masteredConcepts,
      materials: formattedMaterials,
    });
  });

  /* ---------------- Materials List & Create API ---------------- */
  app.get("/api/materials", (req: Request, res: Response) => {
    const db = getDb();
    const user = getCurrentUser(getReqUserId(req));
    const list = db.materials
      .filter((m) => m.userId === user.id)
      .map((m) => {
        const qCount = db.questions.filter((q) => q.materialId === m.id).length;
        const fcCount = db.flashcards.filter((f) => f.materialId === m.id).length;
        return {
          id: m.id,
          title: safeDisplayTitle(m),
          subject: m.subject || "Pelajaran",
          status: m.status,
          sourceType: m.sourceType || "text",
          questions: qCount,
          flashcards: fcCount,
          dateLabel: formatDateLabel(m.createdAt),
        };
      });

    res.json(list);
  });

  app.post(
    "/api/materials",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const db = getDb();
        const user = getCurrentUser(getReqUserId(req));
        const { title, subject, text } = req.body;
        let content = sanitizeReadableText(String(text || ""));
        let sourceType = "text";
        let sourceName: string | null = null;

        if (req.file) {
          sourceType = "file";
          sourceName = req.file.originalname;
          try {
            content = await extractMaterialText(req.file);
          } catch (extractErr: any) {
            return res.status(400).json({
              error: extractErr?.message || "Gagal membaca isi file materi.",
            });
          }
        }

        if (!content || content.trim().length < 15) {
          return res.status(400).json({
            error: "Materi terlalu pendek atau kosong. Masukkan minimal 15 karakter.",
          });
        }

        const initialTitle =
          (title && String(title).trim()) ||
          (sourceName ? cleanFileTitle(sourceName) : "Materi Pembelajaran Baru");

        const newId = `mat-${Date.now()}`;
        const newMaterial: Material = {
          id: newId,
          userId: user.id,
          title: initialTitle.slice(0, 120),
          subject: subject?.trim() || "Pelajaran Umum",
          sourceType,
          sourceName,
          rawText: content,
          status: "EXTRACTING",
          step: null,
          error: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.materials.push(newMaterial);
        touchActivity(user.id);
        saveDb();
        await flushFirestore(req, user.id);

        res.json({ id: newId, status: "EXTRACTING" });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Gagal membuat materi" });
      }
    }
  );

  /* ---------------- Single Material & Step Processor ---------------- */
  app.get("/api/materials/:id", (req: Request, res: Response) => {
    const db = getDb();
    const user = getCurrentUser(getReqUserId(req));
    const m = db.materials.find((x) => x.id === req.params.id);
    if (!m) {
      return res.status(404).json({ error: "Materi tidak ditemukan" });
    }

    const summary = db.summaries.find((s) => s.materialId === m.id);
    const cards = db.flashcards.filter((f) => f.materialId === m.id);
    const questions = db.questions.filter((q) => q.materialId === m.id);
    const history = db.chats.filter(
      (c) => c.materialId === m.id && c.userId === user.id
    );

    const materialTopics = db.topics.filter((t) => t.materialId === m.id);
    const conceptIds = materialTopics.flatMap((t) => t.concepts.map((c) => c.id));
    const masteryChips = db.masteries
      .filter((mas) => mas.userId === user.id && conceptIds.includes(mas.conceptId))
      .map((mas) => {
        const cName =
          materialTopics
            .flatMap((t) => t.concepts)
            .find((c) => c.id === mas.conceptId)?.name || "Konsep";
        return { name: cName, score: mas.score };
      });

    const answers = db.answers.filter(
      (a) => a.materialId === m.id && a.userId === user.id
    );
    const correctCount = answers.filter((a) => a.correct).length;
    const wrongCount = answers.length - correctCount;
    const accuracyPct = calculateAccuracy(correctCount, answers.length);

    const strengths: string[] = masteryChips
      .filter((mc) => mc.score >= 70)
      .map((mc) => mc.name);
    const weaknesses: string[] = masteryChips
      .filter((mc) => mc.score < 60)
      .map((mc) => mc.name);

    const stats = {
      answered: answers.length,
      correct: correctCount,
      wrong: wrongCount,
      percent: accuracyPct,
      strengths,
      weaknesses,
      flashcards: cards.length,
      flashcardsMastered: cards.filter((c) => c.mastered).length,
    };

    res.json({
      material: {
        id: m.id,
        title: safeDisplayTitle(m),
        subject: m.subject,
        status: m.status,
        sourceType: m.sourceType,
        questions: questions.length,
        flashcards: cards.length,
      },
      summary: summary?.content || "",
      cards: cards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        mastered: c.mastered,
      })),
      history: history.map((h) => ({
        id: h.id,
        role: h.role,
        content: h.content,
      })),
      stats,
      mastery: masteryChips,
    });
  });

  app.post("/api/materials/:id/step", async (req: Request, res: Response) => {
    const db = getDb();
    const user = getCurrentUser(getReqUserId(req));
    const m = db.materials.find((x) => x.id === req.params.id);

    if (!m) return res.status(404).json({ error: "Materi tidak ditemukan" });

    if (m.status === "READY") {
      return res.json({
        status: "READY",
        step: null,
        label: "Materi siap dipelajari!",
        error: null,
      });
    }

    try {
      const existingTopics = db.topics.filter((t) => t.materialId === m.id);
      if (existingTopics.length === 0) {
        m.status = "ANALYZING";
        m.step = "serap";
        saveDb();

        const serapResult = await serapMateri(m.rawText);
        if (serapResult.title) m.title = serapResult.title;

        serapResult.topics.forEach((t, tIdx) => {
          const topicId = `top-${Date.now()}-${tIdx}`;
          const newTopic: Topic = {
            id: topicId,
            materialId: m.id,
            title: t.title,
            description: t.description,
            order: tIdx,
            concepts: t.concepts.map((c, cIdx) => ({
              id: `con-${Date.now()}-${tIdx}-${cIdx}`,
              topicId,
              name: c.name,
              definition: c.definition,
              formulas: c.formulas,
              examples: c.examples,
              keyTerms: c.keyTerms,
              order: cIdx,
            })),
          };
          db.topics.push(newTopic);
        });

        saveDb();
        await flushFirestore(req, user.id);
        return res.json({
          status: "ANALYZING",
          step: "serap",
          label: "AI memahami materi (AI SERAP)...",
          error: null,
        });
      }

      const currentTopics = db.topics.filter((t) => t.materialId === m.id);
      const serapTopics: SerapTopic[] = currentTopics.map((t) => ({
        title: t.title,
        description: t.description,
        concepts: t.concepts.map((c) => ({
          name: c.name,
          definition: c.definition,
          formulas: c.formulas,
          examples: c.examples,
          keyTerms: c.keyTerms,
        })),
      }));
      const structure = structureText(serapTopics);

      const existingSummary = db.summaries.find((s) => s.materialId === m.id);
      if (!existingSummary) {
        m.status = "GENERATING";
        m.step = "ringkasan";
        saveDb();

        const summaryText = await buatRingkasan(m.rawText, structure);
        db.summaries.push({
          id: `sum-${Date.now()}`,
          materialId: m.id,
          content: summaryText,
          updatedAt: new Date().toISOString(),
        });

        saveDb();
        await flushFirestore(req, user.id);
        return res.json({
          status: "GENERATING",
          step: "ringkasan",
          label: "Menyusun ringkasan (AI INTI)...",
          error: null,
        });
      }

      const existingCards = db.flashcards.filter((f) => f.materialId === m.id);
      if (existingCards.length === 0) {
        m.status = "GENERATING";
        m.step = "flashcard";
        saveDb();

        const generatedCards = await buatFlashcards(structure, 8);
        const allConcepts = currentTopics.flatMap((t) => t.concepts);

        generatedCards.forEach((c, idx) => {
          const matched = allConcepts.find(
            (con) => con.name.toLowerCase() === (c.concept || "").toLowerCase()
          );
          db.flashcards.push({
            id: `fc-${Date.now()}-${idx}`,
            materialId: m.id,
            conceptId: matched?.id || null,
            front: c.front,
            back: c.back,
            mastered: false,
            order: idx,
          });
        });

        saveDb();
        await flushFirestore(req, user.id);
        return res.json({
          status: "GENERATING",
          step: "flashcard",
          label: "Membuat flashcard interaktif...",
          error: null,
        });
      }

      const existingQuestions = db.questions.filter((q) => q.materialId === m.id);
      if (existingQuestions.length === 0) {
        m.status = "GENERATING";
        m.step = "soal";
        saveDb();

        const generatedQuestions = await buatSoal(structure, 6);
        const allConcepts = currentTopics.flatMap((t) => t.concepts);

        generatedQuestions.forEach((q, idx) => {
          const matched = allConcepts.find(
            (con) => con.name.toLowerCase() === (q.concept || "").toLowerCase()
          );
          db.questions.push({
            id: `q-${Date.now()}-${idx}`,
            materialId: m.id,
            conceptId: matched?.id || null,
            difficulty: q.difficulty || 1,
            question: q.question,
            options: q.options,
            answerIndex: q.answerIndex,
            explanation: q.explanation,
            order: idx,
          });
        });

        m.status = "READY";
        m.step = null;
        m.error = null;
        saveDb();
        await flushFirestore(req, user.id);

        return res.json({
          status: "READY",
          step: null,
          label: "Materi siap dipelajari!",
          error: null,
        });
      }

      m.status = "READY";
      m.step = null;
      saveDb();
      await flushFirestore(req, user.id);
      return res.json({
        status: "READY",
        step: null,
        label: "Materi siap dipelajari!",
        error: null,
      });
    } catch (err: any) {
      m.status = "FAILED";
      m.error = err.message || "Gagal memproses";
      saveDb();
      await flushFirestore(req, user.id);
      return res.status(500).json({
        status: "FAILED",
        step: m.step,
        label: "Proses gagal",
        error: err.message,
      });
    }
  });

  /* ---------------- Quiz API ---------------- */
  app.get("/api/materials/:id/quiz", (req: Request, res: Response) => {
    const db = getDb();
    const questions = db.questions
      .filter((q) => q.materialId === req.params.id)
      .map((q) => {
        const topic = db.topics.find((t) =>
          t.concepts.some((c) => c.id === q.conceptId)
        );
        const concept = topic?.concepts.find((c) => c.id === q.conceptId);
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          difficulty: q.difficulty,
          concept: concept?.name || null,
        };
      });

    res.json({ questions });
  });

  app.post("/api/materials/:id/answer", async (req: Request, res: Response) => {
    const db = getDb();
    const user = getCurrentUser(getReqUserId(req));
    const { questionId, selected } = req.body;

    const q = db.questions.find((x) => x.id === questionId);
    if (!q) return res.status(404).json({ error: "Soal tidak ditemukan" });

    const correct = selected === q.answerIndex;
    const isFirstTime = !db.answers.some(
      (a) => a.userId === user.id && a.questionId === questionId
    );

    db.answers.push({
      id: `ans-${Date.now()}`,
      userId: user.id,
      materialId: req.params.id,
      questionId,
      selected,
      correct,
      createdAt: new Date().toISOString(),
    });

    let conceptName: string | null = null;
    if (q.conceptId) {
      const topic = db.topics.find((t) =>
        t.concepts.some((c) => c.id === q.conceptId)
      );
      conceptName = topic?.concepts.find((c) => c.id === q.conceptId)?.name || null;

      let mastery = db.masteries.find(
        (m) => m.userId === user.id && m.conceptId === q.conceptId
      );
      if (!mastery) {
        mastery = {
          id: `mas-${Date.now()}`,
          userId: user.id,
          conceptId: q.conceptId,
          correct: 0,
          wrong: 0,
          score: 0,
          updatedAt: new Date().toISOString(),
        };
        db.masteries.push(mastery);
      }

      if (correct) mastery.correct++;
      else mastery.wrong++;

      mastery.score = calculateMasteryScore(mastery.correct, mastery.wrong);
      mastery.updatedAt = new Date().toISOString();
    }

    const xpGain = isFirstTime ? (correct ? XP_CORRECT : XP_WRONG) : 0;
    if (xpGain > 0) {
      awardUserXp(user.id, xpGain);
    } else {
      touchActivity(user.id);
    }

    saveDb();
    await flushFirestore(req, user.id);

    res.json({
      correct,
      answerIndex: q.answerIndex,
      explanation: q.explanation,
      xpGain,
      concept: conceptName,
    });
  });

  /* ---------------- Flashcard API ---------------- */
  app.patch("/api/flashcards/:id", async (req: Request, res: Response) => {
    const db = getDb();
    const user = getCurrentUser(getReqUserId(req));
    const fc = db.flashcards.find((f) => f.id === req.params.id);
    if (!fc) return res.status(404).json({ error: "Flashcard tidak ditemukan" });

    const wasMastered = fc.mastered;
    fc.mastered = Boolean(req.body.mastered);

    if (!wasMastered && fc.mastered) {
      awardUserXp(user.id, XP_FLASHCARD);
    }
    saveDb();
    await flushFirestore(req, user.id);

    res.json({ ok: true, mastered: fc.mastered });
  });

  /* ---------------- AI Tutor Chat API ---------------- */
  app.post("/api/materials/:id/chat", async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const user = getCurrentUser(getReqUserId(req));
      const { message, level = "normal" } = req.body;
      const m = db.materials.find((x) => x.id === req.params.id);

      if (!m) return res.status(404).json({ error: "Materi tidak ditemukan" });

      const summary = db.summaries.find((s) => s.materialId === m.id);
      const currentTopics = db.topics.filter((t) => t.materialId === m.id);
      const structure = structureText(
        currentTopics.map((t) => ({
          title: t.title,
          description: t.description,
          concepts: t.concepts,
        }))
      );

      const recentChats = db.chats
        .filter((c) => c.materialId === m.id && c.userId === user.id)
        .slice(-6);

      const masteryText = db.masteries
        .filter((mas) => mas.userId === user.id)
        .map((mas) => {
          const cName = currentTopics
            .flatMap((t) => t.concepts)
            .find((c) => c.id === mas.conceptId)?.name;
          return cName ? `${cName}: ${mas.score}%` : null;
        })
        .filter(Boolean)
        .join(", ");

      const reply = await tanyaTutor({
        question: message,
        summary: summary?.content || m.rawText,
        structure,
        mastery: masteryText,
        history: recentChats.map((c) => ({
          role: c.role,
          content: c.content,
        })),
        level,
      });

      db.chats.push({
        id: `msg-${Date.now()}-u`,
        userId: user.id,
        materialId: m.id,
        role: "user",
        content: message,
        level,
        createdAt: new Date().toISOString(),
      });

      db.chats.push({
        id: `msg-${Date.now()}-a`,
        userId: user.id,
        materialId: m.id,
        role: "assistant",
        content: reply,
        level,
        createdAt: new Date().toISOString(),
      });

      awardUserXp(user.id, 2);
      saveDb();
      await flushFirestore(req, user.id);

      res.json({ reply });
    } catch (err: any) {
      console.error("Chat error:", err);
      res.status(500).json({ error: err.message || "Tutor AI gagal merespons" });
    }
  });

  /* ---------------- Progress API ---------------- */
  app.get("/api/progress", (req: Request, res: Response) => {
    const db = getDb();
    const user = getCurrentUser(getReqUserId(req));
    const materials = db.materials.filter((m) => m.userId === user.id);
    const answers = db.answers.filter((a) => a.userId === user.id);
    const correctCount = answers.filter((a) => a.correct).length;
    const accuracy = calculateAccuracy(correctCount, answers.length);

    const mastered = db.masteries.filter(
      (m) => m.userId === user.id && m.score >= 70
    ).length;

    const DAY_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const today = new Date();
    const currentDayIdx = (today.getDay() + 6) % 7;

    const days = DAY_LABELS.map((label, idx) => {
      const count = answers.filter((a) => {
        const d = (new Date(a.createdAt).getDay() + 6) % 7;
        return d === idx;
      }).length;
      return {
        label,
        count,
        today: idx === currentDayIdx,
      };
    });

    const materialStats = materials.map((m) => {
      const mTopics = db.topics.filter((t) => t.materialId === m.id);
      const mConcepts = mTopics.flatMap((t) => t.concepts);
      const mMasteries = db.masteries.filter(
        (mas) =>
          mas.userId === user.id &&
          mConcepts.some((c) => c.id === mas.conceptId)
      );

      const avg =
        mMasteries.length > 0
          ? Math.round(
              mMasteries.reduce((acc, cur) => acc + cur.score, 0) /
                mMasteries.length
            )
          : null;

      return {
        id: m.id,
        title: safeDisplayTitle(m),
        subject: m.subject || "Umum",
        concepts: mConcepts.length,
        avg,
      };
    });

    res.json({
      user: {
        streak: user.streak,
        level: user.level,
        xp: user.xp,
      },
      materialsCount: materials.length,
      answersCount: answers.length,
      accuracy,
      mastered,
      days,
      materials: materialStats,
    });
  });

  /* ---------------- Auth API ---------------- */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const db = getDb();
    const { email, userId, name } = req.body;
    let user = userId ? db.users.find((u) => u.id === userId) : null;
    if (!user && email) {
      user = db.users.find((u) => u.email === email);
    }
    if (!user) {
      user = getCurrentUser(userId || "usr-guest");
      if (email) user.email = email;
      if (name) user.name = name;
    }
    touchActivity(user.id);
    saveDb();
    await flushFirestore(req, user.id);
    res.json({ ok: true, user });
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const db = getDb();
    const { name, email, userId } = req.body;
    const existing = db.users.find(
      (u) => (userId && u.id === userId) || (email && u.email === email)
    );
    if (existing) {
      touchActivity(existing.id);
      saveDb();
      await flushFirestore(req, existing.id);
      return res.json({ ok: true, user: existing });
    }
    const newUser: User = {
      id: userId || `usr-${Date.now()}`,
      email: email || "student@cames.my.id",
      name: name || "Pelajar Cames",
      xp: 0,
      level: 1,
      streak: 1,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDb();
    await flushFirestore(req, newUser.id);
    res.json({ ok: true, user: newUser });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  return app;
}

import zlib from "zlib";
import { geminiGenerate } from "./gemini";

export function sanitizeReadableText(input: string): string {
  return input
    .replace(/\uFFFD/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasBinaryGarbage(input: string): boolean {
  if (!input) return false;
  const replacementCount = (input.match(/\uFFFD/g) || []).length;
  const controlCount = (input.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
  if (replacementCount > 4 || controlCount > 4) return true;
  if (input.length > 0 && (replacementCount + controlCount) / input.length > 0.05) {
    return true;
  }
  return false;
}

export function cleanFileTitle(fileName?: string | null): string {
  if (!fileName) return "Materi Pembelajaran";
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 120) || "Materi Pembelajaran";
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function extractZipEntry(buf: Buffer, targetName: string): Buffer | null {
  const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocdOffset = buf.lastIndexOf(eocdSig);
  if (eocdOffset === -1 || eocdOffset + 22 > buf.length) return null;

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  let cdOffset = buf.readUInt32LE(eocdOffset + 16);

  for (let i = 0; i < totalEntries; i++) {
    if (cdOffset + 46 > buf.length) break;
    if (buf.readUInt32LE(cdOffset) !== 0x02014b50) break;

    const method = buf.readUInt16LE(cdOffset + 10);
    const compSize = buf.readUInt32LE(cdOffset + 20);
    const fnameLen = buf.readUInt16LE(cdOffset + 28);
    const extraLen = buf.readUInt16LE(cdOffset + 30);
    const commentLen = buf.readUInt16LE(cdOffset + 32);
    const localOffset = buf.readUInt32LE(cdOffset + 42);

    const name = buf.toString("utf-8", cdOffset + 46, cdOffset + 46 + fnameLen);
    if (name === targetName) {
      if (localOffset + 30 > buf.length) return null;
      const localFnameLen = buf.readUInt16LE(localOffset + 26);
      const localExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localFnameLen + localExtraLen;
      const compressed = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return compressed;
      if (method === 8) return zlib.inflateRawSync(compressed);
      return null;
    }

    cdOffset += 46 + fnameLen + extraLen + commentLen;
  }

  return null;
}

function extractDocxText(buffer: Buffer): string {
  const xmlBuf = extractZipEntry(buffer, "word/document.xml");
  if (!xmlBuf) {
    throw new Error("File DOCX tidak valid atau tidak berisi dokumen teks.");
  }
  const xml = xmlBuf.toString("utf-8");
  const withBreaks = xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:br\s*\/?>/g, "\n")
    .replace(/<w:tab\s*\/?>/g, "\t")
    .replace(/<[^>]+>/g, "");
  return sanitizeReadableText(decodeXmlEntities(withBreaks));
}

function detectMime(fileName: string, mimeType: string, buf: Buffer): string {
  const lower = fileName.toLowerCase();
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (buf.subarray(0, 4).toString("ascii") === "%PDF") {
    return "application/pdf";
  }
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return mimeType || "text/plain";
}

async function extractWithGeminiMedia(mime: string, buffer: Buffer, fileName: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const system = `Anda adalah OCR dan ekstraktor materi akademik CamesAcademic.
Tugas: baca seluruh teks, judul, poin, tabel, rumus, dan keterangan diagram dari file/gambar ini dengan akurasi tinggi.
Aturan wajib:
- Transkripsikan seluruh isi materi menjadi teks/Markdown yang bersih, rapi, dan lengkap.
- Pertahankan istilah teknis, angka, dan rumus persis seperti di sumber.
- Jangan menulis komentar pembuka/penutup ("Berikut hasil ekstraksi..."). Langsung isi materinya saja.`;

  const prompt = `Ekstrak dan rapikan seluruh isi materi pembelajaran dari file "${fileName}" ini.`;
  const extracted = await geminiGenerate({
    system,
    prompt,
    image: { mime, data: base64 },
    smart: true,
    maxOutputTokens: 6144,
  });

  const clean = sanitizeReadableText(extracted);
  if (clean.length < 15) {
    throw new Error("Teks materi di dalam gambar/PDF terlalu sedikit atau tidak terbaca.");
  }
  return clean;
}

export async function extractMaterialText(file: {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}): Promise<string> {
  const mime = detectMime(file.originalname, file.mimetype, file.buffer);

  if (mime.startsWith("image/") || mime === "application/pdf") {
    try {
      return await extractWithGeminiMedia(mime, file.buffer, file.originalname);
    } catch (err: any) {
      throw new Error(
        err?.message ||
          `Gagal membaca teks dari ${mime === "application/pdf" ? "PDF" : "gambar"}. Pastikan file jelas dan API key Gemini aktif.`
      );
    }
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.originalname.toLowerCase().endsWith(".docx")
  ) {
    const docxText = extractDocxText(file.buffer);
    if (docxText.length < 15) {
      throw new Error("Isi dokumen DOCX terlalu pendek atau kosong.");
    }
    return docxText;
  }

  const utf8 = file.buffer.toString("utf-8");
  if (hasBinaryGarbage(utf8)) {
    throw new Error("Format file biner tidak didukung untuk dibaca sebagai teks.");
  }

  const clean = sanitizeReadableText(utf8);
  if (clean.length < 15) {
    throw new Error("Isi file terlalu pendek atau kosong. Minimal 15 karakter.");
  }
  return clean;
}

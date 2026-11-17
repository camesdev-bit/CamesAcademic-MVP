import React from "react";

function inline(text: string, keyBase: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);
  return parts
    .filter((p) => p !== "")
    .map((p, i) => {
      const key = `${keyBase}-${i}`;
      if (p.startsWith("**") && p.endsWith("**")) {
        return (
          <strong key={key} className="font-bold text-navy">
            {p.slice(2, -2)}
          </strong>
        );
      }
      if (p.startsWith("`") && p.endsWith("`")) {
        return (
          <code
            key={key}
            className="rounded-md bg-brand/10 px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-brand-700"
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
        return (
          <em key={key}>{p.slice(1, -1)}</em>
        );
      }
      return <React.Fragment key={key}>{p}</React.Fragment>;
    });
}

export default function MD({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i}>{inline(it, `${key}-${i}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key} className="ml-5 list-decimal space-y-1 marker:text-brand">
          {items}
        </ol>
      ) : (
        <ul key={key} className="ml-5 list-disc space-y-1 marker:text-brand">
          {items}
        </ul>
      )
    );
    list = null;
  };

  const flushCode = (key: string) => {
    if (!code) return;
    blocks.push(
      <pre
        key={key}
        className="overflow-x-auto rounded-lg bg-navy-900 p-3 text-sm text-sky-100"
      >
        {code.join("\n")}
      </pre>
    );
    code = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (code) {
        blocks.push(
          <pre
            key={`code-${idx}`}
            className="overflow-x-auto rounded-lg bg-navy-900 p-3 text-sm text-sky-100"
          >
            {code.join("\n")}
          </pre>
        );
        code = null;
      } else {
        flushList(`l-${idx}`);
        code = [];
      }
      return;
    }
    if (code) {
      code.push(raw);
      return;
    }

    const t = line.trim();
    if (!t) {
      flushList(`l-${idx}`);
      return;
    }

    if (t.startsWith("### ")) {
      flushList(`l-${idx}`);
      blocks.push(
        <h4 key={idx} className="mt-4 text-base font-extrabold text-navy">
          {inline(t.slice(4), `h4-${idx}`)}
        </h4>
      );
      return;
    }
    if (t.startsWith("## ")) {
      flushList(`l-${idx}`);
      blocks.push(
        <h3
          key={idx}
          className="mt-7 flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-navy before:h-6 before:w-1.5 before:rounded-full before:bg-gradient-to-b before:from-brand before:to-brand-light before:content-['']"
        >
          {inline(t.slice(3), `h3-${idx}`)}
        </h3>
      );
      return;
    }
    if (t.startsWith("# ")) {
      flushList(`l-${idx}`);
      blocks.push(
        <h2
          key={idx}
          className="border-b border-[#e4ecfc] pb-2 text-2xl font-extrabold tracking-tight text-navy"
        >
          {inline(t.slice(2), `h2-${idx}`)}
        </h2>
      );
      return;
    }
    if (t === "---" || t === "***") {
      flushList(`l-${idx}`);
      blocks.push(<hr key={idx} className="my-3 border-slate-200" />);
      return;
    }

    if (t.startsWith("> ")) {
      flushList(`l-${idx}`);
      blocks.push(
        <blockquote
          key={idx}
          className="rounded-2xl border border-brand/15 bg-brand/5 px-4 py-3 text-sm leading-relaxed text-slate-700"
        >
          {inline(t.slice(2), `bq-${idx}`)}
        </blockquote>
      );
      return;
    }

    const ul = t.match(/^[-*]\s+(.*)$/);
    const ol = t.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      const ordered = !!ol;
      const content = (ul ? ul[1] : ol![1]) as string;
      if (!list || list.ordered !== ordered) {
        flushList(`l-${idx}`);
        list = { ordered, items: [] };
      }
      list.items.push(content);
      return;
    }

    flushList(`l-${idx}`);
    blocks.push(
      <p key={idx} className="leading-7 text-slate-700">
        {inline(t, `p-${idx}`)}
      </p>
    );
  });

  flushCode("code-end");
  flushList("l-end");

  return <div className="space-y-2.5 text-[15px] text-slate-700">{blocks}</div>;
}

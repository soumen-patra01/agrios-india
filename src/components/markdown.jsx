/* Dependency-free markdown renderer for AI answers.
   Supports: headings, bold/italic, inline code, code blocks, bullet & numbered
   lists, tables, and paragraphs. Renders React elements — no innerHTML. */
import { T } from "../theme/ThemeProvider.jsx";

function inline(text, keyBase) {
  const parts = [];
  // Order matters: code → bold → italic
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      parts.push(<code key={`${keyBase}-${i++}`} style={{ background: T.surface2, padding: "1px 6px", borderRadius: 6, fontSize: "0.9em" }}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith("**")) {
      parts.push(<b key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</b>);
    } else {
      parts.push(<i key={`${keyBase}-${i++}`}>{tok.slice(1, -1)}</i>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const isTableRow = (l) => l.trim().startsWith("|") && l.trim().endsWith("|");
const isDivider = (l) => /^\|[\s:|-]+\|$/.test(l.trim());
const cells = (l) => l.trim().slice(1, -1).split("|").map((c) => c.trim());

export default function Markdown({ text }) {
  const lines = (text || "").split("\n");
  const out = [];
  let k = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // fenced code block
    if (line.trim().startsWith("```")) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
      out.push(
        <pre key={k++} style={{ background: T.surface2, borderRadius: 12, padding: "12px 14px", overflowX: "auto", fontSize: 12.5, margin: "8px 0" }}>
          {buf.join("\n")}
        </pre>,
      );
      continue;
    }

    // table
    if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      i--;
      out.push(
        <div key={k++} style={{ overflowX: "auto", margin: "8px 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: "60%" }}>
            <thead><tr>{head.map((h, j) => (
              <th key={j} style={{ textAlign: "left", padding: "7px 12px", borderBottom: `2px solid ${T.line}`, fontWeight: 700 }}>{inline(h, `th${k}${j}`)}</th>
            ))}</tr></thead>
            <tbody>{rows.map((r, ri) => (
              <tr key={ri}>{r.map((c, j) => (
                <td key={j} style={{ padding: "7px 12px", borderBottom: `1px solid ${T.lineSoft}` }}>{inline(c, `td${k}${ri}${j}`)}</td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    // heading
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      out.push(<div key={k++} style={{ fontWeight: 700, fontSize: h[1].length <= 2 ? 15.5 : 14, margin: "10px 0 4px" }}>{inline(h[2], `h${k}`)}</div>);
      continue;
    }

    // list item
    const li = line.match(/^\s*([-*]|\d+[.)])\s+(.*)/);
    if (li) {
      out.push(
        <div key={k++} style={{ display: "flex", gap: 8, margin: "3px 0", paddingLeft: 4 }}>
          <span style={{ color: T.primary, flexShrink: 0, fontWeight: 700 }}>{/^\d/.test(li[1]) ? li[1] : "•"}</span>
          <span>{inline(li[2], `li${k}`)}</span>
        </div>,
      );
      continue;
    }

    // blank line = paragraph gap
    if (!line.trim()) { out.push(<div key={k++} style={{ height: 6 }} />); continue; }

    out.push(<div key={k++} style={{ margin: "2px 0" }}>{inline(line, `p${k}`)}</div>);
  }

  return <div style={{ fontSize: 14, lineHeight: 1.6 }}>{out}</div>;
}

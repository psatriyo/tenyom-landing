// Small Markdown-to-HTML renderer for the legal drafts in content/legal/.
// Zero dependencies. Supports what those documents use: # / ## / ### headings,
// paragraphs (single line breaks kept), > blockquotes, - and 1. lists,
// GitHub-style tables, ---, **bold**, *italic*, `code` and [links](/path).
//
// Extra rules for the drafts:
//   - Text in square brackets that is not a link, e.g. [NIB], is a placeholder
//     and is wrapped in <mark class="ph"> so it reads as unfinished.
//   - The first blockquote that starts with "**DRAF" or "**Draf" becomes the draft banner.
//   - ## and ### headings get ids; ## headings feed the table of contents.

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function inline(text, base) {
  const tokens = [];
  const keep = (html) => `\u0000${tokens.push(html) - 1}\u0000`;
  let s = text;
  // Code spans first, so nothing inside them is touched.
  s = s.replace(/`([^`]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`));
  // Links. Site-relative paths get the base path.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    let url = href;
    if (href.startsWith("/")) {
      const [path, hash] = href.slice(1).split("#");
      url = base + (path ? path.replace(/\/?$/, "/") : "") + (hash ? `#${hash}` : "");
    }
    return keep(`<a href="${esc(url)}">${inline(label, base)}</a>`);
  });
  s = esc(s);
  // Placeholders: [ANYTHING] that is not a link.
  s = s.replace(/\[([^\]\n]+)\]/g, (_, t) => `<mark class="ph">[${t}]</mark>`);
  s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[+i]);
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

/**
 * @returns {{ title: string, banner: string, html: string, toc: {id: string, text: string}[] }}
 */
export function renderMarkdown(src, { base = "/" } = {}) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const toc = [];
  const usedIds = new Set();
  let title = "";
  let banner = "";
  let para = [];

  const uniqueId = (text) => {
    let id = slugify(text) || "bagian";
    for (let n = 2; usedIds.has(id); n++) id = `${slugify(text)}-${n}`;
    usedIds.add(id);
    return id;
  };
  const flush = () => {
    if (para.length) out.push(`<p>${para.map((l) => inline(l, base)).join("<br>\n")}</p>`);
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;

    if (!line.trim()) { flush(); continue; }

    if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
      flush();
      const level = m[1].length;
      const text = m[2].trim();
      if (level === 1 && !title) { title = text; continue; }
      const id = uniqueId(text);
      if (level === 2) toc.push({ id, text: inline(text, base) });
      out.push(`<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inline(text, base)}</h${level}>`);
      continue;
    }

    if (/^---+\s*$/.test(line)) { flush(); out.push("<hr>"); continue; }

    if (line.startsWith(">")) {
      flush();
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      i--;
      const html = quote.join("\n").split(/\n\s*\n/).map((p) => `<p>${p.split("\n").map((l) => inline(l, base)).join("<br>\n")}</p>`).join("\n");
      if (!banner && /^\*\*draf/i.test(quote[0])) banner = html;
      else out.push(`<blockquote>${html}</blockquote>`);
      continue;
    }

    if (line.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1])) {
      flush();
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(splitRow(lines[i++]));
      i--;
      const hasHead = head.some(Boolean);
      const thead = hasHead ? `<thead><tr>${head.map((c) => `<th scope="col">${inline(c, base)}</th>`).join("")}</tr></thead>` : "";
      // Two-column tables without a header are key/value summaries: first cell is a row header.
      const body = rows
        .map((r) => `<tr>${r.map((c, j) => (j === 0 && !hasHead ? `<th scope="row">${inline(c, base)}</th>` : `<td>${inline(c, base)}</td>`)).join("")}</tr>`)
        .join("\n");
      out.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="Tabel"><table${hasHead ? "" : ' class="kv"'}>${thead}<tbody>${body}</tbody></table></div>`);
      continue;
    }

    if ((m = /^(-|\d+\.)\s+/.exec(line))) {
      flush();
      const ordered = m[1] !== "-";
      const start = ordered ? parseInt(m[1], 10) : 1;
      const re = ordered ? /^\d+\.\s+/ : /^-\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ""));
      i--;
      const tag = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
      out.push(`<${tag}${startAttr}>${items.map((t) => `<li>${inline(t, base)}</li>`).join("\n")}</${tag}>`);
      continue;
    }

    para.push(line.trim());
  }
  flush();

  return { title, banner, html: out.join("\n"), toc };
}

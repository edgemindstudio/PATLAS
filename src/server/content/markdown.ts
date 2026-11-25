import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/**
 * Server-side Markdown rendering with a strict allow-list.
 *
 * Lesson sources are authored in-repository, but all rendered HTML still passes
 * through sanitize-html so authored content can never introduce executable
 * markup into the application.
 */
export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown, {
    async: false,
    gfm: true,
    breaks: false,
  }) as string;

  return sanitizeHtml(raw, {
    allowedTags: [
      "h2",
      "h3",
      "h4",
      "p",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "code",
      "pre",
      "blockquote",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "br",
      "sup",
      "sub",
      "details",
      "summary",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel"],
      th: ["scope"],
      td: ["colspan", "rowspan"],
      code: ["class"],
    },
    allowedSchemes: ["https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
  });
}

export interface MarkdownSectionSource {
  id: string;
  title: string;
  markdown: string;
}

export interface RenderedSection {
  id: string;
  title: string;
  html: string;
}

export function renderSections(sections: MarkdownSectionSource[]): RenderedSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    html: renderMarkdown(section.markdown),
  }));
}

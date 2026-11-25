import katex from "katex";

/** Server-rendered KaTeX for static lesson equations. */
export function MathTex({
  tex,
  displayMode = true,
  label,
}: {
  tex: string;
  displayMode?: boolean;
  label?: string;
}) {
  const html = katex.renderToString(tex, {
    displayMode,
    throwOnError: false,
    strict: "warn",
    output: "html",
  });
  return (
    <div
      className={displayMode ? "math-block" : undefined}
      role="math"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { ModuleRecord } from "@/server/registry/types";
import { categoryUrl, moduleUrl } from "@/server/registry/build";
import {
  getGaussianLesson,
  resolveModuleStatus,
  type LessonContent,
} from "@/server/content/lessons";
import { renderSections, type RenderedSection } from "@/server/content/markdown";
import { Breadcrumbs, type Crumb } from "@/ui/components/Breadcrumbs";
import { MathTex } from "@/ui/components/MathTex";
import { StatusBadge } from "@/ui/components/StatusBadge";
import { GaussianLab } from "@/features/lab/GaussianLab";
import styles from "./Lesson.module.css";

const REQUIRED_SECTIONS = [
  "Plain-language definition",
  "Problem and motivation",
  "Visual intuition",
  "Structure of the model",
  "Symbols and equations",
  "Derivation or explanation",
  "Interactive experiment",
  "Fitting, inference and sampling",
  "Runnable code",
  "Applications",
  "Assumptions and limitations",
  "Related models",
  "Knowledge check",
  "References",
];

function requirementsText(): string {
  try {
    return readFileSync(path.join(process.cwd(), "python", "requirements.txt"), "utf8").trim();
  } catch {
    return "numpy\nscipy\nmatplotlib";
  }
}

export function GaussianLesson({
  model,
  crumbs,
  related,
}: {
  model: ModuleRecord;
  crumbs: Crumb[];
  related: ModuleRecord[];
}) {
  const lesson: LessonContent = getGaussianLesson();
  const sections: RenderedSection[] = renderSections(lesson.sections);
  const status = resolveModuleStatus(model.id);

  return (
    <div className="page">
      <Breadcrumbs items={crumbs} />

      <header className={styles.lessonHeader}>
        <p className="kicker">Reference slice · continuous distribution</p>
        <h1>{lesson.title}</h1>
        <div className="row">
          <StatusBadge status={status} />
          <span className={styles.headerMeta}>
            {model.placements.length} baseline placement
            {model.placements.length === 1 ? "" : "s"} · 1 interactive laboratory · provisional
            canonical identity
          </span>
        </div>
        <p className="lede">{lesson.summary}</p>
        <div className={styles.statusPanel}>
          <strong>Partial — independent review pending.</strong> The reference slice is
          implemented and locally verified, but this module is <em>not</em> accepted. Scientific
          and educational review, acceptance and any promotion to “verified” remain separate
          decisions.
        </div>
      </header>

      <article className={styles.article}>
        {sections.map((section) => {
          const extra =
            section.id === "visual-intuition" ? (
              <GaussianLab />
            ) : section.id === "notation-equations" ? (
              <div className={styles.equations}>
                {lesson.equations.map((equation) => (
                  <figure key={equation.id} className={styles.equationFigure}>
                    <MathTex tex={equation.tex} label={equation.caption} />
                    <figcaption>{equation.caption}</figcaption>
                  </figure>
                ))}
              </div>
            ) : section.id === "code" ? (
              <div className={styles.environment}>
                <h3>Declared Python environment</h3>
                <p>
                  Run the exported script in an isolated environment. These are the exact versions
                  verified for this milestone:
                </p>
                <pre className="code-block">{requirementsText()}</pre>
                <p className="mono">
                  python3 -m venv .venv
                  <br />
                  .venv/bin/python -m pip install -r python/requirements.txt
                </p>
                <p className={styles.smallNote}>
                  The laboratory above generates the current snapshot; the downloaded file{" "}
                  <span className="mono">patlas_gaussian_snapshot.py</span> contains the same
                  parameters and display domain. NumPy, SciPy and Matplotlib are third-party
                  dependencies under their own licences.
                </p>
                <p>
                  <Link href="#lab">Jump to the export controls in the laboratory.</Link>
                </p>
              </div>
            ) : section.id === "knowledge-check" ? (
              <div className={styles.relatedBlock} aria-labelledby="related-models">
                <h2 id="related-models">Related models</h2>
                <p>
                  Related entries are links into the provisional registry. Their lessons are
                  planned and are not implied by this list.
                </p>
                <ul className={styles.relatedList}>
                  {related.map((entry) => (
                    <li key={entry.id}>
                      <Link href={moduleUrl(entry.id)}>{entry.title}</Link>{" "}
                      <StatusBadge status={resolveModuleStatus(entry.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;

          return (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2>{section.title}</h2>
              <div
                className={`prose ${styles.prose}`}
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
              {extra}
            </section>
          );
        })}

        <section id="references" className={styles.section}>
          <h2>References</h2>
          <p>
            These are authoritative external sources. PATLAS cites them; it does not reproduce
            their text. Third-party material remains under each source&apos;s own terms.
          </p>
          <ol className={styles.references}>
            {lesson.references.map((reference) => (
              <li key={reference.id} id={`ref-${reference.id}`}>
                <span>
                  {reference.authors} ({reference.year}). <em>{reference.title}</em>
                  {reference.edition ? `, ${reference.edition} edition` : ""}.
                  {reference.publisher ? ` ${reference.publisher}.` : ""}{" "}
                  <a href={reference.url} rel="noopener noreferrer">
                    {reference.url}
                  </a>
                </span>
                <span className={styles.referenceSupports}>Supports: {reference.supports}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.completeness} aria-labelledby="completeness-heading">
          <h2 id="completeness-heading">Scientific content completeness and limitations</h2>
          <p>
            Every section required by <span className="mono">MODEL_MODULE_SPEC.md</span> is
            present in this lesson. Presence is not acceptance: the text still requires
            independent scientific and educational review.
          </p>
          <div className={styles.tableWrap}>
            <table className="data">
              <caption className="visually-hidden">
                Module specification coverage for the Gaussian reference slice
              </caption>
              <thead>
                <tr>
                  <th scope="col">Required section</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {REQUIRED_SECTIONS.map((sectionName) => (
                  <tr key={sectionName}>
                    <td>{sectionName}</td>
                    <td>Present — review pending</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className={styles.limitations}>
            {lesson.disclosures.map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
            <li>
              Sampling, maximum-likelihood fitting and Bayesian inference are explained in text
              only; M001 authorises one interactive laboratory.
            </li>
            <li>
              No browser Python execution or arbitrary code runner is provided. The downloadable
              script must be run locally.
            </li>
            <li>
              The shared numerical values were checked against SciPy; the visible finite window is
              never used as a normalization proof.
            </li>
          </ul>
        </section>

        <section className={styles.placements} aria-labelledby="placement-heading">
          <h2 id="placement-heading">Placement in the frozen baseline</h2>
          <p>
            This canonical page serves {model.placements.length} duplicate placement
            {model.placements.length === 1 ? "" : "s"}. Each original label and branch is
            preserved.
          </p>
          <ul>
            {model.placements.map((placement) => (
              <li key={placement.id}>
                <Link href={categoryUrl(placement.categoryId)}>
                  {placement.categoryPath.map((item) => item.label).join(" › ")}
                </Link>
                <span className="meta"> — “{placement.label}”</span>
              </li>
            ))}
          </ul>
          {model.aliases.length > 0 ? (
            <p className="meta">Aliases: {model.aliases.join(", ")}.</p>
          ) : null}
        </section>
      </article>
    </div>
  );
}

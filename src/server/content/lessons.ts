import overlays from "../../../content/module-overlays.json";
import gaussianLesson from "../../../content/models/gaussian-normal.json";
import type { ModuleLifecycleStatus } from "@/server/registry/types";

/**
 * Content status overlay.
 *
 * Registry identities and baseline placements stay frozen. Educational content
 * status is tracked separately so that a lesson cannot silently promote a
 * provisional canonical identity or claim acceptance.
 */
export interface ModuleOverlay {
  status: ModuleLifecycleStatus;
  lessonRef?: string;
  labIds: string[];
  statusNote?: string;
}

const moduleOverlays = overlays as Record<string, ModuleOverlay>;

export function getModuleOverlay(moduleId: string): ModuleOverlay | undefined {
  return moduleOverlays[moduleId];
}

export function resolveModuleStatus(moduleId: string): ModuleLifecycleStatus {
  return moduleOverlays[moduleId]?.status ?? "planned";
}

export function implementedModuleIds(): string[] {
  return Object.entries(moduleOverlays)
    .filter(([, overlay]) => overlay.status !== "planned")
    .map(([id]) => id);
}

export interface LessonEquation {
  id: string;
  tex: string;
  caption: string;
}

export interface LessonReference {
  id: string;
  authors: string;
  title: string;
  year: number;
  edition?: string;
  publisher?: string;
  url: string;
  supports: string;
}

export interface LessonSection {
  id: string;
  title: string;
  markdown: string;
}

export interface LessonContent {
  schemaVersion: string;
  id: string;
  title: string;
  kind: string;
  status: ModuleLifecycleStatus;
  statusNote: string;
  summary: string;
  aliases: string[];
  labId: string;
  sections: LessonSection[];
  equations: LessonEquation[];
  references: LessonReference[];
  relatedModels: string[];
  missingSections: string[];
  disclosures: string[];
}

export function getGaussianLesson(): LessonContent {
  return gaussianLesson as LessonContent;
}

export function lessonForModule(moduleId: string): LessonContent | undefined {
  if (moduleId === "gaussian-normal") return getGaussianLesson();
  return undefined;
}

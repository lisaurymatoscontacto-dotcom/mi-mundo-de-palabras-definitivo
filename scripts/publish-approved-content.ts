import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { EvidenceReference, LexiconEntry, VisualAssetRef } from "../packages/core/src/lexicon";
import { validateLexicon } from "../packages/core/src/lexicon";
import { validateVisualMetadata } from "../packages/core/src/media";

type FinalConfidence = "medium" | "high";

interface EditorialApproval {
  id: string;
  evidenceConfidence: FinalConfidence;
  evidenceReferences: EvidenceReference[];
  visual: VisualAssetRef;
  goldenEligible?: boolean;
  editorialNote: string;
}

interface ApprovalDocument {
  schemaVersion: 1;
  approvals: EditorialApproval[];
}

interface CandidateDocument {
  schemaVersion: 1;
  entries: LexiconEntry[];
}

const CANDIDATES = resolve("packages/core/src/generated/lexicon.candidate.json");
const APPROVALS = resolve("content/editorial-approvals.json");
const PUBLIC_ROOT = resolve("apps/web/public/content");
const OUTPUT = resolve("apps/web/public/content/lexicon.approved.json");

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function requireAsset(relativeId: string, label: string, entryId: string) {
  if (/^https?:\/\//i.test(relativeId)) {
    throw new Error(`${entryId}: production ${label} must be stored locally for offline use`);
  }
  const path = resolve(PUBLIC_ROOT, relativeId);
  if (!path.startsWith(`${PUBLIC_ROOT}/`) && path !== PUBLIC_ROOT) {
    throw new Error(`${entryId}: invalid ${label} path outside public content root`);
  }
  try {
    await access(path);
  } catch {
    throw new Error(`${entryId}: missing ${label} asset at apps/web/public/content/${relativeId}`);
  }
}

function validateApprovals(document: ApprovalDocument) {
  if (document.schemaVersion !== 1 || !Array.isArray(document.approvals)) {
    throw new Error("editorial-approvals.json must use schemaVersion 1 with an approvals array");
  }
  const ids = new Set<string>();
  for (const approval of document.approvals) {
    if (!approval.id?.trim()) throw new Error("editorial approval is missing id");
    if (ids.has(approval.id)) throw new Error(`duplicate editorial approval: ${approval.id}`);
    ids.add(approval.id);
    if (approval.evidenceConfidence !== "medium" && approval.evidenceConfidence !== "high") {
      throw new Error(`${approval.id}: evidenceConfidence must be medium or high`);
    }
    if (!approval.editorialNote?.trim()) throw new Error(`${approval.id}: editorialNote is required`);
    if (!Array.isArray(approval.evidenceReferences) || approval.evidenceReferences.length === 0) {
      throw new Error(`${approval.id}: at least one additional evidence reference is required`);
    }
    for (const evidence of approval.evidenceReferences) {
      if (!evidence.sourceId?.trim() || !Array.isArray(evidence.fields) || !evidence.fields.length) {
        throw new Error(`${approval.id}: each evidence reference needs sourceId and fields`);
      }
    }
    if (!approval.visual) throw new Error(`${approval.id}: editorial approval requires a visual`);
    const visualErrors = validateVisualMetadata(approval.visual, approval.visual.value);
    if (visualErrors.length) {
      throw new Error(`${approval.id}: invalid visual: ${visualErrors.join(", ")}`);
    }
  }
}

async function main() {
  const candidateDocument = await readJson<CandidateDocument>(CANDIDATES);
  const approvalDocument = await readJson<ApprovalDocument>(APPROVALS);
  validateApprovals(approvalDocument);

  const candidates = new Map(candidateDocument.entries.map((entry) => [entry.id, entry]));
  const approved: LexiconEntry[] = [];

  for (const approval of approvalDocument.approvals) {
    const candidate = candidates.get(approval.id);
    if (!candidate) throw new Error(`${approval.id}: approval does not match a candidate lexicon entry`);
    if (!candidate.assets.audioId) {
      throw new Error(`${approval.id}: candidate is missing deterministic pronunciation asset reference`);
    }

    if (approval.visual.kind === "photo" || approval.visual.kind === "image") {
      await requireAsset(approval.visual.value, "visual", approval.id);
    }
    await requireAsset(candidate.assets.audioId, "pronunciation audio", approval.id);

    approved.push({
      ...candidate,
      pedagogy: {
        ...candidate.pedagogy,
        evidenceConfidence: approval.evidenceConfidence,
        reviewNote: undefined,
      },
      evidence: [...candidate.evidence, ...approval.evidenceReferences],
      assets: {
        ...candidate.assets,
        visual: approval.visual,
      },
      status: "approved",
      goldenEligible: approval.goldenEligible ?? candidate.goldenEligible,
      editorialNotes: [
        ...(candidate.editorialNotes ?? []),
        `APPROVED: ${approval.editorialNote.trim()}`,
      ],
    });
  }

  const validation = validateLexicon(approved, true);
  if (!validation.valid) {
    throw new Error(`Approved lexicon failed production validation:\n${validation.errors.join("\n")}`);
  }

  const output = {
    schemaVersion: 1,
    entries: approved.sort((a, b) =>
      a.difficulty.reading - b.difficulty.reading || a.defaultWord.localeCompare(b.defaultWord, "es"),
    ),
  };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Published ${approved.length} approved cards -> apps/web/public/content/lexicon.approved.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

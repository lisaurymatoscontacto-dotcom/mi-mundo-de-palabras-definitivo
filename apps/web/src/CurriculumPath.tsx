import type { LearningMode, WordCard } from "@mmdp/core";
import { CURRICULUM_CHAPTERS, type CurriculumChapter } from "@mmdp/core/curriculum";
import { worldForCategory } from "@mmdp/core/worlds";
import { curriculumTrack, type ProfileProgress } from "./progress";
import { buildCurriculumSession } from "./curriculumSession";

export const CURRICULUM_UNLOCK_BATCH_SIZE = 4;

const MODE_LABEL: Record<LearningMode, string> = {
  reading: "Leer",
  writing: "Escribir",
  mixed: "Mixto",
};

export function curriculumBatches(chapters: readonly CurriculumChapter[] = CURRICULUM_CHAPTERS) {
  const batches: CurriculumChapter[][] = [];
  for (let index = 0; index < chapters.length; index += CURRICULUM_UNLOCK_BATCH_SIZE) {
    batches.push(chapters.slice(index, index + CURRICULUM_UNLOCK_BATCH_SIZE));
  }
  return batches;
}

export function currentCurriculumBatch(completedChapterIds: readonly string[]) {
  const completed = new Set(completedChapterIds);
  const batches = curriculumBatches();
  const batchIndex = batches.findIndex((batch) => batch.some((chapter) => !completed.has(chapter.id)));
  const safeIndex = batchIndex >= 0 ? batchIndex : Math.max(0, batches.length - 1);
  return {
    batch: batches[safeIndex] ?? [],
    batchIndex: safeIndex,
    totalBatches: batches.length,
  };
}

interface CurriculumPathProps {
  mode: LearningMode;
  progress: ProfileProgress;
  cards: readonly WordCard[];
  message?: string;
  onBack: () => void;
  onStart: (chapter: CurriculumChapter) => void;
}

export function CurriculumPath({ mode, progress, cards, message, onBack, onStart }: CurriculumPathProps) {
  const track = curriculumTrack(progress, mode);
  const completed = new Set(track.completedChapterIds);
  const { batch, batchIndex, totalBatches } = currentCurriculumBatch(track.completedChapterIds);
  const chapterCards = batch.map((chapter) => {
    const world = worldForCategory(chapter.category);
    const session = buildCurriculumSession(chapter, cards, progress.words);
    const done = completed.has(chapter.id);
    const chapterTotal = CURRICULUM_CHAPTERS.filter((candidate) => candidate.category === chapter.category).length;
    return { world, chapter, session, done, chapterTotal };
  });

  const completedInBatch = chapterCards.filter((entry) => entry.done).length;
  const readyInBatch = chapterCards.filter((entry) => entry.session.ready).length;
  const allComplete = track.completedChapterIds.length >= CURRICULUM_CHAPTERS.length;

  return (
    <>
      <button className="text-button" onClick={onBack}>← Inicio</button>
      <section className="curriculum-summary" aria-label={`Progreso de ${MODE_LABEL[mode]}`}>
        <div>
          <span className="eyebrow">Camino de {MODE_LABEL[mode]} · Bloque {batchIndex + 1} de {totalBatches}</span>
          <h2>{allComplete ? "¡Ruta completa!" : `${completedInBatch} de ${batch.length} capítulos completados`}</h2>
          <p>
            {allComplete
              ? "Puedes volver a practicar cualquier capítulo de este bloque."
              : "Completa los cuatro capítulos de este bloque para abrir el siguiente. Cada capítulo usa 20 cartas sin repeticiones de relleno."}
          </p>
        </div>
        <strong>{readyInBatch}/{batch.length} listos</strong>
      </section>
      {message && <p className="theme-message" role="status">{message}</p>}
      <section className="theme-grid curriculum-grid">
        {chapterCards.map(({ world, chapter, session, done, chapterTotal }) => {
          const readyCards = session.cards.length;
          return (
            <button
              className={`theme-card world-${world?.id ?? chapter.worldId} curriculum-card ${done ? "is-complete" : session.ready ? "is-ready" : "is-preparing"}`}
              key={chapter.id}
              disabled={!session.ready}
              onClick={() => onStart(chapter)}
            >
              <span>{world?.icon ?? "✨"}</span>
              <strong>{chapter.label}</strong>
              <small>{world?.name ?? chapter.worldName} · capítulo {chapter.chapterNumber} de {chapterTotal}</small>
              <span className="chapter-readiness">
                {done
                  ? "✓ Completado · puedes repasar"
                  : session.ready
                    ? "✓ 20/20 cartas listas"
                    : `En preparación · ${readyCards}/20 listas`}
              </span>
            </button>
          );
        })}
      </section>
      <p className="curriculum-note">
        Después de los 12 primeros mundos, la ruta vuelve a ellos con vocabulario nuevo: Animales 2, Casa 2, Comida 2 y así sucesivamente. Los capítulos avanzados reservan 4–5 cartas para repasar palabras difíciles.
      </p>
    </>
  );
}

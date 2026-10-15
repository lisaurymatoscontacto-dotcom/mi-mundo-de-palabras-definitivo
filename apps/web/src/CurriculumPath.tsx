import type { LearningMode, WordCard } from "@mmdp/core";
import { CURRICULUM_CHAPTERS, type CurriculumChapter } from "@mmdp/core/curriculum";
import { LEARNING_WORLDS } from "@mmdp/core/worlds";
import { curriculumTrack, type ProfileProgress } from "./progress";
import { buildCurriculumSession } from "./curriculumSession";

const MODE_LABEL: Record<LearningMode, string> = {
  reading: "Leer",
  writing: "Escribir",
  mixed: "Mixto",
};

export function nextChapterForWorld(category: string, completedChapterIds: readonly string[]) {
  const completed = new Set(completedChapterIds);
  const chapters = CURRICULUM_CHAPTERS.filter((chapter) => chapter.category === category);
  return chapters.find((chapter) => !completed.has(chapter.id)) ?? chapters.at(-1);
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
  const chapterCards = LEARNING_WORLDS.map((world) => {
    const chapter = nextChapterForWorld(world.category, track.completedChapterIds);
    if (!chapter) return null;
    const session = buildCurriculumSession(chapter, cards, progress.words);
    const completedInWorld = CURRICULUM_CHAPTERS.filter(
      (candidate) => candidate.category === world.category && completed.has(candidate.id),
    ).length;
    return { world, chapter, session, completedInWorld };
  }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const readyCount = chapterCards.filter((entry) => entry.session.ready).length;

  return (
    <>
      <button className="text-button" onClick={onBack}>← Inicio</button>
      <section className="curriculum-summary" aria-label={`Progreso de ${MODE_LABEL[mode]}`}>
        <div>
          <span className="eyebrow">Camino de {MODE_LABEL[mode]}</span>
          <h2>{track.completedChapterIds.length} capítulos completados</h2>
          <p>Cada capítulo tiene 20 cartas. Los capítulos avanzados mezclan palabras nuevas con 4–5 repasos elegidos por dificultad.</p>
        </div>
        <strong>{readyCount} listos ahora</strong>
      </section>
      {message && <p className="theme-message" role="status">{message}</p>}
      <section className="theme-grid curriculum-grid">
        {chapterCards.map(({ world, chapter, session, completedInWorld }) => {
          const readyCards = session.cards.length;
          return (
            <button
              className={`theme-card world-${world.id} curriculum-card ${session.ready ? "is-ready" : "is-preparing"}`}
              key={chapter.id}
              disabled={!session.ready}
              onClick={() => onStart(chapter)}
            >
              <span>{world.icon}</span>
              <strong>{chapter.label}</strong>
              <small>{world.name} · {completedInWorld}/19 completados</small>
              <span className="chapter-readiness">
                {session.ready ? "✓ 20/20 cartas listas" : `En preparación · ${readyCards}/20 listas`}
              </span>
            </button>
          );
        })}
      </section>
      <p className="curriculum-note">Los capítulos en preparación no repiten cartas para rellenar huecos: se habilitan solo cuando sus 20 conceptos tienen contenido aprobado.</p>
    </>
  );
}

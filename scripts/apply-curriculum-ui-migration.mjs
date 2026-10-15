import { readFile, writeFile } from "node:fs/promises";

const path = "apps/web/src/App.tsx";
let source = await readFile(path, "utf8");

function replaceOnce(label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Migration anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Migration anchor is not unique: ${label}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceOnce("world import",
`import { LEARNING_WORLDS, worldForCategory } from "@mmdp/core/worlds";`,
`import { worldForCategory } from "@mmdp/core/worlds";
import { chapterById, type CurriculumChapter } from "@mmdp/core/curriculum";`);

replaceOnce("progress import",
`import { loadProgress, masteryLabel, saveProgress, type ProfileProgress } from "./progress";`,
`import { completeCurriculumChapter, curriculumTrack, loadProgress, masteryLabel, saveProgress, type ProfileProgress } from "./progress";`);

replaceOnce("component imports",
`import { prefetchCardMedia } from "./offlineMedia";
import { backTargetForScreen, newParentChallenge, shuffledLetterTokens, togglePickedLetter, type AppScreen } from "./appUi";`,
`import { prefetchCardMedia } from "./offlineMedia";
import { CurriculumPath } from "./CurriculumPath";
import { buildCurriculumSession } from "./curriculumSession";
import { backTargetForScreen, newParentChallenge, shuffledLetterTokens, togglePickedLetter, type AppScreen } from "./appUi";`);

replaceOnce("curriculum css",
`import "./app-experience.css";`,
`import "./app-experience.css";
import "./curriculum-path.css";`);

replaceOnce("initial session size",
`  const [sessionWords, setSessionWords] = useState<WordCard[]>(() => DEMO_WORDS.slice(0, 10));`,
`  const [sessionWords, setSessionWords] = useState<WordCard[]>(() => DEMO_WORDS.slice(0, 20));`);

replaceOnce("chapter state",
`  const [sessionCategory, setSessionCategory] = useState<string | undefined>();
  const [index, setIndex] = useState(0);`,
`  const [sessionCategory, setSessionCategory] = useState<string | undefined>();
  const [sessionChapterId, setSessionChapterId] = useState<string | undefined>();
  const [index, setIndex] = useState(0);`);

replaceOnce("active chapter derivation",
`  const levelInfo = getLevel(progress.currentLevel);`,
`  const levelInfo = getLevel(progress.currentLevel);
  const activeTrack = curriculumTrack(progress, mode);
  const activeChapter = sessionChapterId ? chapterById(sessionChapterId) : undefined;`);

replaceOnce("draft chapter id",
`      level: sessionLevel,
      category: sessionCategory,
      sessionStartStars,`,
`      level: sessionLevel,
      category: sessionCategory,
      chapterId: sessionChapterId,
      sessionStartStars,`);

replaceOnce("legacy start clear chapter",
`    setSessionWords(words);
    setSessionCategory(category);
    setSessionStartStars(progress.stars);`,
`    setSessionWords(words);
    setSessionCategory(category);
    setSessionChapterId(undefined);
    setSessionStartStars(progress.stars);`);

replaceOnce("legacy draft explicit chapter",
`      level: progress.currentLevel,
      category,
      sessionStartStars: progress.stars,`,
`      level: progress.currentLevel,
      category,
      chapterId: undefined,
      sessionStartStars: progress.stars,`);

replaceOnce("insert chapter starter",
`  async function resumeSession() {`,
`  function startChapter(chapter: CurriculumChapter) {
    if (!activeProfile) return;
    const session = buildCurriculumSession(chapter, runtimeWords, progress.words);
    if (!session.ready) {
      setThemeMessage(\`${'${chapter.label}'} todavía está en preparación (${ '${session.cards.length}' }/20 cartas aprobadas). No repetiremos palabras para rellenarlo.\`);
      return;
    }

    const words = session.cards;
    setThemeMessage("");
    setSessionWords(words);
    setSessionCategory(chapter.category);
    setSessionChapterId(chapter.id);
    setSessionStartStars(progress.stars);
    setSessionLevel(progress.currentLevel);
    resetRound();
    void prefetchCardMedia(words);

    const draft = saveSessionDraft({
      profileId: activeProfile.id,
      mode,
      wordIds: words.map((word) => word.id),
      index: 0,
      level: progress.currentLevel,
      category: chapter.category,
      chapterId: chapter.id,
      sessionStartStars: progress.stars,
      sessionCorrect: 0,
      missedWordIds: [],
    });
    setResumeDraft(draft);
    setScreen("play");
  }

  async function resumeSession() {`);

replaceOnce("resume chapter",
`    setSessionWords(restored);
    setSessionCategory(draft.category);
    setIndex(draft.index);`,
`    setSessionWords(restored);
    setSessionCategory(draft.category);
    setSessionChapterId(draft.chapterId);
    setIndex(draft.index);`);

replaceOnce("finish progression",
`    if (evaluation.passed) {
      const completedLevels = baseProgress.completedLevels.includes(sessionLevel)
        ? baseProgress.completedLevels
        : [...baseProgress.completedLevels, sessionLevel];
      const currentLevel = sessionLevel >= 48 ? 48 : Math.max(baseProgress.currentLevel, sessionLevel + 1);
      persist({ ...baseProgress, completedLevels, currentLevel });
    }`,
`    if (evaluation.passed) {
      const chapter = sessionChapterId ? chapterById(sessionChapterId) : undefined;
      if (chapter) {
        let nextProgress = completeCurriculumChapter(baseProgress, mode, chapter.id, chapter.order);
        // Stories keep using the legacy reading level for now. Only successful
        // reading chapters advance it; writing/mixed have independent tracks.
        if (mode === "reading") {
          const completedLevels = nextProgress.completedLevels.includes(sessionLevel)
            ? nextProgress.completedLevels
            : [...nextProgress.completedLevels, sessionLevel];
          const currentLevel = sessionLevel >= 48 ? 48 : Math.max(nextProgress.currentLevel, sessionLevel + 1);
          nextProgress = { ...nextProgress, completedLevels, currentLevel };
        }
        persist(nextProgress);
      } else {
        const completedLevels = baseProgress.completedLevels.includes(sessionLevel)
          ? baseProgress.completedLevels
          : [...baseProgress.completedLevels, sessionLevel];
        const currentLevel = sessionLevel >= 48 ? 48 : Math.max(baseProgress.currentLevel, sessionLevel + 1);
        persist({ ...baseProgress, completedLevels, currentLevel });
      }
    }`);

replaceOnce("themes title",
`      : screen === "themes"
        ? "Elige un mundo"`,
`      : screen === "themes"
        ? mode === "reading" ? "Camino de lectura" : mode === "writing" ? "Camino de escritura" : "Camino mixto"`);

replaceOnce("level pill",
`        <div className="level-pill">Nivel {progress.currentLevel}</div>`,
`        <div className="level-pill">📖 {curriculumTrack(progress, "reading").completedChapterIds.length} · ✏️ {curriculumTrack(progress, "writing").completedChapterIds.length}</div>`);

replaceOnce("resume label",
`            <span><strong>Continuar sesión</strong><small>Nivel {resumeDraft.level} · carta {resumeDraft.index + 1} de {resumeDraft.wordIds.length}</small></span>`,
`            <span><strong>Continuar sesión</strong><small>{resumeDraft.chapterId ? \`${'${chapterById(resumeDraft.chapterId)?.label ?? "Capítulo"}'} · \` : \`Nivel ${'${resumeDraft.level}'} · \`}carta {resumeDraft.index + 1} de {resumeDraft.wordIds.length}</small></span>`);

replaceOnce("home progression banner",
`        <section className="level-banner">
          <div><span>Etapa {levelInfo.stage} de 8</span><h2>{levelInfo.name}</h2><p>{levelInfo.skill}</p></div>
          <strong>{progress.completedLevels.length}/48</strong>
        </section>`,
`        <section className="level-banner">
          <div>
            <span>Ruta temática · 20 cartas por capítulo</span>
            <h2>{curriculumTrack(progress, "reading").completedChapterIds.length} capítulos de lectura completados</h2>
            <p>Los mundos regresan con vocabulario nuevo: Animales 1, después Animales 2 y siguientes, con repaso intencional.</p>
          </div>
          <strong>{curriculumTrack(progress, "reading").completedChapterIds.length + curriculumTrack(progress, "writing").completedChapterIds.length + curriculumTrack(progress, "mixed").completedChapterIds.length}</strong>
        </section>`);

const oldThemes = `  if (screen === "themes") {
    const mixedCount = sessionCandidates().length;
    return (
      <main className={\`app-shell age-${'${ageBand(activeProfile.age)}'}\`}>
        {header}
        <button className="text-button" onClick={() => setScreen("home")}>← Inicio</button>
        {themeMessage && <p className="theme-message" role="status">{themeMessage}</p>}
        <section className="theme-grid">
          <button className="theme-card mixed-theme" disabled={!mixedCount} onClick={() => startSession()}>
            <span>🌈</span><strong>Todos mezclados</strong><small>{mixedCount ? \`${'${mixedCount}'} cartas preparadas para tu nivel\` : "Se desbloquea más adelante"}</small>
          </button>
          {LEARNING_WORLDS.map((world) => {
            const total = DEMO_WORDS.filter((word) => word.category === world.category).length;
            const eligible = total ? sessionCandidates(world.category).length : 0;
            return (
              <button
                className={\`theme-card world-${'${world.id}'}\`}
                key={world.id}
                disabled={!eligible}
                onClick={() => startSession(world.category)}
              >
                <span>{world.icon}</span>
                <strong>{world.name}</strong>
                <small>{eligible ? \`${'${eligible}'} cartas para tu nivel\` : total ? "Se desbloquea más adelante" : "Próximamente"}</small>
              </button>
            );
          })}
        </section>
      </main>
    );
  }`;

const newThemes = `  if (screen === "themes") {
    return (
      <main className={\`app-shell age-${'${ageBand(activeProfile.age)}'}\`}>
        {header}
        <CurriculumPath
          mode={mode}
          progress={progress}
          cards={runtimeWords}
          message={themeMessage}
          onBack={() => setScreen("home")}
          onStart={startChapter}
        />
      </main>
    );
  }`;
replaceOnce("curriculum path screen", oldThemes, newThemes);

replaceOnce("parent chapter stat",
`          <article><span>🗺️</span><strong>{progress.currentLevel}</strong><small>nivel actual</small></article>`,
`          <article><span>🗺️</span><strong>{curriculumTrack(progress, "reading").completedChapterIds.length}</strong><small>capítulos de lectura</small></article>`);

replaceOnce("parent progression details",
`          <p><strong>Etapa:</strong> {levelInfo.stage}/8 — {levelInfo.name}</p>
          <p>Las palabras con más dificultad reciben prioridad automática en próximas sesiones.</p>
          <p><strong>Avance:</strong> se requiere al menos 80% de aciertos para desbloquear el siguiente nivel.</p>`,
`          <p><strong>Lectura:</strong> {curriculumTrack(progress, "reading").completedChapterIds.length} capítulos · <strong>Escritura:</strong> {curriculumTrack(progress, "writing").completedChapterIds.length}</p>
          <p>Las palabras con más dificultad reciben prioridad automática en los repasos de capítulos posteriores.</p>
          <p><strong>Avance:</strong> se requiere al menos 80% de aciertos para completar cada capítulo de 20 cartas.</p>`);

replaceOnce("completion setup",
`    const completed = getLevel(sessionLevel);
    const next = getLevel(Math.min(48, sessionLevel + 1));`,
`    const completedChapter = sessionChapterId ? chapterById(sessionChapterId) : undefined;
    const completed = getLevel(sessionLevel);
    const next = getLevel(Math.min(48, sessionLevel + 1));`);

replaceOnce("completion heading",
`          <h2>{evaluation.passed ? \`¡Nivel ${'${sessionLevel}'} superado!\` : "¡Buen esfuerzo! Vamos a practicar un poco más"}</h2>
          <p>{completed.name}</p>`,
`          <h2>{evaluation.passed ? (completedChapter ? \`¡${'${completedChapter.label}'} completado!\` : \`¡Nivel ${'${sessionLevel}'} superado!\`) : "¡Buen esfuerzo! Vamos a practicar un poco más"}</h2>
          <p>{completedChapter ? \`${'${completedChapter.worldName}'} · 20 cartas\` : completed.name}</p>`);

replaceOnce("completion next",
`          {evaluation.passed && sessionLevel < 48 && <div className="next-level"><small>Siguiente</small><strong>Nivel {sessionLevel + 1}: {next.name}</strong></div>}`, 
`          {evaluation.passed && completedChapter && <div className="next-level"><small>Progreso guardado</small><strong>El siguiente capítulo de este mundo aparecerá en tu camino cuando sus 20 cartas estén listas.</strong></div>}
          {evaluation.passed && !completedChapter && sessionLevel < 48 && <div className="next-level"><small>Siguiente</small><strong>Nivel {sessionLevel + 1}: {next.name}</strong></div>`);

replaceOnce("completion retry",
`              : <button className="primary" onClick={() => startSession(sessionCategory)}>Practicar de nuevo</button>}`, 
`              : <button className="primary" onClick={() => completedChapter ? startChapter(completedChapter) : startSession(sessionCategory)}>Practicar de nuevo</button>}`);

replaceOnce("lesson meta",
`          <span>{currentWorld?.icon ?? "✨"} {currentWorld?.name ?? card.category} · Nivel {sessionLevel}</span>`,
`          <span>{currentWorld?.icon ?? "✨"} {activeChapter ? activeChapter.label : \`${'${currentWorld?.name ?? card.category}'} · Nivel ${'${sessionLevel}'}\`}</span>`);

await writeFile(path, source, "utf8");
console.log("Curriculum UI migration applied successfully.");

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_WORDS,
  buildSession,
  getLevel,
  nextMastery,
  type LearningMode,
  type WordCard,
  type WordProgress,
} from "@mmdp/core";
import { LEARNING_WORLDS, worldForCategory } from "@mmdp/core/worlds";
import { addMissedWord, evaluateSession, type SessionEvaluation } from "@mmdp/core/session-performance";
import {
  AGE_OPTIONS,
  AVATAR_OPTIONS,
  REGION_OPTIONS,
  type ChildProfile,
  type Region,
  ageBand,
  clearActiveProfileId,
  createProfile,
  loadActiveProfileId,
  loadProfiles,
  saveProfiles,
  setActiveProfileId,
} from "./profile";
import { loadProgress, masteryLabel, saveProgress, type ProfileProgress } from "./progress";
import { pronounceWord } from "./pronunciation";
import { StoryLibrary, StoryReader } from "./StoryMode";
import { storyMinimumLevel, type Story } from "@mmdp/core/stories";
import { ParentDataControls } from "./ParentDataControls";
import { CardVisual } from "./CardVisual";
import { loadRuntimeCards } from "./runtimeContent";
import {
  clearSessionDraft,
  loadSessionDraft,
  saveSessionDraft,
  type SessionDraftV1,
} from "./sessionDraft";
import { prefetchCardMedia } from "./offlineMedia";
import { backTargetForScreen, newParentChallenge, shuffledLetterTokens, togglePickedLetter, type AppScreen } from "./appUi";
import "./resume-session.css";
import "./app-experience.css";

type Screen = AppScreen;

const EMPTY_PROGRESS: ProfileProgress = {
  stars: 0,
  discovered: [],
  golden: [],
  words: {},
  currentLevel: 1,
  completedLevels: [],
};

export function App() {
  const initialActiveId = loadActiveProfileId();
  const [profiles, setProfiles] = useState<ChildProfile[]>(() => loadProfiles());
  const [activeId, setActiveId] = useState<string | null>(() => initialActiveId);
  const [screen, setScreen] = useState<Screen>(() => (initialActiveId ? "home" : "profiles"));
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [mode, setMode] = useState<LearningMode>("reading");
  const [draftName, setDraftName] = useState("");
  const [draftAge, setDraftAge] = useState(6);
  const [draftAvatar, setDraftAvatar] = useState<string>(AVATAR_OPTIONS[0]);
  const [draftRegion, setDraftRegion] = useState<Region>("latam");
  const [sessionWords, setSessionWords] = useState<WordCard[]>(() => DEMO_WORDS.slice(0, 10));
  const [runtimeWords, setRuntimeWords] = useState<WordCard[]>(() => DEMO_WORDS);
  const [sessionCategory, setSessionCategory] = useState<string | undefined>();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [cardHadMiss, setCardHadMiss] = useState(false);
  const [themeMessage, setThemeMessage] = useState("");
  const [sessionStartStars, setSessionStartStars] = useState(0);
  const [sessionLevel, setSessionLevel] = useState(1);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionMissedIds, setSessionMissedIds] = useState<string[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<SessionEvaluation | null>(null);
  const [resumeDraft, setResumeDraft] = useState<SessionDraftV1 | null>(() => initialActiveId ? loadSessionDraft(initialActiveId) : null);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [parentAnswer, setParentAnswer] = useState("");
  const [parentChallenge, setParentChallenge] = useState(() => newParentChallenge());
  const [progress, setProgress] = useState<ProfileProgress>(() => initialActiveId ? loadProgress(initialActiveId) : EMPTY_PROGRESS);

  const activeProfile = profiles.find((profile) => profile.id === activeId) ?? null;
  const card = sessionWords[index] ?? runtimeWords[0] ?? DEMO_WORDS[0];

  useEffect(() => {
    let cancelled = false;
    if (!activeProfile) {
      setRuntimeWords(DEMO_WORDS);
      return () => { cancelled = true; };
    }

    void loadRuntimeCards(activeProfile.region).then((cards) => {
      if (!cancelled) setRuntimeWords(cards);
    });

    return () => { cancelled = true; };
  }, [activeProfile?.id, activeProfile?.region]);
  const particles = useMemo(() => Array.from({ length: 14 }, (_, particleIndex) => particleIndex), []);
  const letters = useMemo(() => shuffledLetterTokens(card.word), [card.word]);
  const roundProgress = sessionWords.length ? (index + 1) / sessionWords.length : 0;
  const levelInfo = getLevel(progress.currentLevel);

  useEffect(() => {
    if (!activeId || activeProfile) return;
    clearActiveProfileId();
    setActiveId(null);
    setScreen("profiles");
  }, [activeId, activeProfile]);

  useEffect(() => {
    const currentState = window.history.state as { mmdpScreen?: Screen; mmdpGuard?: boolean } | null;
    if (!currentState?.mmdpScreen) {
      window.history.replaceState({ ...(currentState ?? {}), mmdpScreen: screen }, "");
      window.history.pushState({ mmdpScreen: screen, mmdpGuard: true }, "");
    } else if (currentState.mmdpScreen !== screen) {
      window.history.pushState({ ...currentState, mmdpScreen: screen }, "");
    }

    const handleBack = () => {
      const target = backTargetForScreen(screen);
      if (target === screen) {
        window.history.pushState({ mmdpScreen: screen, mmdpGuard: true }, "");
        return;
      }

      window.history.replaceState({ ...(window.history.state ?? {}), mmdpScreen: target }, "");
      setScreen(target);
      if (target === "profiles") {
        clearActiveProfileId();
        setActiveId(null);
        setResumeDraft(null);
        setParentUnlocked(false);
      }
    };

    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [screen]);

  function resetRound() {
    setIndex(0);
    setRevealed(false);
    setPicked([]);
    setFeedback("");
    setCardHadMiss(false);
    setSessionCorrect(0);
    setSessionMissedIds([]);
    setLastEvaluation(null);
  }

  function resetCardState() {
    setRevealed(false);
    setPicked([]);
    setFeedback("");
    setCardHadMiss(false);
  }

  function persist(next: ProfileProgress) {
    if (!activeProfile) return;
    setProgress(next);
    saveProgress(activeProfile.id, next);
  }

  function persistSessionDraft(overrides: Partial<Pick<SessionDraftV1, "index" | "sessionCorrect" | "missedWordIds">> = {}) {
    if (!activeProfile || !sessionWords.length) return;
    const draft = saveSessionDraft({
      profileId: activeProfile.id,
      mode,
      wordIds: sessionWords.map((word) => word.id),
      index: overrides.index ?? index,
      level: sessionLevel,
      category: sessionCategory,
      sessionStartStars,
      sessionCorrect: overrides.sessionCorrect ?? sessionCorrect,
      missedWordIds: overrides.missedWordIds ?? sessionMissedIds,
    });
    setResumeDraft(draft);
  }

  function chooseProfile(profile: ChildProfile) {
    setActiveProfileId(profile.id);
    setActiveId(profile.id);
    setProgress(loadProgress(profile.id));
    setResumeDraft(loadSessionDraft(profile.id));
    setParentUnlocked(false);
    setParentAnswer("");
    setParentChallenge(newParentChallenge());
    resetRound();
    setScreen("home");
  }

  function addProfile() {
    if (!draftName.trim()) return;
    const profile = createProfile(draftName, draftAge, draftAvatar, draftRegion);
    const next = [...profiles, profile];
    saveProfiles(next);
    setProfiles(next);
    setDraftName("");
    chooseProfile(profile);
  }

  function switchProfile() {
    clearActiveProfileId();
    setActiveId(null);
    setResumeDraft(null);
    setParentUnlocked(false);
    setScreen("profiles");
  }

  function chooseMode(nextMode: LearningMode) {
    setMode(nextMode);
    setThemeMessage("");
    setScreen("themes");
  }

  function sessionCandidates(category?: string) {
    if (!activeProfile) return [];
    return buildSession(runtimeWords, {
      age: activeProfile.age,
      mode,
      region: activeProfile.region,
      category,
      progress: progress.words,
      level: progress.currentLevel,
    });
  }

  function startSession(category?: string) {
    if (!activeProfile) return;
    const words = sessionCandidates(category);
    if (!words.length) {
      setThemeMessage("Todavía no hay palabras disponibles de este mundo para el nivel actual. Sigue avanzando o elige otro mundo.");
      return;
    }

    setThemeMessage("");
    setSessionWords(words);
    setSessionCategory(category);
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
      category,
      sessionStartStars: progress.stars,
      sessionCorrect: 0,
      missedWordIds: [],
    });
    setResumeDraft(draft);
    setScreen("play");
  }

  async function resumeSession() {
    if (!activeProfile) return;
    const draft = loadSessionDraft(activeProfile.id);
    if (!draft) {
      setResumeDraft(null);
      return;
    }

    const byId = new Map(runtimeWords.map((word) => [word.id, word]));
    const restored = draft.wordIds.map((id) => byId.get(id)).filter((word): word is WordCard => Boolean(word));
    if (restored.length !== draft.wordIds.length || draft.index >= restored.length) {
      clearSessionDraft(activeProfile.id);
      setResumeDraft(null);
      return;
    }

    setMode(draft.mode);
    setSessionWords(restored);
    setSessionCategory(draft.category);
    setIndex(draft.index);
    setSessionLevel(draft.level);
    setSessionStartStars(draft.sessionStartStars);
    setSessionCorrect(draft.sessionCorrect);
    setSessionMissedIds(draft.missedWordIds);
    setRevealed(false);
    setPicked([]);
    setFeedback("");
    setCardHadMiss(false);
    setLastEvaluation(null);
    setResumeDraft(draft);
    void prefetchCardMedia(restored);
    setScreen("play");
  }

  function record(correct: boolean): ProfileProgress {
    const previous: WordProgress = progress.words[card.id] ?? {
      wordId: card.id,
      correctReads: 0,
      incorrectReads: 0,
      mastery: "new",
    };
    const updated = nextMastery(previous, correct);
    const discovered = correct && !progress.discovered.includes(card.id)
      ? [...progress.discovered, card.id]
      : progress.discovered;
    const golden = correct && card.golden && !progress.golden.includes(card.id)
      ? [...progress.golden, card.id]
      : progress.golden;
    const next: ProfileProgress = {
      ...progress,
      stars: progress.stars + (correct ? 1 : 0),
      discovered,
      golden,
      words: { ...progress.words, [card.id]: updated },
    };
    persist(next);
    return next;
  }

  function markSessionMissed() {
    const missed = addMissedWord(sessionMissedIds, card.id);
    setSessionMissedIds(missed);
    setCardHadMiss(true);
    persistSessionDraft({ missedWordIds: missed });
    return missed;
  }

  function discover() {
    if (revealed) return;
    setRevealed(true);
    const nextCorrect = cardHadMiss ? sessionCorrect : sessionCorrect + 1;
    setSessionCorrect(nextCorrect);
    persistSessionDraft({ sessionCorrect: nextCorrect });
    record(true);
  }

  function pickLetter(letter: string, originalIndex: number) {
    if (revealed) return;
    const token = `${originalIndex}:${letter}`;
    if (picked.includes(token)) {
      setPicked(togglePickedLetter(picked, token));
      setFeedback("");
      return;
    }
    const next = togglePickedLetter(picked, token);
    setPicked(next);
    const answer = next.map((item) => item.slice(item.indexOf(":") + 1)).join("");
    if (answer.length !== card.word.length) return;

    if (answer === card.word) {
      setFeedback("¡Muy bien!");
      setRevealed(true);
      const nextCorrect = cardHadMiss ? sessionCorrect : sessionCorrect + 1;
      setSessionCorrect(nextCorrect);
      persistSessionDraft({ sessionCorrect: nextCorrect });
      record(true);
      return;
    }

    setFeedback("Casi. Vamos otra vez.");
    setPicked([]);
    markSessionMissed();
    record(false);
  }

  function finishSession(baseProgress: ProfileProgress = progress, missedIds = sessionMissedIds, correctCount = sessionCorrect) {
    const evaluation = evaluateSession({
      totalWords: sessionWords.length,
      correctWords: correctCount,
      missedWordIds: missedIds,
    });
    setLastEvaluation(evaluation);

    if (evaluation.passed) {
      const completedLevels = baseProgress.completedLevels.includes(sessionLevel)
        ? baseProgress.completedLevels
        : [...baseProgress.completedLevels, sessionLevel];
      const currentLevel = sessionLevel >= 48 ? 48 : Math.max(baseProgress.currentLevel, sessionLevel + 1);
      persist({ ...baseProgress, completedLevels, currentLevel });
    }

    if (activeProfile) clearSessionDraft(activeProfile.id);
    setResumeDraft(null);
    setScreen("complete");
  }

  function nextCard() {
    if (index + 1 >= sessionWords.length) {
      finishSession();
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    persistSessionDraft({ index: nextIndex });
    resetCardState();
  }

  function practiceLater() {
    if (revealed) return;
    const missedIds = addMissedWord(sessionMissedIds, card.id);
    setSessionMissedIds(missedIds);
    const afterMiss = record(false);
    if (index + 1 >= sessionWords.length) {
      finishSession(afterMiss, missedIds, sessionCorrect);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    persistSessionDraft({ index: nextIndex, missedWordIds: missedIds });
    resetCardState();
  }

  function pronounce() {
    if (!revealed) return;
    void pronounceWord({ word: card.word, audioUrl: card.audioUrl, childAge: activeProfile?.age, locale: "es-419" });
  }

  function tryParentUnlock() {
    if (Number(parentAnswer) === parentChallenge.answer) {
      setParentUnlocked(true);
      setParentAnswer("");
      return;
    }
    setParentAnswer("");
    setParentChallenge(newParentChallenge());
  }

  if (screen === "profiles") {
    return (
      <main className="app-shell welcome-shell">
        <section className="welcome-card">
          <p className="eyebrow">Mi Mundo de Palabras</p>
          <h1>¿Quién va a aprender hoy?</h1>
          <p className="welcome-copy">Cada niño tiene su propio progreso, colección y ritmo.</p>
          <div className="profiles-grid">
            {profiles.map((profile) => (
              <button className="profile-card" key={profile.id} onClick={() => chooseProfile(profile)}>
                <span className="profile-avatar">{profile.avatar}</span>
                <strong>{profile.name}</strong>
                <span>{profile.age} años</span>
              </button>
            ))}
            <button className="profile-card add-profile" onClick={() => setScreen("create")}>
              <span className="profile-avatar">＋</span>
              <strong>Nuevo perfil</strong>
              <span>Agregar niño</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "create") {
    return (
      <main className="app-shell welcome-shell">
        <section className="welcome-card setup-card">
          <button className="text-button" onClick={() => setScreen("profiles")}>← Volver</button>
          <p className="eyebrow">Nuevo explorador</p>
          <h1>Crear perfil</h1>
          <label className="field-label">
            ¿Cómo se llama?
            <input className="name-input" value={draftName} maxLength={18} onChange={(event) => setDraftName(event.target.value)} placeholder="Nombre" autoFocus />
          </label>
          <fieldset className="setup-group">
            <legend>Elige su edad</legend>
            <div className="age-grid">
              {AGE_OPTIONS.map((age) => <button type="button" key={age} className={`age-button ${draftAge === age ? "is-selected" : ""}`} onClick={() => setDraftAge(age)}>{age}</button>)}
            </div>
          </fieldset>
          <fieldset className="setup-group">
            <legend>Región de español</legend>
            <div className="region-grid">
              {REGION_OPTIONS.map((region) => <button type="button" key={region.value} className={`region-button ${draftRegion === region.value ? "is-selected" : ""}`} onClick={() => setDraftRegion(region.value)}>{region.label}</button>)}
            </div>
          </fieldset>
          <fieldset className="setup-group">
            <legend>Elige un compañero</legend>
            <div className="avatar-grid">
              {AVATAR_OPTIONS.map((avatar) => <button type="button" key={avatar} className={`avatar-button ${draftAvatar === avatar ? "is-selected" : ""}`} onClick={() => setDraftAvatar(avatar)}>{avatar}</button>)}
            </div>
          </fieldset>
          <button className="primary wide-action" disabled={!draftName.trim()} onClick={addProfile}>Comenzar aventura</button>
        </section>
      </main>
    );
  }

  if (!activeProfile) {
    return (
      <main className="app-shell welcome-shell">
        <section className="welcome-card">
          <h1>Perfil no disponible</h1>
          <p className="welcome-copy">Vuelve a elegir un perfil para continuar.</p>
          <button className="primary" onClick={switchProfile}>Elegir perfil</button>
        </section>
      </main>
    );
  }

  if (screen === "stories" || (screen === "story" && (!selectedStory || storyMinimumLevel(selectedStory) > progress.currentLevel))) {
    return <StoryLibrary level={progress.currentLevel} onBack={() => setScreen("home")} onSelect={(story) => { setSelectedStory(story); setScreen("story"); }} />;
  }
  if (screen === "story" && selectedStory) {
    return <StoryReader key={activeProfile.id + selectedStory.id} story={selectedStory} onBack={() => setScreen("stories")} />;
  }

  const title = screen === "home"
    ? `¡Hola, ${activeProfile.name}!`
    : screen === "album"
      ? "Mi álbum"
      : screen === "themes"
        ? "Elige un mundo"
        : screen === "complete"
          ? "¡Sesión terminada!"
          : screen === "parent"
            ? "Área de adultos"
            : mode === "writing"
              ? "Ordena las letras"
              : mode === "mixed"
                ? "Modo mixto"
                : "Lee y descubre";

  const header = (
    <header className="topbar">
      <div>
        <p className="eyebrow">Mi Mundo de Palabras</p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <div className="level-pill">Nivel {progress.currentLevel}</div>
        <div className="star-counter"><span>⭐</span><strong>{progress.stars}</strong></div>
        <button className="mini-profile" onClick={switchProfile}>
          <span>{activeProfile.avatar}</span>
          <span><strong>{activeProfile.name}</strong><small>{activeProfile.age} años</small></span>
        </button>
      </div>
    </header>
  );

  if (screen === "home") {
    const collectionPercent = DEMO_WORDS.length ? (progress.discovered.filter((id) => DEMO_WORDS.some((word) => word.id === id)).length / DEMO_WORDS.length) * 100 : 0;
    return (
      <main className={`app-shell age-${ageBand(activeProfile.age)}`}>
        {header}
        {resumeDraft && (
          <button className="resume-session-card" onClick={() => void resumeSession()}>
            <span className="resume-icon">▶️</span>
            <span><strong>Continuar sesión</strong><small>Nivel {resumeDraft.level} · carta {resumeDraft.index + 1} de {resumeDraft.wordIds.length}</small></span>
            <span className="resume-arrow">→</span>
          </button>
        )}
        <section className="level-banner">
          <div><span>Etapa {levelInfo.stage} de 8</span><h2>{levelInfo.name}</h2><p>{levelInfo.skill}</p></div>
          <strong>{progress.completedLevels.length}/48</strong>
        </section>
        <section className="home-grid">
          <button className="mode-card stories-mode" onClick={() => setScreen("stories")}><span>📚</span><strong>Historias</strong><small>Lee, imagina y descubre valores</small></button>
          <button className="mode-card reading" onClick={() => chooseMode("reading")}><span>📖</span><strong>Leer</strong><small>Lee y descubre cartas</small></button>
          <button className="mode-card writing" onClick={() => chooseMode("writing")}><span>✏️</span><strong>Escribir</strong><small>Ordena las letras</small></button>
          <button className="mode-card mixed" onClick={() => chooseMode("mixed")}><span>🎲</span><strong>Mixto</strong><small>Combina los retos</small></button>
          <button className="mode-card album" onClick={() => setScreen("album")}><span>📚</span><strong>Mi álbum</strong><small>{progress.discovered.length} cartas descubiertas</small></button>
        </section>
        <section className="progress-summary">
          <strong>Tu colección</strong><span>{progress.discovered.filter((id) => DEMO_WORDS.some((word) => word.id === id)).length}/{DEMO_WORDS.length} cartas</span>
          <div className="progress-track"><div className="progress-value" style={{ width: `${collectionPercent}%` }} /></div>
        </section>
        <button className="parent-entry" onClick={() => { setParentChallenge(newParentChallenge()); setParentAnswer(""); setScreen("parent"); }}>🔒 Área de adultos</button>
      </main>
    );
  }

  if (screen === "themes") {
    const mixedCount = sessionCandidates().length;
    return (
      <main className={`app-shell age-${ageBand(activeProfile.age)}`}>
        {header}
        <button className="text-button" onClick={() => setScreen("home")}>← Inicio</button>
        {themeMessage && <p className="theme-message" role="status">{themeMessage}</p>}
        <section className="theme-grid">
          <button className="theme-card mixed-theme" disabled={!mixedCount} onClick={() => startSession()}>
            <span>🌈</span><strong>Todos mezclados</strong><small>{mixedCount ? `${mixedCount} cartas preparadas para tu nivel` : "Se desbloquea más adelante"}</small>
          </button>
          {LEARNING_WORLDS.map((world) => {
            const total = DEMO_WORDS.filter((word) => word.category === world.category).length;
            const eligible = total ? sessionCandidates(world.category).length : 0;
            return (
              <button
                className={`theme-card world-${world.id}`}
                key={world.id}
                disabled={!eligible}
                onClick={() => startSession(world.category)}
              >
                <span>{world.icon}</span>
                <strong>{world.name}</strong>
                <small>{eligible ? `${eligible} cartas para tu nivel` : total ? "Se desbloquea más adelante" : "Próximamente"}</small>
              </button>
            );
          })}
        </section>
      </main>
    );
  }

  if (screen === "album") {
    return (
      <main className={`app-shell age-${ageBand(activeProfile.age)}`}>
        {header}
        <button className="text-button" onClick={() => setScreen("home")}>← Inicio</button>
        <section className="album-grid">
          {runtimeWords.map((item) => {
            const known = progress.discovered.includes(item.id);
            const state = progress.words[item.id]?.mastery ?? "new";
            return (
              <article className={`album-card ${known ? "known" : "locked"} ${item.golden && known ? "golden" : ""}`} key={item.id}>
                {known ? <CardVisual card={item} className="album-visual" /> : <div className="album-visual">?</div>}
                <strong>{known ? item.word : "????"}</strong>
                <small>{known ? masteryLabel(state) : "Por descubrir"}</small>
              </article>
            );
          })}
        </section>
      </main>
    );
  }

  if (screen === "parent") {
    const wordStates = Object.values(progress.words);
    const mastered = wordStates.filter((word) => word.mastery === "mastered").length;
    const practicing = wordStates.filter((word) => word.mastery === "practicing").length;
    const mistakes = wordStates.reduce((sum, word) => sum + word.incorrectReads, 0);

    if (!parentUnlocked) {
      return (
        <main className={`app-shell age-${ageBand(activeProfile.age)}`}>
          {header}
          <button className="text-button" onClick={() => setScreen("home")}>← Inicio</button>
          <section className="parent-gate">
            <div className="lock-icon">🔐</div>
            <h2>Solo para adultos</h2>
            <p>Resuelve esta operación para continuar:</p>
            <label>
              {parentChallenge.left} + {parentChallenge.right} =
              <input value={parentAnswer} inputMode="numeric" onChange={(event) => setParentAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") tryParentUnlock(); }} />
            </label>
            <button className="primary" onClick={tryParentUnlock}>Entrar</button>
          </section>
        </main>
      );
    }

    return (
      <main className={`app-shell age-${ageBand(activeProfile.age)}`}>
        {header}
        <button className="text-button" onClick={() => setScreen("home")}>← Inicio</button>
        <section className="stats-grid">
          <article><span>🗺️</span><strong>{progress.currentLevel}</strong><small>nivel actual</small></article>
          <article><span>📚</span><strong>{progress.discovered.length}</strong><small>cartas descubiertas</small></article>
          <article><span>🏆</span><strong>{mastered}</strong><small>palabras dominadas</small></article>
          <article><span>🔁</span><strong>{practicing}</strong><small>en práctica</small></article>
          <article><span>⭐</span><strong>{progress.stars}</strong><small>estrellas</small></article>
          <article><span>🧩</span><strong>{mistakes}</strong><small>intentos a reforzar</small></article>
        </section>
        <section className="parent-details">
          <h2>Perfil</h2>
          <p><strong>Edad:</strong> {activeProfile.age} años</p>
          <p><strong>Región:</strong> {REGION_OPTIONS.find((region) => region.value === activeProfile.region)?.label ?? "Latinoamérica"}</p>
          <p><strong>Etapa:</strong> {levelInfo.stage}/8 — {levelInfo.name}</p>
          <p>Las palabras con más dificultad reciben prioridad automática en próximas sesiones.</p>
          <p><strong>Avance:</strong> se requiere al menos 80% de aciertos para desbloquear el siguiente nivel.</p>
        </section>
        <ParentDataControls />
      </main>
    );
  }

  if (screen === "complete") {
    const gained = progress.stars - sessionStartStars;
    const completed = getLevel(sessionLevel);
    const next = getLevel(Math.min(48, sessionLevel + 1));
    const evaluation = lastEvaluation ?? evaluateSession({ totalWords: sessionWords.length, correctWords: sessionCorrect, missedWordIds: sessionMissedIds });
    const percent = Math.round(evaluation.accuracy * 100);
    return (
      <main className={`app-shell age-${ageBand(activeProfile.age)}`}>
        {header}
        <section className={`completion-card ${evaluation.passed ? "passed" : "needs-practice"}`}>
          <div className="completion-burst">{evaluation.passed ? "🎉" : "🌱"}</div>
          <h2>{evaluation.passed ? `¡Nivel ${sessionLevel} superado!` : "¡Buen esfuerzo! Vamos a practicar un poco más"}</h2>
          <p>{completed.name}</p>
          <p>Acertaste <strong>{evaluation.correctWords} de {evaluation.totalWords}</strong> ({percent}%). Necesitas {evaluation.requiredCorrect} aciertos para avanzar.</p>
          <p>Ganaste <strong>{gained} ⭐</strong> en esta sesión.</p>
          {evaluation.passed && sessionLevel < 48 && <div className="next-level"><small>Siguiente</small><strong>Nivel {sessionLevel + 1}: {next.name}</strong></div>}
          {!evaluation.passed && <div className="next-level"><small>Repaso</small><strong>Las palabras difíciles tendrán prioridad en la próxima sesión.</strong></div>}
          <div className="completion-actions">
            <button className="secondary" onClick={() => setScreen("album")}>Ver álbum</button>
            {evaluation.passed
              ? <button className="primary" onClick={() => setScreen("home")}>Continuar</button>
              : <button className="primary" onClick={() => startSession(sessionCategory)}>Practicar de nuevo</button>}
          </div>
        </section>
      </main>
    );
  }

  const actualMode: LearningMode = mode === "mixed" ? (index % 2 === 0 ? "reading" : "writing") : mode;
  const currentWorld = worldForCategory(card.category);

  return (
    <main className={`app-shell age-${ageBand(activeProfile.age)}`}>
      {header}
      <button className="text-button" onClick={() => { persistSessionDraft(); setScreen("home"); }}>← Salir de la sesión</button>
      <section className="lesson" aria-live="polite">
        <div className="lesson-meta">
          <span>{currentWorld?.icon ?? "✨"} {currentWorld?.name ?? card.category} · Nivel {sessionLevel}</span>
          <span>Carta {index + 1} de {sessionWords.length}</span>
        </div>
        <div className="progress-track"><div className="progress-value" style={{ width: `${roundProgress * 100}%` }} /></div>
        <article className={`word-card ${revealed ? "is-revealed" : ""} ${card.golden ? "is-golden" : ""}`}>
          {actualMode === "reading" && <div className="word-title">{card.word}</div>}
          <div className="reveal-stage">
            {actualMode === "writing" && !revealed ? (
              <div className="writing-stage">
                <CardVisual card={card} className="visual preview" />
                <div className="answer-slots">{card.word.split("").map((_, position) => <span key={position}>{picked[position]?.slice(picked[position].indexOf(":") + 1) ?? "_"}</span>)}</div>
                <div className="letter-bank">
                  {letters.map(({ letter, index: originalIndex }) => {
                    const token = `${originalIndex}:${letter}`;
                    const used = picked.includes(token);
                    return <button key={token} className={used ? "is-used" : ""} aria-pressed={used} aria-label={used ? `Devolver ${letter}` : `Usar ${letter}`} onClick={() => pickLetter(letter, originalIndex)}>{letter}</button>;
                  })}
                </div>
                {feedback && <p className="success">{feedback}</p>}
              </div>
            ) : !revealed ? (
              <div className="mystery"><span className="question">?</span><p>Lee la palabra primero</p></div>
            ) : (
              <div className="discovered">
                <CardVisual card={card} />
                <p className="success">¡Descubierta!</p>
                <p className="syllables">{card.syllables.join(" · ")}</p>
                {particles.map((particle) => <span className="particle" key={particle} style={{ "--i": particle } as React.CSSProperties}>★</span>)}
              </div>
            )}
          </div>
          <div className="actions">
            {!revealed && actualMode === "reading" ? (
              <>
                <button className="secondary" onClick={practiceLater}>↻ Necesita práctica</button>
                <button className="primary" onClick={discover}>✓ La leyó · Descubrir</button>
              </>
            ) : revealed ? (
              <>
                <button className="secondary" onClick={pronounce}>🔊 Escuchar</button>
                <button className="primary" onClick={nextCard}>{index + 1 === sessionWords.length ? "Terminar" : "Siguiente"}</button>
              </>
            ) : null}
          </div>
        </article>
        <p className="helper">{actualMode === "reading" ? "El adulto confirma si la leyó bien. Si necesita práctica, la carta no se revela y volverá a aparecer." : "Toca las letras en el orden correcto. Si te equivocas, toca de nuevo la letra transparente para devolverla."}</p>
      </section>
    </main>
  );
}

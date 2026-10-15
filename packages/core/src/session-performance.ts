export interface SessionPerformance {
  totalWords: number;
  correctWords: number;
  missedWordIds: string[];
}

export interface SessionEvaluation {
  passed: boolean;
  accuracy: number;
  requiredCorrect: number;
  correctWords: number;
  totalWords: number;
}

/**
 * V1 progression rule approved for Mi Mundo de Palabras:
 * a level advances only when at least 80% of the session words were solved
 * without being marked for practice during that session.
 */
export function evaluateSession(performance: SessionPerformance, passRatio = 0.8): SessionEvaluation {
  const totalWords = Math.max(0, Math.floor(performance.totalWords));
  const correctWords = Math.max(0, Math.min(totalWords, Math.floor(performance.correctWords)));
  const requiredCorrect = totalWords === 0 ? 0 : Math.ceil(totalWords * passRatio);
  const accuracy = totalWords === 0 ? 0 : correctWords / totalWords;
  return {
    passed: totalWords > 0 && correctWords >= requiredCorrect,
    accuracy,
    requiredCorrect,
    correctWords,
    totalWords,
  };
}

export function addMissedWord(missedWordIds: string[], wordId: string): string[] {
  return missedWordIds.includes(wordId) ? missedWordIds : [...missedWordIds, wordId];
}

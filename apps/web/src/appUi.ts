export interface LetterToken {
  letter: string;
  index: number;
}

function seedFromWord(word: string) {
  let hash = 2166136261;
  for (const char of word) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextRandom(state: number) {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

export function shuffledLetterTokens(word: string): LetterToken[] {
  const original = [...word].map((letter, index) => ({ letter, index }));
  const result = original.map((token) => ({ ...token }));
  let state = seedFromWord(word);

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = nextRandom(state);
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  const display = result.map((token) => token.letter).join("");
  const canLookDifferent = new Set([...word]).size > 1;
  if (result.length > 1 && canLookDifferent && display === word) {
    result.push(result.shift()!);
    if (result.map((token) => token.letter).join("") === word) {
      [result[0], result[1]] = [result[1], result[0]];
    }
  }

  return result;
}

export type AppScreen = "profiles" | "create" | "home" | "themes" | "play" | "album" | "complete" | "parent";

export function backTargetForScreen(screen: AppScreen): AppScreen {
  switch (screen) {
    case "create": return "profiles";
    case "home": return "profiles";
    case "themes": return "home";
    case "play": return "themes";
    case "album": return "home";
    case "complete": return "home";
    case "parent": return "home";
    case "profiles":
    default:
      return "profiles";
  }
}

export function togglePickedLetter(picked: string[], token: string): string[] {
  return picked.includes(token) ? picked.filter((item) => item !== token) : [...picked, token];
}

export interface ParentChallenge {
  left: number;
  right: number;
  answer: number;
}

export function newParentChallenge(): ParentChallenge {
  const left = 4 + Math.floor(Math.random() * 6);
  const right = 3 + Math.floor(Math.random() * 7);
  return { left, right, answer: left + right };
}

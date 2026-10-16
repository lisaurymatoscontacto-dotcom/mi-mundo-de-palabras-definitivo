import { TRANSITION_CHAPTER_ONE_CARDS } from "./transition-chapter-one";
import { TRANSITION_BLOCK_TWO_CARDS } from "./transition-chapter-block-two";
import { TRANSITION_BLOCK_THREE_CARDS } from "./transition-chapter-block-three";
import { TRANSITION_BLOCK_FOUR_CARDS } from "./transition-chapter-block-four";
import { TRANSITION_BLOCK_FIVE_CARDS } from "./transition-chapter-block-five";
import { TRANSITION_BLOCK_SIX_CARDS } from "./transition-chapter-block-six";
import { TRANSITION_BLOCK_SEVEN_CARDS } from "./transition-chapter-block-seven";

/**
 * Explicitly curated transition cards that may participate in the publish
 * pipeline. Candidate-bank concepts never become runtime cards merely by being
 * present in the 4,200-position research bank.
 */
export const PUBLISHED_TRANSITION_CARDS = [
  ...TRANSITION_CHAPTER_ONE_CARDS,
  ...TRANSITION_BLOCK_TWO_CARDS,
  ...TRANSITION_BLOCK_THREE_CARDS,
  ...TRANSITION_BLOCK_FOUR_CARDS,
  ...TRANSITION_BLOCK_FIVE_CARDS,
  ...TRANSITION_BLOCK_SIX_CARDS,
  ...TRANSITION_BLOCK_SEVEN_CARDS,
];

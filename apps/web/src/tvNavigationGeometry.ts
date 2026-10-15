export type NavDirection = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

export interface NavPoint {
  x: number;
  y: number;
}

export interface NavCandidate<T> {
  item: T;
  point: NavPoint;
}

function directionVector(direction: NavDirection) {
  if (direction === "ArrowRight") return { x: 1, y: 0 };
  if (direction === "ArrowLeft") return { x: -1, y: 0 };
  if (direction === "ArrowDown") return { x: 0, y: 1 };
  return { x: 0, y: -1 };
}

export function pickSpatialTarget<T>(
  from: NavPoint,
  direction: NavDirection,
  candidates: NavCandidate<T>[],
): T | null {
  const axis = directionVector(direction);

  const ranked = candidates
    .map(({ item, point }) => {
      const dx = point.x - from.x;
      const dy = point.y - from.y;
      const primary = dx * axis.x + dy * axis.y;
      if (primary <= 8) return null;

      const perpendicular = Math.abs(dx * axis.y - dy * axis.x);
      const distance = Math.hypot(dx, dy);
      const anglePenalty = perpendicular / Math.max(primary, 1);

      // Prefer controls clearly in the requested direction and then nearby ones.
      // The angle penalty prevents diagonal jumps across grids when a same-row/column target exists.
      const score = primary + perpendicular * 2.6 + anglePenalty * 140 + distance * 0.05;
      return { item, score, primary, perpendicular };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.score - b.score || a.primary - b.primary || a.perpendicular - b.perpendicular);

  return ranked[0]?.item ?? null;
}

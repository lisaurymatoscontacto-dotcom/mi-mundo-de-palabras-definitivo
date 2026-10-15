import { pickSpatialTarget, type NavDirection } from "./tvNavigationGeometry";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
const ARROWS: NavDirection[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

function center(element: Element) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function visibleFocusableItems() {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((item) => {
    const rect = item.getBoundingClientRect();
    const style = window.getComputedStyle(item);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  });
}

function focusItem(item: HTMLElement) {
  item.focus({ preventScroll: true });
  item.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
}

export function enableTvNavigation() {
  function onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === "Escape" || event.key === "BrowserBack") { event.preventDefault(); window.history.back(); return; }
    if (!ARROWS.includes(event.key as NavDirection)) return;
    const editing = document.activeElement;
    if (editing instanceof HTMLSelectElement || editing instanceof HTMLTextAreaElement ||
      (editing instanceof HTMLElement && editing.isContentEditable) ||
      (editing instanceof HTMLInputElement && ["ArrowLeft", "ArrowRight"].includes(event.key))) return;
    const direction = event.key as NavDirection;
    const items = visibleFocusableItems();
    if (!items.length) return;

    const active = document.activeElement instanceof HTMLElement && items.includes(document.activeElement)
      ? document.activeElement
      : null;

    if (!active) {
      event.preventDefault();
      focusItem(items[0]);
      return;
    }

    const from = center(active);
    const target = pickSpatialTarget(
      from,
      direction,
      items
        .filter((item) => item !== active)
        .map((item) => ({ item, point: center(item) })),
    );

    if (!target) return;
    event.preventDefault();
    focusItem(target);
  }

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}

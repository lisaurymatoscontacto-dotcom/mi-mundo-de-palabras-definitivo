import type { WordCard } from "@mmdp/core";
import { bundledEmojiUrl } from "./emojiAssets";
import "./card-media.css";

interface CardVisualProps {
  card: WordCard;
  className?: string;
}

function localEmojiArtwork(card: WordCard) {
  if (card.visualKind !== "emoji") return undefined;
  if (/^\/(?!\/)/.test(card.visual) || /\.svg(?:[?#].*)?$/i.test(card.visual)) return card.visual;
  return bundledEmojiUrl(card.visual);
}

export function CardVisual({ card, className = "visual" }: CardVisualProps) {
  const bundledEmoji = localEmojiArtwork(card);
  if (bundledEmoji) {
    return (
      <div className={`${className} card-visual-image-wrap card-visual-emoji`}>
        <img
          className="card-visual-image"
          src={bundledEmoji}
          alt={card.word.toLocaleLowerCase("es")}
          draggable={false}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  if (card.visualKind === "image" || card.visualKind === "photo") {
    const mediaClass = card.visualKind === "photo" ? "card-visual-photo" : "card-visual-illustration";
    return (
      <div className={`${className} card-visual-image-wrap ${mediaClass}`}>
        <img
          className="card-visual-image"
          src={card.visual}
          alt={card.word.toLocaleLowerCase("es")}
          draggable={false}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return <div className={className} role="img" aria-label={card.word}>{card.visual}</div>;
}

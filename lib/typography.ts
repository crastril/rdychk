import type { CSSProperties } from "react";

/**
 * Système typographique centralisé — page de groupe (rdychk).
 *
 * Source unique de vérité pour l'échelle typographique des deux thèmes
 * (neo-brutalist in-person / cyberpunk remote). Renvoie UNIQUEMENT la
 * typographie structurelle (famille, taille, poids, transform, letterSpacing).
 * La couleur reste à la charge de l'appelant car elle est contextuelle
 * (états actif/inactif, couleurs de score, etc.).
 *
 * Usage : style={{ ...typo("t2", isRemote), color: "#fff" }}
 *
 * Échelle (rôle → taille px) :
 *   titre 28 · t1 20 · t2 16 · t3 12 · paragraphe 14 · legende 11
 */

export type TypoRole = "titre" | "t1" | "t2" | "t3" | "paragraphe" | "legende";

const NEO_FONT = "var(--font-barlow-condensed)";
const CYBER_FONT = "var(--font-geist-mono), monospace";

// Échelle commune (px) — une seule source de vérité
const SIZE: Record<TypoRole, number> = {
  titre: 28,
  t1: 20,
  t2: 16,
  t3: 12,
  paragraphe: 14,
  legende: 11,
};

// Neo-brutalist : Barlow Condensed 900, uppercase pour titres/labels
const NEO: Record<TypoRole, CSSProperties> = {
  titre: { fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" },
  t1: { fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.01em" },
  t2: { fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" },
  t3: { fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em" },
  paragraphe: { fontWeight: 700, textTransform: "none", letterSpacing: "normal" },
  legende: { fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em" },
};

// Cyberpunk : monospace, uppercase pour titres/labels, paragraphe en casse normale
const CYBER: Record<TypoRole, CSSProperties> = {
  titre: { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" },
  t1: { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" },
  t2: { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" },
  t3: { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" },
  paragraphe: { fontWeight: 400, textTransform: "none", letterSpacing: "normal" },
  legende: { fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.15em" },
};

export function typo(role: TypoRole, isRemote: boolean): CSSProperties {
  return {
    fontFamily: isRemote ? CYBER_FONT : NEO_FONT,
    fontSize: SIZE[role],
    ...(isRemote ? CYBER[role] : NEO[role]),
  };
}

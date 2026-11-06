/**
 * Geografia de Florais — reconstruída a partir de resposta_parte1.png /
 * resposta_parte2.png (interativa198.zip). Coordenadas = pixels do gabarito
 * original, recortados no viewBox abaixo. Todas as cenas usam este sistema.
 */
export const VIEWBOX = { x: 160, y: 100, w: 640, h: 410 };

export interface Road {
  id: string;
  name: string | null;
  /** faixa ocupada pela via (bordas) */
  a: number;
  b: number;
}

/** Vias verticais, da esquerda para a direita (bordas x medidas no original). */
export const COLS: Road[] = [
  { id: "c0", name: null, a: 160, b: 169 },
  { id: "violeta", name: "Rua Violeta", a: 179, b: 199 },
  { id: "dalia", name: "Rua Dália", a: 275, b: 294 },
  { id: "rosa", name: "Rua Rosa", a: 370, b: 390 },
  { id: "cravo", name: "Avenida Cravo", a: 465, b: 484 },
  { id: "hortensia", name: "Rua Hortênsia", a: 550, b: 570 },
  { id: "tulipa", name: "Rua Tulipa", a: 636, b: 655 },
  { id: "gardenia", name: "Avenida Gardênia", a: 723, b: 742 },
  { id: "c8", name: null, a: 788, b: 800 },
];

/** Vias horizontais, de cima para baixo (bordas y medidas no original). */
export const ROWS: Road[] = [
  { id: "r0", name: null, a: 100, b: 108 },
  { id: "copo", name: "Avenida Copo-de-Leite", a: 128, b: 150 },
  { id: "jasmim", name: "Rua Jasmim", a: 207, b: 228 },
  { id: "girassol", name: "Rua Girassol", a: 269, b: 285 },
  { id: "margarida", name: "Rua Margarida", a: 337, b: 360 },
  { id: "amor", name: "Avenida Amor-Perfeito", a: 417, b: 438 },
  { id: "alecrim", name: "Rua Alecrim", a: 467, b: 483 },
  { id: "r7", name: null, a: 504, b: 510 },
];

export const mid = (r: Road) => (r.a + r.b) / 2;

/**
 * A Rua Tulipa não chega à Av. Copo-de-Leite: termina num beco sem saída
 * dentro da quadra (y≈178 → Rua Jasmim). O "final da Rua Tulipa" é esse ponto.
 */
export const TULIPA_STUB = { x: 645.5, yTop: 176 };

/** Rótulos de rua (texto SVG). */
export const LABELS: { text: string; x: number; y: number; vertical?: boolean }[] = [
  { text: "Avenida Copo-de-Leite", x: 600, y: 139 },
  { text: "Rua Jasmim", x: 245, y: 217.5 },
  { text: "Rua Girassol", x: 237, y: 277 },
  { text: "Rua Margarida", x: 330, y: 348.5 },
  { text: "Avenida Amor-Perfeito", x: 240, y: 427.5 },
  { text: "Rua Alecrim", x: 420, y: 475 },
  { text: "Rua Violeta", x: 189, y: 315, vertical: true },
  { text: "Rua Dália", x: 284.5, y: 172, vertical: true },
  { text: "Rua Rosa", x: 380, y: 248, vertical: true },
  { text: "Avenida Cravo", x: 474.5, y: 390, vertical: true },
  { text: "Rua Hortênsia", x: 560, y: 312, vertical: true },
  { text: "Rua Tulipa", x: 645.5, y: 385, vertical: true },
  { text: "Avenida Gardênia", x: 732.5, y: 310, vertical: true },
];

export type RefIcon = "aeroporto" | "prefeitura" | "restaurante" | "padaria" | "hospital";

/** Pontos fixos de referência (posições de index_mapa.jpg convertidas). */
export const REFERENCES: { id: RefIcon; label: string; x: number; y: number }[] = [
  { id: "aeroporto", label: "Aeroporto", x: 427, y: 178 },
  { id: "prefeitura", label: "Prefeitura", x: 517, y: 248 },
  { id: "restaurante", label: "Restaurante", x: 689, y: 311 },
  { id: "padaria", label: "Padaria", x: 427, y: 388 },
  { id: "hospital", label: "Hospital", x: 603, y: 452 },
];

/** Quadras (retângulos entre as vias). Tulipa não corta a 1ª fileira entre Hortênsia e Gardênia. */
export function buildBlocks() {
  const blocks: { x: number; y: number; w: number; h: number }[] = [];
  for (let j = 0; j < ROWS.length - 1; j++) {
    for (let i = 0; i < COLS.length - 1; i++) {
      const c = COLS[i]!, c1 = COLS[i + 1]!, r = ROWS[j]!, r1 = ROWS[j + 1]!;
      const x0 = c.b;
      let x1 = c1.a;
      if (j === 1 && c.id === "tulipa") continue;
      if (j === 1 && c1.id === "tulipa") x1 = COLS[i + 2]!.a;
      blocks.push({ x: x0, y: r.b, w: x1 - x0, h: r1.a - r.b });
    }
  }
  return blocks;
}

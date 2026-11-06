import casaNina from "@/assets/marcadores/casa-nina.png.asset.json";
import casaBia from "@/assets/marcadores/casa-bia.png.asset.json";
import casaHelena from "@/assets/marcadores/casa-helena.png.asset.json";
import casaDavi from "@/assets/marcadores/casa-davi.png.asset.json";
import casaCaio from "@/assets/marcadores/casa-caio.png.asset.json";
import escola from "@/assets/marcadores/escola.png.asset.json";
import igreja from "@/assets/marcadores/igreja.png.asset.json";
import parque from "@/assets/marcadores/parque.png.asset.json";
import mercado from "@/assets/marcadores/mercado.png.asset.json";
import shopping from "@/assets/marcadores/shopping.png.asset.json";
import sorveteria from "@/assets/marcadores/sorveteria.png.asset.json";
import { COLS, ROWS } from "./mapData";

export type Phase = "houses" | "city";

export interface Target {
  id: string;
  phase: Phase;
  /** centro do alvo (gabarito original) */
  x: number;
  y: number;
  /** quando presente, a validação é por área (quadra) e não por raio */
  rect?: { x0: number; y0: number; x1: number; y1: number };
  /** quando presente, é onde o marcador aparece depois do acerto (pode diferir do ponto de validação) */
  display?: { x: number; y: number };
}

/** Quadra do parque: leste da Rua Rosa, oeste da Av. Cravo, sul da Rua Girassol, norte da Rua Margarida. */
export const PARQUE_RECT = {
  x0: COLS.find((r) => r.id === "rosa")!.b,
  x1: COLS.find((r) => r.id === "cravo")!.a,
  y0: ROWS.find((r) => r.id === "girassol")!.b,
  y1: ROWS.find((r) => r.id === "margarida")!.a,
};

export interface Marker {
  id: string;
  label: string;
  img: string;
  targetId: string;
  phase: Phase;
  /** proporção largura/altura da ilustração (sem as margens transparentes) */
  aspect: number;
}

/**
 * Posição de exibição do parque. A casa do Davi fica dentro dessa mesma quadra,
 * então o marcador é mostrado no lado oeste dela — longe o bastante para não
 * encobrir a casa, mas ainda dentro da quadra validada.
 */
export const PARQUE_DISPLAY = { x: 398, y: 311 };

/** 11 alvos — centros conferidos sobre resposta_parte1.png e resposta_parte2.png. */
export const TARGETS: Target[] = [
  { id: "t-nina", phase: "houses", x: 646, y: 190 },
  { id: "t-bia", phase: "houses", x: 702, y: 172 },
  { id: "t-helena", phase: "houses", x: 220, y: 180 },
  { id: "t-davi", phase: "houses", x: 446, y: 321 },
  { id: "t-caio", phase: "houses", x: 536, y: 452 },
  { id: "t-escola", phase: "houses", x: 334, y: 391 },
  { id: "t-igreja", phase: "city", x: 603, y: 394 },
  { id: "t-parque", phase: "city", x: (PARQUE_RECT.x0 + PARQUE_RECT.x1) / 2, y: (PARQUE_RECT.y0 + PARQUE_RECT.y1) / 2, rect: PARQUE_RECT, display: PARQUE_DISPLAY },
  { id: "t-mercado", phase: "city", x: 610, y: 307 },
  { id: "t-shopping", phase: "city", x: 342, y: 185 },
  { id: "t-sorveteria", phase: "city", x: 516, y: 172 },
];

export const MARKERS: Marker[] = [
  { id: "nina", label: "Casa da Nina", img: casaNina.url, targetId: "t-nina", phase: "houses", aspect: 265 / 395 },
  { id: "bia", label: "Casa da Bia", img: casaBia.url, targetId: "t-bia", phase: "houses", aspect: 267 / 351 },
  { id: "helena", label: "Casa da Helena", img: casaHelena.url, targetId: "t-helena", phase: "houses", aspect: 253 / 363 },
  { id: "davi", label: "Casa do Davi", img: casaDavi.url, targetId: "t-davi", phase: "houses", aspect: 250 / 351 },
  { id: "caio", label: "Casa do Caio", img: casaCaio.url, targetId: "t-caio", phase: "houses", aspect: 268 / 361 },
  { id: "escola", label: "Escola", img: escola.url, targetId: "t-escola", phase: "houses", aspect: 317 / 379 },
  { id: "igreja", label: "Igreja", img: igreja.url, targetId: "t-igreja", phase: "city", aspect: 305 / 420 },
  { id: "parque", label: "Parque", img: parque.url, targetId: "t-parque", phase: "city", aspect: 324 / 405 },
  { id: "mercado", label: "Mercado", img: mercado.url, targetId: "t-mercado", phase: "city", aspect: 325 / 389 },
  { id: "shopping", label: "Shopping", img: shopping.url, targetId: "t-shopping", phase: "city", aspect: 323 / 387 },
  { id: "sorveteria", label: "Sorveteria", img: sorveteria.url, targetId: "t-sorveteria", phase: "city", aspect: 341 / 408 },
];

/** Raio (unidades do viewBox) para considerar que um marcador caiu num alvo. */
export const TARGET_RADIUS = 26;

/** Caixa do marcador no mapa (unidades do viewBox) — altura fixa; a largura respeita a proporção de cada ilustração. */
export const MARKER_BOX = { w: 46, h: 57.5 };

/** Tamanho de desenho do marcador no mapa: altura fixa, largura pela proporção da imagem. */
export const markerSize = (id: string) => ({ w: MARKER_BOX.h * markerById(id).aspect, h: MARKER_BOX.h });

/** Onde o marcador é desenhado: pode diferir do ponto usado na validação. */
export const displayOf = (t: Target) => t.display ?? { x: t.x, y: t.y };

export const markersOf = (phase: Phase) => MARKERS.filter((m) => m.phase === phase);
export const targetById = (id: string) => TARGETS.find((t) => t.id === id)!;
export const markerById = (id: string) => MARKERS.find((m) => m.id === id)!;

/** Alvo mais próximo da fase indicada, dentro do raio; nunca devolve alvo de outra fase. */
export function targetAt(x: number, y: number, phase: Phase): string | null {
  let best: string | null = null;
  let bestD = TARGET_RADIUS;
  for (const t of TARGETS) {
    if (t.phase !== phase) continue;
    if (t.rect) {
      if (x >= t.rect.x0 && x <= t.rect.x1 && y >= t.rect.y0 && y <= t.rect.y1) return t.id;
      continue;
    }
    const d = Math.hypot(t.x - x, t.y - y);
    if (d <= bestD) {
      bestD = d;
      best = t.id;
    }
  }
  return best;
}

export interface PlacementResult {
  correct: string[];
  wrong: string[];
  missing: string[];
}

/** placements: markerId -> targetId (null = colocado fora de qualquer alvo; ausente = no banco). */
export function validatePlacement(
  markerIds: string[],
  placements: Record<string, string | null | undefined>,
): PlacementResult {
  const r: PlacementResult = { correct: [], wrong: [], missing: [] };
  for (const id of markerIds) {
    if (!(id in placements) || placements[id] === undefined) r.missing.push(id);
    else if (placements[id] === markerById(id).targetId) r.correct.push(id);
    else r.wrong.push(id);
  }
  return r;
}

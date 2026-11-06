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
}

/** 11 alvos — centros conferidos sobre resposta_parte1.png e resposta_parte2.png. */
export const TARGETS: Target[] = [
  { id: "t-nina", phase: "houses", x: 646, y: 190 },
  { id: "t-bia", phase: "houses", x: 702, y: 172 },
  { id: "t-helena", phase: "houses", x: 220, y: 180 },
  { id: "t-davi", phase: "houses", x: 446, y: 321 },
  { id: "t-caio", phase: "houses", x: 536, y: 452 },
  { id: "t-escola", phase: "houses", x: 334, y: 391 },
  { id: "t-igreja", phase: "city", x: 603, y: 394 },
  { id: "t-parque", phase: "city", x: (PARQUE_RECT.x0 + PARQUE_RECT.x1) / 2, y: (PARQUE_RECT.y0 + PARQUE_RECT.y1) / 2, rect: PARQUE_RECT },
  { id: "t-mercado", phase: "city", x: 610, y: 307 },
  { id: "t-shopping", phase: "city", x: 342, y: 185 },
  { id: "t-sorveteria", phase: "city", x: 516, y: 172 },
];

export const MARKERS: Marker[] = [
  { id: "nina", label: "Casa da Nina", img: casaNina.url, targetId: "t-nina", phase: "houses" },
  { id: "bia", label: "Casa da Bia", img: casaBia.url, targetId: "t-bia", phase: "houses" },
  { id: "helena", label: "Casa da Helena", img: casaHelena.url, targetId: "t-helena", phase: "houses" },
  { id: "davi", label: "Casa do Davi", img: casaDavi.url, targetId: "t-davi", phase: "houses" },
  { id: "caio", label: "Casa do Caio", img: casaCaio.url, targetId: "t-caio", phase: "houses" },
  { id: "escola", label: "Escola", img: escola.url, targetId: "t-escola", phase: "houses" },
  { id: "igreja", label: "Igreja", img: igreja.url, targetId: "t-igreja", phase: "city" },
  { id: "parque", label: "Parque", img: parque.url, targetId: "t-parque", phase: "city" },
  { id: "mercado", label: "Mercado", img: mercado.url, targetId: "t-mercado", phase: "city" },
  { id: "shopping", label: "Shopping", img: shopping.url, targetId: "t-shopping", phase: "city" },
  { id: "sorveteria", label: "Sorveteria", img: sorveteria.url, targetId: "t-sorveteria", phase: "city" },
];

/** Raio (unidades do viewBox) para considerar que um marcador caiu num alvo. */
export const TARGET_RADIUS = 26;

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

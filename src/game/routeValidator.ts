import { GRAPH_NODES, ROUTE_ORDER, START_NODE, isAdjacent } from "./mapGraph";

export type RouteError =
  | { type: "empty" }
  | { type: "start" }
  | { type: "disconnected"; at: number }
  | { type: "order"; met: string; expected: string }
  | { type: "missingFriend"; expected: string }
  | { type: "notAtSchool" };

export interface RouteResult {
  ok: boolean;
  error: RouteError | null;
  /** quantos destinos da sequência já foram cumpridos (inclui a Nina no início) */
  reached: number;
  /** próximo destino (markerId) ou null se tudo cumprido */
  next: string | null;
}

/**
 * Valida uma rota (lista de IDs de nós). Regras:
 * - começa na casa da Nina; cada passo liga nós adjacentes no grafo;
 * - os acessos visitados seguem Nina → Bia → Helena → Davi → Caio → Escola
 *   (passar por um amigo ainda não devido é erro de ordem; repassar por quem já foi encontrado é permitido);
 * - termina na escola. Não exige o menor caminho; ciclos são permitidos.
 */
export function validateRoute(route: string[]): RouteResult {
  if (route.length === 0) return { ok: false, error: { type: "empty" }, reached: 0, next: "nina" };
  if (route[0] !== START_NODE) return { ok: false, error: { type: "start" }, reached: 0, next: "nina" };

  let reached = 1;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!, b = route[i]!;
    if (!isAdjacent(a, b)) {
      return { ok: false, error: { type: "disconnected", at: i }, reached, next: ROUTE_ORDER[reached] ?? null };
    }
    const acc = GRAPH_NODES[b]?.access;
    if (!acc) continue;
    const idx = ROUTE_ORDER.indexOf(acc as (typeof ROUTE_ORDER)[number]);
    if (idx === reached) reached++;
    else if (idx > reached) {
      return {
        ok: false,
        error: { type: "order", met: acc, expected: ROUTE_ORDER[reached]! },
        reached,
        next: ROUTE_ORDER[reached] ?? null,
      };
    }
  }

  const next = ROUTE_ORDER[reached] ?? null;
  if (next && next !== "escola") return { ok: false, error: { type: "missingFriend", expected: next }, reached, next };
  if (next === "escola") return { ok: false, error: { type: "notAtSchool" }, reached, next };
  // Tudo cumprido: precisa terminar exatamente na escola.
  const last = GRAPH_NODES[route[route.length - 1]!];
  if (last?.access !== "escola") return { ok: false, error: { type: "notAtSchool" }, reached, next: null };
  return { ok: true, error: null, reached, next: null };
}

const NAMES: Record<string, string> = {
  nina: "a Nina", bia: "a Bia", helena: "a Helena", davi: "o Davi", caio: "o Caio", escola: "a escola",
};

const DE: Record<string, string> = {
  nina: "da Nina", bia: "da Bia", helena: "da Helena", davi: "do Davi", caio: "do Caio", escola: "da escola",
};

export function routeMessage(r: RouteResult): string {
  if (r.ok) return "Conseguimos! Você encontrou um caminho pelas ruas e passamos nas casas de todos os amigos antes de chegar à escola!";
  const e = r.error!;
  switch (e.type) {
    case "empty":
    case "start":
      return "O trajeto precisa começar na casa da Nina.";
    case "disconnected":
      return "Há um trecho em que as ruas não estão ligadas. Siga sempre por ruas conectadas.";
    case "order":
      return e.met === "escola"
        ? `Ainda não é hora da escola! Antes, precisamos buscar ${NAMES[e.expected]}.`
        : `Opa! Passamos pela casa ${DE[e.met]} antes da hora. Agora devemos buscar ${NAMES[e.expected]}.`;
    case "missingFriend":
      return `Falta buscar ${NAMES[e.expected]}. Continue o caminho!`;
    case "notAtSchool":
      return "Já encontramos todos os amigos. Falta chegar à escola!";
  }
}

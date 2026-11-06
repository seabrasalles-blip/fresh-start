import { GRAPH_NODES, ROUTE_ORDER, accessNodeOf, neighbors, node } from "./mapGraph";

/**
 * Distância percorrida. O mapa não tem escala, então as medidas são sempre
 * "unidades do mapa" — nunca metros ou quilômetros.
 */
export const edgeLength = (a: string, b: string) => Math.hypot(node(a).x - node(b).x, node(a).y - node(b).y);

/** Comprimento total de uma rota: soma de todos os trechos percorridos. */
export function routeLength(route: string[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += edgeLength(route[i - 1]!, route[i]!);
  return total;
}

/**
 * Dijkstra com peso = comprimento geométrico do trecho.
 * `blocked` são nós que não podem ser pisados (serve para não encontrar
 * um amigo antes da hora).
 */
export function shortestDistance(
  from: string,
  to: string,
  blocked: Set<string> = new Set(),
): { path: string[]; distance: number } | null {
  if (blocked.has(from) || blocked.has(to)) return null;
  const dist: Record<string, number> = { [from]: 0 };
  const prev: Record<string, string | null> = { [from]: null };
  const done = new Set<string>();
  for (;;) {
    let cur: string | null = null;
    let best = Infinity;
    for (const id of Object.keys(GRAPH_NODES)) {
      if (done.has(id) || blocked.has(id)) continue;
      const d = dist[id] ?? Infinity;
      if (d < best) {
        best = d;
        cur = id;
      }
    }
    if (!cur || cur === to) break;
    done.add(cur);
    for (const n of neighbors(cur)) {
      if (done.has(n) || blocked.has(n)) continue;
      const nd = best + edgeLength(cur, n);
      if (nd < (dist[n] ?? Infinity)) {
        dist[n] = nd;
        prev[n] = cur;
      }
    }
  }
  if (!(to in dist)) return null;
  const path: string[] = [];
  for (let c: string | null | undefined = to; c; c = prev[c]) path.unshift(c);
  return { path, distance: dist[to]! };
}

/**
 * Menor caminho possível cumprindo a ordem Nina → Bia → Helena → Davi → Caio → Escola.
 * Cada trecho evita os amigos que ainda não são a vez deles, então a rota
 * completa é sempre válida pela regra da atividade.
 */
export function shortestRoute(order: readonly string[] = ROUTE_ORDER): { path: string[]; distance: number } {
  const path = [accessNodeOf(order[0]!)];
  let distance = 0;
  for (let i = 1; i < order.length; i++) {
    const blocked = new Set(order.slice(i + 1).map(accessNodeOf));
    const seg = shortestDistance(accessNodeOf(order[i - 1]!), accessNodeOf(order[i]!), blocked);
    if (!seg) throw new Error(`sem caminho entre ${order[i - 1]} e ${order[i]}`);
    distance += seg.distance;
    path.push(...seg.path.slice(1));
  }
  return { path, distance };
}

export const minimumRouteLength = (order: readonly string[] = ROUTE_ORDER) => shortestRoute(order).distance;

/** Só vale oferecer o desafio se der para encurtar mais de 5% do caminho. */
export const SHORTER_MARGIN = 0.05;

export function canGoMuchShorter(length: number, minimum: number): boolean {
  return length - minimum > minimum * SHORTER_MARGIN;
}

/** Compara duas tentativas do aluno (0,5% de tolerância para chamar de igual). */
export function compareRoutes(first: number, second: number): "shorter" | "longer" | "same" {
  const tol = Math.max(first, second) * 0.005;
  if (second < first - tol) return "shorter";
  if (second > first + tol) return "longer";
  return "same";
}

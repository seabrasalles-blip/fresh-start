import { COLS, ROWS, TULIPA_STUB, mid } from "./mapData";

/**
 * Grafo navegável: nós = cruzamentos das ruas nomeadas + acessos às casas/escola.
 * Arestas = trechos de rua contíguos. Vias de borda sem nome não entram na rota.
 */
export interface GNode {
  id: string;
  x: number;
  y: number;
  kind: "cross" | "access" | "end";
  /** marcador servido por este acesso */
  access?: string | undefined;
  label?: string | undefined;
}

const NAMED_COLS = COLS.slice(1, 8); // violeta..gardenia
const NAMED_ROWS = ROWS.slice(1, 7); // copo..alecrim

const nodes: Record<string, GNode> = {};
const adj: Record<string, Set<string>> = {};

const crossId = (c: string, r: string) => `${c}_${r}`;

function add(n: GNode) {
  nodes[n.id] = n;
  adj[n.id] ??= new Set();
}
function link(a: string, b: string) {
  adj[a]!.add(b);
  adj[b]!.add(a);
}

for (const c of NAMED_COLS) {
  for (const r of NAMED_ROWS) {
    if (c.id === "tulipa" && r.id === "copo") continue; // Tulipa não chega à Copo-de-Leite
    add({ id: crossId(c.id, r.id), x: mid(c), y: mid(r), kind: "cross" });
  }
}

/** Acessos: ponto na rua em frente a cada casa/escola. */
export const ACCESS: Record<string, { street: "col" | "row"; road: string; x: number; y: number }> = {
  nina: { street: "col", road: "tulipa", x: TULIPA_STUB.x, y: TULIPA_STUB.yTop + 6 },
  bia: { street: "col", road: "gardenia", x: 732.5, y: 168 },
  helena: { street: "col", road: "violeta", x: 189, y: 178 },
  davi: { street: "col", road: "cravo", x: 474.5, y: 322 },
  caio: { street: "col", road: "hortensia", x: 560, y: 452 },
  escola: { street: "row", road: "amor", x: 334, y: 427.5 },
};
const ACCESS_LABEL: Record<string, string> = {
  nina: "Casa da Nina",
  bia: "Casa da Bia",
  helena: "Casa da Helena",
  davi: "Casa do Davi",
  caio: "Casa do Caio",
  escola: "Escola",
};

for (const [m, a] of Object.entries(ACCESS)) {
  add({ id: `acc_${m}`, x: a.x, y: a.y, kind: m === "nina" ? "end" : "access", access: m, label: ACCESS_LABEL[m] });
}

// Arestas ao longo de cada via (ordenando nós pela coordenada).
for (const c of NAMED_COLS) {
  const ids = Object.values(nodes)
    .filter((n) => Math.abs(n.x - mid(c)) < 0.01)
    .sort((a, b) => a.y - b.y)
    .map((n) => n.id);
  for (let i = 0; i < ids.length - 1; i++) link(ids[i]!, ids[i + 1]!);
}
for (const r of NAMED_ROWS) {
  const ids = Object.values(nodes)
    .filter((n) => Math.abs(n.y - mid(r)) < 0.01)
    .sort((a, b) => a.x - b.x)
    .map((n) => n.id);
  for (let i = 0; i < ids.length - 1; i++) link(ids[i]!, ids[i + 1]!);
}

export const GRAPH_NODES = nodes;
export const node = (id: string): GNode => nodes[id]!;
export const neighbors = (id: string): string[] => [...(adj[id] ?? [])];
export const isAdjacent = (a: string, b: string) => adj[a]?.has(b) ?? false;
export const accessNodeOf = (markerId: string) => `acc_${markerId}`;

export const ROUTE_ORDER = ["nina", "bia", "helena", "davi", "caio", "escola"] as const;
export const START_NODE = accessNodeOf("nina");

export function edgesList(): [string, string][] {
  const out: [string, string][] = [];
  for (const [a, s] of Object.entries(adj)) for (const b of s) if (a < b) out.push([a, b]);
  return out;
}

/** BFS — usado só para documentar/testar a viabilidade da sequência. */
export function shortestPath(from: string, to: string): string[] | null {
  const prev: Record<string, string | null> = { [from]: null };
  const q = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    for (const n of neighbors(cur)) if (!(n in prev)) { prev[n] = cur; q.push(n); }
  }
  if (!(to in prev)) return null;
  const path: string[] = [];
  for (let c: string | null | undefined = to; c; c = prev[c]) path.unshift(c);
  return path;
}

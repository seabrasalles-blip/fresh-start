import { describe, expect, it } from "vitest";
import { MARKERS, TARGETS, markersOf, targetAt, targetById, validatePlacement } from "./locations";
import { GRAPH_NODES, ROUTE_ORDER, node, START_NODE, accessNodeOf, edgesList, isAdjacent, shortestPath } from "./mapGraph";
import { validateRoute } from "./routeValidator";

const houseIds = markersOf("houses").map((m) => m.id);
const cityIds = markersOf("city").map((m) => m.id);
const allCorrect = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, MARKERS.find((m) => m.id === id)!.targetId]));

/** Concatena menores caminhos entre os destinos — um caminho possível documentado. */
function buildRoute(order: readonly string[]) {
  const r: string[] = [START_NODE];
  for (let i = 1; i < order.length; i++) {
    const p = shortestPath(accessNodeOf(order[i - 1]!), accessNodeOf(order[i]!))!;
    r.push(...p.slice(1));
  }
  return r;
}

describe("alvos", () => {
  it("existem 11 alvos com IDs únicos e cada marcador aponta para um alvo da mesma fase", () => {
    expect(TARGETS).toHaveLength(11);
    expect(new Set(TARGETS.map((t) => t.id)).size).toBe(11);
    for (const m of MARKERS) expect(targetById(m.targetId).phase).toBe(m.phase);
  });
  it("soltar no centro de cada alvo identifica o alvo certo", () => {
    for (const t of TARGETS) expect(targetAt(t.x, t.y, t.phase)).toBe(t.id);
  });
  it("na segunda missão nunca aceita zonas da primeira etapa", () => {
    for (const t of TARGETS.filter((t) => t.phase === "houses")) {
      expect(targetAt(t.x, t.y, "city")).not.toBe(t.id);
    }
  });
});

describe("validatePlacement", () => {
  it("todas corretas", () => {
    expect(validatePlacement(houseIds, allCorrect(houseIds)).correct).toHaveLength(6);
    expect(validatePlacement(cityIds, allCorrect(cityIds)).correct).toHaveLength(5);
  });
  it("respostas trocadas contam como erradas", () => {
    const p = { ...allCorrect(houseIds), bia: "t-helena", helena: "t-bia" };
    const r = validatePlacement(houseIds, p);
    expect(r.wrong.sort()).toEqual(["bia", "helena"]);
    expect(r.correct).toHaveLength(4);
  });
  it("marcações faltantes", () => {
    const p: Record<string, string> = allCorrect(houseIds);
    delete p["caio"];
    expect(validatePlacement(houseIds, p).missing).toEqual(["caio"]);
  });
  it("vários marcadores numa mesma zona: só o dono acerta", () => {
    const p = { ...allCorrect(houseIds), davi: "t-nina", caio: "t-nina" };
    const r = validatePlacement(houseIds, p);
    expect(r.correct).toContain("nina");
    expect(r.wrong.sort()).toEqual(["caio", "davi"]);
  });
  it("marcador fora de qualquer alvo é erro", () => {
    expect(validatePlacement(["nina"], { nina: null }).wrong).toEqual(["nina"]);
  });
});

describe("grafo", () => {
  it("cada casa e a escola têm acesso ligado à rua", () => {
    for (const id of ROUTE_ORDER) {
      const n = GRAPH_NODES[accessNodeOf(id)];
      expect(n).toBeDefined();
    }
  });
  it("Tulipa não liga direto à Copo-de-Leite (beco sem saída)", () => {
    expect(GRAPH_NODES["tulipa_copo"]).toBeUndefined();
    expect(isAdjacent("hortensia_copo", "gardenia_copo")).toBe(true);
  });
  it("todas as arestas são horizontais ou verticais (não atravessam quadras)", () => {
    for (const [a, b] of edgesList()) {
      const A = node(a), B = node(b);
      expect(A.x === B.x || A.y === B.y).toBe(true);
    }
  });
  it("a sequência Nina → Bia → Helena → Davi → Caio → Escola é viável", () => {
    expect(validateRoute(buildRoute(ROUTE_ORDER)).ok).toBe(true);
  });
});

describe("validateRoute", () => {
  const valid = buildRoute(ROUTE_ORDER);

  it("precisa começar na casa da Nina", () => {
    expect(validateRoute(valid.slice(1)).error?.type).toBe("start");
  });
  it("rota desconectada", () => {
    const r = [START_NODE, "violeta_alecrim"];
    expect(validateRoute(r).error?.type).toBe("disconnected");
  });
  it("atravessar quadra (diagonal) é desconectado", () => {
    expect(isAdjacent("rosa_girassol", "cravo_margarida")).toBe(false);
    expect(validateRoute([START_NODE, "tulipa_jasmim", "hortensia_girassol"]).error?.type).toBe("disconnected");
  });
  it("visita fora de ordem", () => {
    const r = buildRoute(["nina", "helena"]);
    const res = validateRoute(r);
    expect(res.error).toMatchObject({ type: "order", met: "helena", expected: "bia" });
  });
  it("escola antes dos amigos", () => {
    const r = buildRoute(["nina", "bia", "helena", "escola"]);
    expect(validateRoute(r).error?.type).toBe("order");
  });
  it("amigo faltando e falta chegar à escola", () => {
    expect(validateRoute(buildRoute(["nina", "bia"])).error).toMatchObject({ type: "missingFriend", expected: "helena" });
    expect(validateRoute(buildRoute(["nina", "bia", "helena", "davi", "caio"])).error?.type).toBe("notAtSchool");
  });
  it("aceita ciclos e duas rotas válidas distintas", () => {
    // Rota B: da Nina, desvia pela Hortênsia/Copo-de-Leite até a Bia
    const alt = [START_NODE, "tulipa_jasmim", "hortensia_jasmim", "hortensia_copo", "gardenia_copo", "acc_bia"];
    const rest = valid.slice(valid.indexOf("acc_bia") + 1);
    const routeB = [...alt, ...rest];
    expect(routeB.join()).not.toBe(valid.join());
    expect(validateRoute(routeB).ok).toBe(true);
    // ciclo: vai e volta num trecho
    const i = valid.indexOf("acc_bia");
    const withLoop = [...valid.slice(0, i + 1), "gardenia_jasmim", "acc_bia", ...valid.slice(i + 1)];
    expect(validateRoute(withLoop).ok).toBe(true);
  });
  it("desfazer (remover o último passo) mantém validade parcial", () => {
    const partial = valid.slice(0, -1);
    expect(validateRoute(partial).ok).toBe(false);
    expect(validateRoute([...partial, valid.at(-1)!]).ok).toBe(true);
  });
});

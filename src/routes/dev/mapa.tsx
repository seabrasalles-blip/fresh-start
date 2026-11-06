import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CityMap } from "@/components/game/CityMap";
import { TARGETS, TARGET_RADIUS } from "@/game/locations";
import { GRAPH_NODES, ROUTE_ORDER, START_NODE, accessNodeOf, edgesList, shortestPath } from "@/game/mapGraph";
import parte1 from "@/assets/mapa/resposta_parte1.png.asset.json";
import parte2 from "@/assets/mapa/resposta_parte2.png.asset.json";

/** Visualização técnica (não linkada para o aluno): grafo, alvos e sobreposição com o gabarito original. */
export const Route = createFileRoute("/dev/mapa")({
  head: () => ({
    meta: [
      { title: "Conferência técnica do mapa — Como chegar?" },
      { name: "description", content: "Visualização de desenvolvimento do grafo e dos alvos do mapa de Florais." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Conferência técnica do mapa" },
      { property: "og:description", content: "Grafo, alvos e gabarito original." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DevMap,
});

function docRoute() {
  const r = [START_NODE];
  for (let i = 1; i < ROUTE_ORDER.length; i++) r.push(...shortestPath(accessNodeOf(ROUTE_ORDER[i - 1]), accessNodeOf(ROUTE_ORDER[i]))!.slice(1));
  return r;
}

function DevMap() {
  const [overlay, setOverlay] = useState<0 | 1 | 2>(1);
  const route = docRoute();
  return (
    <div className="h-screen overflow-auto bg-card p-4 text-sm">
      <div className="mb-2 flex gap-2">
        {[0, 1, 2].map((o) => (
          <button key={o} className="rounded border px-2 py-1" onClick={() => setOverlay(o as 0 | 1 | 2)}>
            {o === 0 ? "Sem gabarito" : `Gabarito parte ${o}`}
          </button>
        ))}
      </div>
      <CityMap width={1100}>
        {overlay > 0 && (
          <image href={overlay === 1 ? parte1.url : parte2.url} x={0} y={0} width={1202} height={1097} opacity={0.5} />
        )}
        {edgesList().map(([a, b]) => (
          <line key={a + b} x1={GRAPH_NODES[a].x} y1={GRAPH_NODES[a].y} x2={GRAPH_NODES[b].x} y2={GRAPH_NODES[b].y} stroke="var(--secondary)" strokeWidth={1.5} />
        ))}
        <polyline points={route.map((id) => `${GRAPH_NODES[id].x},${GRAPH_NODES[id].y}`).join(" ")} fill="none" stroke="var(--route)" strokeWidth={3} opacity={0.7} />
        {Object.values(GRAPH_NODES).map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={3} fill={n.access ? "var(--route)" : "var(--secondary)"} />
            <text x={n.x + 3} y={n.y - 3} fontSize={5} fill="var(--foreground)">{n.id}</text>
          </g>
        ))}
        {TARGETS.map((t) => (
          <g key={t.id}>
            <circle cx={t.x} cy={t.y} r={TARGET_RADIUS} fill="none" stroke={t.phase === "houses" ? "var(--accent)" : "var(--primary)"} strokeDasharray="3 2" />
            <text x={t.x} y={t.y} fontSize={6} textAnchor="middle" fill="var(--foreground)">{t.id}</text>
          </g>
        ))}
      </CityMap>
      <p className="mt-2 font-mono">Rota documentada ({route.length} nós): {route.join(" → ")}</p>
    </div>
  );
}

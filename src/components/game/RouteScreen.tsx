import { useState } from "react";
import { ArrowRight, CheckCheck, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CityMap } from "./CityMap";
import { HelpButton } from "./HelpModal";
import { PlacedMarker } from "./PlacementScreen";
import { SpeakButton } from "./SpeakButton";
import { markerById, targetById } from "@/game/locations";
import { GRAPH_NODES, ROUTE_ORDER, node, accessNodeOf, isAdjacent, neighbors } from "@/game/mapGraph";
import { validateRoute } from "@/game/routeValidator";

const INSTRUCTION =
  "Comece na casa da Nina. Siga pelas ruas até a casa da Bia. Depois, encontre os outros amigos na ordem indicada. Termine na escola!";

interface Props {
  route: string[];
  setRoute: (r: string[]) => void;
  feedback: { kind: "warn" | "success"; text: string } | null;
  setFeedback: (f: { kind: "warn" | "success"; text: string } | null) => void;
  onVerify: () => void;
  done: boolean;
  onAdvance: () => void;
  readOnly?: boolean;
  advanceLabel?: string;
}

export function RouteScreen(p: Props) {
  const [hint, setHint] = useState<string | null>(null);
  const last = p.route[p.route.length - 1]!;
  const live = validateRoute(p.route);
  const nextId = live.error?.type === "order" ? live.error.expected : live.next;
  const adj = new Set(p.readOnly || p.done ? [] : neighbors(last));

  const clickNode = (id: string) => {
    if (p.readOnly || p.done) return;
    if (!isAdjacent(last, id)) {
      setHint("Esse ponto não está ligado pela rua ao lugar onde você está. Escolha um ponto vizinho brilhando.");
      return;
    }
    setHint(null);
    p.setFeedback(null);
    p.setRoute([...p.route, id]);
  };

  const pts = p.route.map((id) => `${node(id).x},${node(id).y}`).join(" ");

  return (
    <div className="flex h-full flex-col px-6 pb-5 pt-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-secondary-deep">
          {p.readOnly ? "Nosso caminho até a escola" : "Construa nosso trajeto"}
        </h1>
      </header>
      <div className="flex flex-1 gap-5">
        <div className="self-start rounded-2xl border-4 border-secondary bg-map-frame p-2 shadow-card">
          <CityMap width={760}>
            <g id="layer-route" pointerEvents="none">
              {p.route.length > 1 && (
                <polyline points={pts} fill="none" stroke="var(--route)" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
              )}
            </g>
            <g id="layer-markers">
              {ROUTE_ORDER.map((m) => {
                const t = targetById(markerById(m).targetId);
                const isNext = nextId === m && !p.done && !p.readOnly;
                return (
                  <g key={m}>
                    {isNext && <circle cx={t.x} cy={t.y} r={32} fill="var(--warning)" opacity={0.6} className="animate-pulse-ring" />}
                    <PlacedMarker id={m} pos={t} />
                  </g>
                );
              })}
            </g>
            <g id="layer-nodes">
              {Object.values(GRAPH_NODES).map((n) => {
                const isAdj = adj.has(n.id);
                const isLast = n.id === last;
                return (
                  <g
                    key={n.id}
                    id={`node-${n.id}`}
                    onClick={() => clickNode(n.id)}
                    className={isAdj ? "cursor-pointer" : ""}
                    role={isAdj ? "button" : undefined}
                    tabIndex={isAdj ? 0 : -1}
                    aria-label={isAdj ? `Ir para ${n.label ?? "o cruzamento"}` : undefined}
                    onKeyDown={(e) => { if (isAdj && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); clickNode(n.id); } }}
                  >
                    <circle cx={n.x} cy={n.y} r={13} fill="transparent" />
                    {isAdj && <circle cx={n.x} cy={n.y} r={9} fill="var(--route-node)" opacity={0.35} className="animate-pulse-ring" />}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isLast ? 7 : isAdj ? 6 : 2.5}
                      fill={isLast ? "var(--route)" : isAdj ? "var(--route-node)" : "var(--muted-foreground)"}
                      stroke="var(--card)"
                      strokeWidth={isLast || isAdj ? 2 : 0}
                      opacity={isLast || isAdj ? 1 : 0.35}
                    />
                  </g>
                );
              })}
            </g>
          </CityMap>
        </div>

        <aside className="flex w-[360px] flex-col gap-3">
          <section className="rounded-2xl border-4 border-primary bg-card p-4 shadow-card">
            <p className="font-display text-[19px] leading-snug">{INSTRUCTION}</p>
            <div className="mt-2"><SpeakButton text={INSTRUCTION} /></div>
          </section>

          <section className="rounded-2xl bg-card/80 p-3" aria-label="Ordem dos encontros">
            <p className="mb-2 text-sm font-bold text-muted-foreground">Ordem dos encontros</p>
            <ol className="flex flex-wrap gap-1.5">
              {ROUTE_ORDER.map((m, i) => {
                const doneStep = i < live.reached && !(live.error?.type === "order" && i >= live.reached);
                const isNext = nextId === m;
                return (
                  <li
                    key={m}
                    className={`rounded-full border-2 px-2.5 py-0.5 text-sm font-extrabold ${
                      doneStep ? "border-success bg-success text-success-foreground" : isNext ? "border-primary bg-warning/40" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {i + 1}. {m === "escola" ? "Escola" : markerById(m).label.replace(/^Casa d[ao] /, "")}
                  </li>
                );
              })}
            </ol>
          </section>

          {(hint || p.feedback) && (
            <div role="status" className={`rounded-2xl border-2 px-4 py-2 font-display text-base font-bold ${p.feedback?.kind === "success" ? "border-success bg-success/15" : "border-primary bg-warning/30"}`}>
              {p.feedback?.text ?? hint}
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2">
            {!p.readOnly && !p.done && (
              <div className="flex gap-2">
                <Button variant="gameSoft" size="game" className="flex-1" onClick={() => { setHint(null); p.setFeedback(null); p.setRoute(p.route.slice(0, -1)); }} disabled={p.route.length <= 1}>
                  <Undo2 /> Desfazer
                </Button>
                <Button variant="gameSoft" size="game" className="flex-1" onClick={() => { setHint(null); p.setFeedback(null); p.setRoute([accessNodeOf("nina")]); }} disabled={p.route.length <= 1}>
                  <RotateCcw /> Recomeçar
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              {!p.readOnly && (
                <HelpButton
                  items={[
                    "O ponto vermelho mostra onde você está.",
                    "Toque nos pontos azuis que piscam para andar pela rua.",
                    "Siga a ordem: Nina, Bia, Helena, Davi, Caio e, por último, a escola.",
                    "Errou um passo? Use DESFAZER.",
                  ]}
                />
              )}
              {p.done || p.readOnly ? (
                <Button variant="game" size="game" className="flex-1" onClick={p.onAdvance}>
                  {p.advanceLabel ?? "Continuar"} <ArrowRight />
                </Button>
              ) : (
                <Button variant="game" size="game" className="flex-1" onClick={p.onVerify}>
                  <CheckCheck /> Verificar
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

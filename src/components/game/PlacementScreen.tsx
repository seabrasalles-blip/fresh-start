import { useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCheck, ChevronLeft, ChevronRight, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CityMap, clientToMap } from "./CityMap";
import { HelpButton } from "./HelpModal";
import { SpeakButton } from "./SpeakButton";
import { markerById, targetById } from "@/game/locations";
import { VIEWBOX } from "@/game/mapData";

export type Pos = { x: number; y: number };
export const MARKER_W = 46;
export const MARKER_H = 57.5;

export function PlacedMarker({ id, pos, locked, selected, dim }: { id: string; pos: Pos; locked?: boolean; selected?: boolean; dim?: boolean }) {
  const m = markerById(id);
  return (
    <g opacity={dim ? 0.55 : 1}>
      {selected && <circle cx={pos.x} cy={pos.y} r={32} fill="none" stroke="var(--ring)" strokeWidth={3} strokeDasharray="4 3" />}
      <image href={m.img} x={pos.x - MARKER_W / 2} y={pos.y - MARKER_H / 2} width={MARKER_W} height={MARKER_H} />
      {locked && (
        <g>
          <circle cx={pos.x + 18} cy={pos.y - 22} r={6} fill="var(--success)" stroke="var(--card)" strokeWidth={1.5} />
          <path d={`M${pos.x + 15} ${pos.y - 22} l2 2 l4 -4`} stroke="var(--card)" strokeWidth={1.6} fill="none" />
        </g>
      )}
    </g>
  );
}

interface Props {
  title: string;
  clues: { markerId: string; text: string }[];
  placements: Record<string, Pos>;
  onPlace: (id: string, pos: Pos | null) => void;
  locked: string[];
  /** marcadores de etapas anteriores, sempre bloqueados */
  background?: string[];
  feedback: { kind: "info" | "warn" | "success"; text: string } | null;
  onVerify: () => void;
  done: boolean;
  onAdvance: () => void;
  helpItems: string[];
}

type Drag = { id: string; sx: number; sy: number; x: number; y: number; moved: boolean };

export function PlacementScreen(p: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [clue, setClue] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [cursor, setCursor] = useState<Pos>({ x: VIEWBOX.x + VIEWBOX.w / 2, y: VIEWBOX.y + VIEWBOX.h / 2 });
  const [showBg, setShowBg] = useState(true);

  const ids = p.clues.map((c) => c.markerId);
  const bank = ids.filter((id) => !p.placements[id]);
  const isLocked = (id: string) => p.locked.includes(id);

  const placeAt = (id: string, clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = clientToMap(svg, clientX, clientY);
    if (pt?.inside) p.onPlace(id, { x: pt.x, y: pt.y });
    else if (p.placements[id]) p.onPlace(id, null);
  };

  const down = (id: string) => (e: RPointerEvent) => {
    if (isLocked(id) || p.done) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ id, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moved: false });
  };
  const move = (e: RPointerEvent) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
  };
  const up = (e: RPointerEvent) => {
    if (!drag) return;
    if (drag.moved) {
      placeAt(drag.id, e.clientX, e.clientY);
      setSelected(null);
    } else {
      setSelected((s) => (s === drag.id ? null : drag.id));
    }
    setDrag(null);
  };

  const mapClick = (e: React.MouseEvent) => {
    if (!selected || drag) return;
    placeAt(selected, e.clientX, e.clientY);
    setSelected(null);
  };

  const mapKey = (e: KeyboardEvent) => {
    if (!selected) return;
    const step = e.shiftKey ? 20 : 6;
    const d: Record<string, Pos> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    const dv = d[e.key];
    if (dv) {
      e.preventDefault();
      setCursor((c) => ({
        x: Math.min(VIEWBOX.x + VIEWBOX.w - 5, Math.max(VIEWBOX.x + 5, c.x + dv.x)),
        y: Math.min(VIEWBOX.y + VIEWBOX.h - 5, Math.max(VIEWBOX.y + 5, c.y + dv.y)),
      }));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      p.onPlace(selected, cursor);
      setSelected(null);
    } else if (e.key === "Escape") setSelected(null);
  };

  const current = p.clues[clue]!;
  const speaker = markerById(current.markerId);

  return (
    <div className="flex h-full flex-col px-6 pb-5 pt-4" onPointerMove={move} onPointerUp={up}>
      <header className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-secondary-deep">{p.title}</h1>
        {p.background && p.background.length > 0 && (
          <Button variant="gameSoft" size="sm" className="h-10 px-4" onClick={() => setShowBg((v) => !v)} aria-pressed={!showBg}>
            {showBg ? <EyeOff /> : <Eye />} {showBg ? "Ocultar casas" : "Mostrar casas"}
          </Button>
        )}
      </header>

      <div className="flex flex-1 gap-5">
        {/* mapa */}
        <div className="rounded-2xl border-4 border-secondary bg-map-frame p-2 shadow-card self-start">
          <CityMap
            ref={svgRef}
            width={760}
            tabIndex={0}
            onClick={mapClick}
            onKeyDown={mapKey}
            aria-label={selected ? `Mapa. Use as setas para escolher o lugar de ${markerById(selected).label} e Enter para colocar.` : "Mapa da cidade de Florais"}
            className={`block touch-none select-none rounded-xl ${selected ? "cursor-crosshair" : ""}`}
          >
            <g id="layer-background-markers">
              {showBg && p.background?.map((id) => <PlacedMarker key={id} id={id} pos={targetById(markerById(id).targetId)} locked dim />)}
            </g>
            <g id="layer-markers">
              {ids.filter((id) => p.placements[id]).map((id) => (
                <g key={id} onPointerDown={down(id)} className={isLocked(id) ? "" : "cursor-grab"}>
                  <PlacedMarker id={id} pos={p.placements[id]!} locked={isLocked(id)} selected={selected === id} />
                  <title>{markerById(id).label}</title>
                </g>
              ))}
            </g>
            {selected && (
              <g pointerEvents="none">
                <circle cx={cursor.x} cy={cursor.y} r={8} fill="none" stroke="var(--ring)" strokeWidth={2.5} />
                <path d={`M${cursor.x - 13} ${cursor.y}h26M${cursor.x} ${cursor.y - 13}v26`} stroke="var(--ring)" strokeWidth={2} />
              </g>
            )}
          </CityMap>
        </div>

        {/* painel */}
        <aside className="flex w-[360px] flex-col gap-3">
          <section className="rounded-2xl border-4 border-primary bg-card p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-primary px-3 py-0.5 font-display text-base font-bold text-primary-foreground">
                Pista {clue + 1} de {p.clues.length}
              </span>
              <span className="font-display text-base font-bold text-muted-foreground">{speaker.label}</span>
            </div>
            <p className="min-h-[84px] font-display text-[19px] leading-snug" aria-live="polite">{current.text}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button variant="gameSoft" size="sm" className="h-10 px-3" onClick={() => setClue((c) => c - 1)} disabled={clue === 0}>
                <ChevronLeft /> Pista anterior
              </Button>
              <Button variant="gameSoft" size="sm" className="h-10 px-3" onClick={() => setClue((c) => c + 1)} disabled={clue === p.clues.length - 1}>
                Próxima pista <ChevronRight />
              </Button>
            </div>
            <div className="mt-2"><SpeakButton text={current.text} /></div>
          </section>

          <section className="flex-1 rounded-2xl bg-card/70 p-3" aria-label="Marcadores para colocar">
            <p className="mb-2 text-sm font-bold text-muted-foreground">
              {bank.length ? "Arraste para o mapa ou toque e depois toque no lugar:" : "Todos os marcadores estão no mapa."}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {bank.map((id) => {
                const m = markerById(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onPointerDown={down(id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected((s) => (s === id ? null : id)); svgRef.current?.focus(); } }}
                    aria-pressed={selected === id}
                    aria-label={m.label}
                    className={`touch-none rounded-xl p-1 transition ${selected === id ? "bg-secondary/20 ring-4 ring-ring" : "hover:bg-muted"} cursor-grab`}
                  >
                    <img src={m.img} alt="" draggable={false} className={`mx-auto h-[84px] w-auto ${drag?.id === id && drag.moved ? "opacity-30" : ""}`} />
                  </button>
                );
              })}
            </div>
          </section>

          {p.feedback && (
            <div
              role="status"
              className={`rounded-2xl border-2 px-4 py-2 font-display text-base font-bold ${
                p.feedback.kind === "success" ? "border-success bg-success/15 text-foreground" : p.feedback.kind === "warn" ? "border-primary bg-warning/30 text-foreground" : "border-secondary bg-card text-foreground"
              }`}
            >
              {p.feedback.text}
            </div>
          )}

          <div className="flex gap-2">
            <HelpButton items={p.helpItems} />
            {p.done ? (
              <Button variant="game" size="game" className="flex-1" onClick={p.onAdvance}>
                Continuar <ArrowRight />
              </Button>
            ) : (
              <Button variant="game" size="game" className="flex-1" onClick={p.onVerify}>
                <CheckCheck /> Verificar
              </Button>
            )}
          </div>
          {p.locked.length > 0 && !p.done && (
            <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground"><Lock className="size-3" /> Marcadores certos ficam presos no lugar.</p>
          )}
        </aside>
      </div>

      {drag?.moved &&
        createPortal(
          <img
            src={markerById(drag.id).img}
            alt=""
            className="pointer-events-none fixed z-50 h-24 w-auto -translate-x-1/2 -translate-y-1/2 drop-shadow-xl"
            style={{ left: drag.x, top: drag.y }}
          />,
          document.body,
        )}
    </div>
  );
}

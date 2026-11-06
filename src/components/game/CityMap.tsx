import { forwardRef, type ReactNode, type SVGProps } from "react";
import { Croissant, Hospital, Landmark, Plane, UtensilsCrossed } from "lucide-react";
import { COLS, LABELS, REFERENCES, ROWS, TULIPA_STUB, VIEWBOX, buildBlocks, type RefIcon } from "@/game/mapData";

const BLOCKS = buildBlocks();
const ICONS: Record<RefIcon, typeof Plane> = {
  aeroporto: Plane,
  prefeitura: Landmark,
  restaurante: UtensilsCrossed,
  padaria: Croissant,
  hospital: Hospital,
};

/** Converte coordenadas de tela para o viewBox do mapa. */
export function clientToMap(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  const inside = p.x >= VIEWBOX.x && p.x <= VIEWBOX.x + VIEWBOX.w && p.y >= VIEWBOX.y && p.y <= VIEWBOX.y + VIEWBOX.h;
  return { x: p.x, y: p.y, inside };
}

type Props = {
  children?: ReactNode;
  /** conteúdo desenhado abaixo dos rótulos de rua (ex.: a linha do trajeto) */
  below?: ReactNode;
  width: number;
} & Omit<SVGProps<SVGSVGElement>, "ref" | "width">;

export const CityMap = forwardRef<SVGSVGElement, Props>(function CityMap({ children, below, width, ...rest }, ref) {
  return (
    <svg
      ref={ref}
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      width={width}
      height={(width * VIEWBOX.h) / VIEWBOX.w}
      className="block touch-none select-none rounded-xl"
      role="img"
      aria-label="Mapa da cidade de Florais"
      {...rest}
    >
      <defs>
        <clipPath id="map-clip">
          <rect x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} />
        </clipPath>
      </defs>
      <g clipPath="url(#map-clip)">
        {/* camada: vias (fundo) */}
        <rect id="layer-roads" x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} fill="var(--map-road)" />
        {/* camada: quadras */}
        <g id="layer-blocks">
          {BLOCKS.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={7}
              fill={i % 2 === 0 ? "var(--map-block)" : "var(--map-block-alt)"}
              stroke="var(--map-block-edge)"
              strokeWidth={1}
            />
          ))}
          {/* beco do final da Rua Tulipa */}
          <rect
            x={COLS[6]!.a}
            y={TULIPA_STUB.yTop}
            width={COLS[6]!.b - COLS[6]!.a}
            height={ROWS[2]!.a - TULIPA_STUB.yTop + 1}
            fill="var(--map-road)"
          />
        </g>
        {/* camada do trajeto: fica abaixo dos nomes de rua para não tapá-los */}
        {below}
        {/* camada: rótulos */}
        <g id="layer-labels" fontFamily="Nunito, sans-serif" fontWeight={900} fontSize={12.5} fill="var(--map-label)" pointerEvents="none">
          {LABELS.map((l) => (
            <text
              key={l.text}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="central"
              transform={l.vertical ? `rotate(90 ${l.x} ${l.y})` : undefined}
              letterSpacing={0.5}
              stroke="var(--card)"
              strokeWidth={3}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {l.text}
            </text>
          ))}
        </g>
        {/* camada: referências fixas */}
        <g id="layer-refs" pointerEvents="none">
          {REFERENCES.map((r) => {
            const Icon = ICONS[r.id];
            return (
              <g key={r.id}>
                <rect x={r.x - 14} y={r.y - 18} width={28} height={26} rx={7} fill="var(--card)" stroke="var(--secondary)" strokeWidth={1.5} />
                <Icon x={r.x - 10} y={r.y - 15} width={20} height={20} color="var(--secondary)" strokeWidth={2.2} />
                <text x={r.x} y={r.y + 16} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily="Nunito, sans-serif" fill="var(--foreground)" stroke="var(--card)" strokeWidth={2.5} paintOrder="stroke">
                  {r.label}
                </text>
              </g>
            );
          })}
        </g>
        {children}
      </g>
    </svg>
  );
});

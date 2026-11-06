import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, RotateCcw, Route as RouteIcon, ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stage } from "@/components/game/Stage";
import { DialogScene } from "@/components/game/DialogScene";
import { PlacementScreen, type Pos } from "@/components/game/PlacementScreen";
import { RouteScreen } from "@/components/game/RouteScreen";
import { CITY_CLUES, HOUSE_CLUES } from "@/game/clues";
import { validatePlacement, targetAt, targetById, markerById, type Phase } from "@/game/locations";
import { START_NODE } from "@/game/mapGraph";
import { routeMessage, validateRoute } from "@/game/routeValidator";
import capa from "@/assets/capa/capa_como_chegar_1200x675.png.asset.json";
import ninaApresentando from "@/assets/personagens/nina_apresentando.png.asset.json";
import ninaExplicando from "@/assets/personagens/nina_explicando.png.asset.json";
import ninaComemorando from "@/assets/personagens/nina_comemorando.png.asset.json";
import daviApresentando from "@/assets/personagens/davi_apresentando.png.asset.json";
import ninaEDavi from "@/assets/personagens/nina_e_davi_final.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Como chegar? — Atividade de mapas" },
      { name: "description", content: "Ajude Nina e seus amigos a encontrar as casas no mapa de Florais e traçar o caminho até a escola." },
      { property: "og:title", content: "Como chegar? — Atividade de mapas" },
      { property: "og:description", content: "Leitura de mapas, endereços e trajetos pelas ruas da cidade de Florais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Screen =
  | "cover" | "intro" | "locations" | "locationsFeedback" | "routeIntro" | "route"
  | "routeFeedback" | "cityIntro" | "cityLocations" | "end" | "review";

type Feedback = { kind: "info" | "warn" | "success"; text: string } | null;

const HOUSE_IDS = HOUSE_CLUES.map((c) => c.markerId);
const CITY_IDS = CITY_CLUES.map((c) => c.markerId);

const PLACE_HELP = [
  "Leia a pista e procure as ruas no mapa.",
  "Arraste o marcador até o lugar certo. Ou toque no marcador e depois toque no mapa.",
  "Use PRÓXIMA PISTA para ver as outras pistas.",
  "Quando terminar, toque em VERIFICAR.",
];

function Index() {
  const [screen, setScreen] = useState<Screen>("cover");
  const [placements, setPlacements] = useState<Record<string, Pos>>({});
  const [locked, setLocked] = useState<string[]>([]);
  const [placeFb, setPlaceFb] = useState<Feedback>(null);
  const [route, setRoute] = useState<string[]>([START_NODE]);
  const [routeFb, setRouteFb] = useState<{ kind: "warn" | "success"; text: string } | null>(null);

  const reset = () => {
    setPlacements({}); setLocked([]); setPlaceFb(null); setRoute([START_NODE]); setRouteFb(null); setScreen("cover");
  };

  const onPlace = (id: string, pos: Pos | null) => {
    setPlacements((p) => {
      const n = { ...p };
      if (pos) n[id] = pos; else delete n[id];
      return n;
    });
    setPlaceFb(null);
  };

  const verify = (phase: Phase, ids: string[], successText: string, next: Screen) => {
    const asTargets: Record<string, string | null | undefined> = {};
    for (const id of ids) if (placements[id]) asTargets[id] = targetAt(placements[id].x, placements[id].y, phase);
    const r = validatePlacement(ids, asTargets);
    if (r.missing.length) {
      setPlaceFb({ kind: "warn", text: r.missing.length === 1 ? "Ainda falta colocar 1 marcador no mapa." : `Ainda faltam ${r.missing.length} marcadores no mapa.` });
      return;
    }
    setLocked((l) => [...new Set([...l, ...r.correct])]);
    setPlacements((p) => {
      const n = { ...p };
      // alvos por área (parque): fixa o marcador na posição visual padronizada
      for (const id of r.correct) {
        const t = targetById(markerById(id).targetId);
        if (t.rect) n[id] = { x: t.x, y: t.y };
      }
      r.wrong.forEach((id) => delete n[id]);
      return n;
    });
    if (r.wrong.length) {
      setPlaceFb({ kind: "warn", text: r.wrong.length === 1 ? "1 marcador precisa de revisão. Ele voltou para o banco. Leia a pista de novo!" : `${r.wrong.length} marcadores precisam de revisão. Eles voltaram para o banco. Leia as pistas de novo!` });
      return;
    }
    setPlaceFb({ kind: "success", text: successText });
    setScreen(next);
  };

  return (
    <Stage>
      {screen === "cover" && (
        <div className="relative h-full w-full">
          <img src={capa.url} alt="Nina e Davi na cidade — Como chegar?" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-14 flex justify-center">
            <Button variant="game" size="hero" onClick={() => setScreen("intro")} autoFocus>
              <Play /> Iniciar
            </Button>
          </div>
        </div>
      )}

      {screen === "intro" && (
        <DialogScene
          character={ninaApresentando.url}
          characterAlt="Nina sorrindo"
          name="Nina"
          text="Oi! Eu sou a Nina! Eu e meus amigos vamos juntos para a escola. Saio de casa e encontro cada um pelo caminho. Mas preciso da sua ajuda! Primeiro, vamos descobrir onde ficam nossas casas. Depois, vamos traçar o caminho até a escola. Você nos ajuda?"
          actions={<Button variant="game" size="game" onClick={() => setScreen("locations")}>Vamos começar! <ArrowRight /></Button>}
        />
      )}

      {(screen === "locations" || screen === "locationsFeedback") && (
        <PlacementScreen
          title="Onde ficam nossas casas?"
          clues={HOUSE_CLUES}
          placements={placements}
          onPlace={onPlace}
          locked={locked}
          feedback={placeFb}
          onVerify={() => verify("houses", HOUSE_IDS, "Muito bem! Você encontrou todas as casas e a escola!", "locationsFeedback")}
          done={screen === "locationsFeedback"}
          onAdvance={() => { setPlaceFb(null); setScreen("routeIntro"); }}
          helpItems={PLACE_HELP}
        />
      )}

      {screen === "routeIntro" && (
        <DialogScene
          character={ninaExplicando.url}
          characterAlt="Nina explicando"
          name="Nina"
          text="Já sabemos onde fica cada casa! Agora vamos descobrir por quais ruas precisamos passar para encontrar todo mundo e chegar à escola. Começamos na minha casa. Primeiro buscamos a Bia, depois a Helena, o Davi e o Caio. Por último, vamos à escola!"
          actions={<Button variant="game" size="game" onClick={() => setScreen("route")}><RouteIcon /> Traçar caminho</Button>}
        />
      )}

      {screen === "route" && (
        <RouteScreen
          route={route}
          setRoute={setRoute}
          feedback={routeFb}
          setFeedback={setRouteFb}
          done={false}
          onAdvance={() => {}}
          onVerify={() => {
            const r = validateRoute(route);
            if (r.ok) { setRouteFb(null); setScreen("routeFeedback"); }
            else setRouteFb({ kind: "warn", text: routeMessage(r) });
          }}
        />
      )}

      {screen === "routeFeedback" && (
        <DialogScene
          character={ninaComemorando.url}
          characterAlt="Nina comemorando"
          name="Nina"
          text={routeMessage({ ok: true, error: null, reached: 6, next: null })}
          actions={<Button variant="game" size="game" onClick={() => setScreen("cityIntro")}>Continuar <ArrowRight /></Button>}
        />
      )}

      {screen === "cityIntro" && (
        <DialogScene
          character={daviApresentando.url}
          characterAlt="Davi apresentando"
          name="Davi"
          text="Agora que você já conhece nosso caminho para a escola, que tal descobrir onde ficam outros lugares da nossa cidade?"
          actions={<Button variant="game" size="game" onClick={() => { setPlaceFb(null); setScreen("cityLocations"); }}>Continuar <ArrowRight /></Button>}
        />
      )}

      {screen === "cityLocations" && (
        <PlacementScreen
          title="Vamos explorar a cidade"
          clues={CITY_CLUES}
          placements={placements}
          onPlace={onPlace}
          locked={locked}
          background={HOUSE_IDS}
          feedback={placeFb}
          onVerify={() => verify("city", CITY_IDS, "Muito bem! Você encontrou todos os lugares da cidade!", "cityLocations")}
          done={CITY_IDS.every((id) => locked.includes(id))}
          onAdvance={() => setScreen("end")}
          helpItems={PLACE_HELP}
        />
      )}

      {screen === "end" && (
        <DialogScene
          wide
          character={ninaEDavi.url}
          characterAlt="Nina e Davi comemorando"
          name="Nina e Davi"
          text="Você descobriu endereços, encontrou caminhos pelas ruas e conheceu lugares da cidade! Um mapa pode nos ajudar a chegar a muitos destinos."
          actions={
            <>
              <Button variant="gameBlue" size="game" onClick={() => setScreen("review")}><Map /> Ver meu caminho</Button>
              <Button variant="game" size="game" onClick={reset}><RotateCcw /> Recomeçar</Button>
            </>
          }
        />
      )}

      {screen === "review" && (
        <RouteScreen
          readOnly
          route={route}
          setRoute={() => {}}
          feedback={null}
          setFeedback={() => {}}
          onVerify={() => {}}
          done
          advanceLabel="Voltar"
          onAdvance={() => setScreen("end")}
        />
      )}
    </Stage>
  );
}

import type { ReactNode } from "react";
import { SpeakButton } from "./SpeakButton";
import cenario from "@/assets/cenario/parque_colorido_do_bairro.png.asset.json";

/**
 * Cena de fala: personagem + balão + ações sobre a ilustração do parque do
 * bairro. O fundo é a imagem aprovada, cobrindo o palco sem distorcer; só as
 * telas de mapa ficam fora disso.
 */
export function DialogScene({
  character,
  characterAlt,
  name,
  text,
  actions,
  wide,
}: {
  character: string;
  characterAlt: string;
  name: string;
  text: string;
  actions: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative h-full">
      <img
        src={cenario.url}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative z-10 flex h-full items-center gap-6 px-14">
        <img
          src={character}
          alt={characterAlt}
          className={wide ? "h-[470px] w-auto shrink-0 object-contain" : "h-[600px] w-auto shrink-0 object-contain self-end"}
        />
        <div className="relative flex-1 rounded-[2rem] border-4 border-secondary bg-card/95 p-9 shadow-card backdrop-blur-[2px]">
          <span className="absolute -top-5 left-8 rounded-full bg-accent px-5 py-1 font-display text-xl font-bold text-accent-foreground">
            {name}
          </span>
          <p className="font-display text-[26px] leading-snug text-foreground">{text}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {actions}
            <SpeakButton text={text} />
          </div>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { SpeakButton } from "./SpeakButton";

/** Cenário decorativo discreto: céu, nuvens, silhuetas de casas/árvores e caminho. */
function SceneBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 675"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--scene-sky-top)" />
          <stop offset="1" stopColor="var(--scene-sky-bottom)" />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#scene-sky)" />
      {/* nuvens */}
      <g fill="var(--scene-cloud)">
        <ellipse cx="180" cy="95" rx="72" ry="24" />
        <ellipse cx="245" cy="84" rx="50" ry="19" />
        <ellipse cx="890" cy="70" rx="84" ry="26" />
        <ellipse cx="962" cy="58" rx="54" ry="19" />
        <ellipse cx="570" cy="135" rx="46" ry="15" />
        <ellipse cx="1120" cy="150" rx="58" ry="18" />
      </g>
      {/* chão */}
      <rect x="0" y="520" width="1200" height="155" fill="var(--scene-ground)" />
      {/* caminho */}
      <path d="M0 675 C 260 585, 420 560, 600 560 C 780 560, 940 585, 1200 675 Z" fill="var(--scene-path)" />
      {/* silhuetas de casas */}
      <g>
        <g fill="var(--scene-house)">
          <rect x="60" y="440" width="90" height="80" />
          <rect x="210" y="465" width="70" height="55" />
          <rect x="330" y="448" width="96" height="72" />
          <rect x="770" y="455" width="84" height="65" />
          <rect x="910" y="438" width="98" height="82" />
          <rect x="1060" y="462" width="72" height="58" />
        </g>
        <g fill="var(--scene-roof)">
          <path d="M50 440 L105 398 L160 440 Z" />
          <path d="M202 465 L245 432 L288 465 Z" />
          <path d="M320 448 L378 406 L436 448 Z" />
          <path d="M760 455 L812 418 L864 455 Z" />
          <path d="M900 438 L959 394 L1018 438 Z" />
          <path d="M1052 462 L1096 430 L1140 462 Z" />
        </g>
      </g>
      {/* árvores */}
      <g>
        <g fill="var(--scene-trunk)">
          <rect x="488" y="470" width="10" height="50" />
          <rect x="700" y="478" width="9" height="42" />
          <rect x="1160" y="470" width="10" height="50" />
        </g>
        <g fill="var(--scene-tree)">
          <circle cx="493" cy="450" r="34" />
          <circle cx="704" cy="460" r="28" />
          <circle cx="1165" cy="448" r="36" />
        </g>
      </g>
    </svg>
  );
}

/** Cena de fala: personagem + balão + ações, sobre cenário ilustrativo discreto. */
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
      <SceneBackdrop />
      <div className="relative z-10 flex h-full items-center gap-6 px-14">
        <img
          src={character}
          alt={characterAlt}
          className={wide ? "h-[470px] w-auto shrink-0 object-contain" : "h-[600px] w-auto shrink-0 object-contain self-end"}
        />
        <div className="relative flex-1 rounded-[2rem] border-4 border-secondary bg-card p-9 shadow-card">
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

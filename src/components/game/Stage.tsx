import { useEffect, useState, type ReactNode } from "react";

export const STAGE_W = 1200;
export const STAGE_H = 675;

/** Palco fixo 16:9 (1200×675) escalado para caber na janela, sem rolagem. */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "center" }}
      >
        {children}
      </div>
    </div>
  );
}

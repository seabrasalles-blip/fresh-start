import type { ReactNode } from "react";
import { Compass, MapPin, Route } from "lucide-react";

/** Decorative stage layer only; never participates in map hit testing. */
export function MapScreenBackdrop() {
  return (
    <div aria-hidden="true" className="map-screen-backdrop pointer-events-none absolute inset-0">
      <MapPin className="absolute -left-3 top-24 size-10 rotate-12 text-secondary/15" strokeWidth={1.5} />
      <Compass className="absolute -right-5 top-32 size-14 text-success/15" strokeWidth={1.2} />
      <Route className="absolute bottom-1 left-12 h-10 w-24 -rotate-12 text-primary/20" strokeWidth={1.2} />
      <MapPin className="absolute bottom-0 right-[390px] size-7 -rotate-12 text-secondary/15" strokeWidth={1.5} />
      <Compass className="absolute -bottom-4 left-[480px] size-12 rotate-12 text-success/15" strokeWidth={1.2} />
    </div>
  );
}

export function MapScreenHeader({ title, mission, children }: { title: string; mission: string; children?: ReactNode }) {
  return (
    <header className="relative mb-3 flex min-h-9 items-center justify-between">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary-deep">
          <MapPin className="size-6" strokeWidth={2.3} />
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-primary" />
        </span>
        <div>
          <p className="font-sans text-[10px] font-extrabold uppercase leading-[10px] text-primary-deep">{mission}</p>
          <h1 className="font-display text-[28px] font-extrabold leading-[26px] text-secondary-deep">{title}</h1>
        </div>
      </div>
      {children}
    </header>
  );
}
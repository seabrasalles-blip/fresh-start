import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function HelpButton({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="gameSoft" size="game" onClick={() => setOpen(true)}>
        <CircleHelp /> Ajuda
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border-4 border-secondary bg-card">
          <DialogTitle className="font-display text-2xl text-secondary">Como fazer</DialogTitle>
          <DialogDescription asChild>
            <ul className="space-y-2 text-base text-foreground">
              {items.map((t) => (
                <li key={t} className="flex gap-2"><span className="text-primary">●</span>{t}</li>
              ))}
            </ul>
          </DialogDescription>
          <Button variant="game" size="game" onClick={() => setOpen(false)}>Entendi!</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

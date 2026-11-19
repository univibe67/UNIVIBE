import type { ReactNode } from "react";

export default function DataPanel({ toolbar, children }: { toolbar?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70">
      {toolbar && (
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          {toolbar}
        </div>
      )}
      {children}
    </section>
  );
}

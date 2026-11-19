import type { ReactNode } from "react";
import EventCardSkeleton from "./EventCardSkeleton";

export function EventGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">{children}</div>;
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <EventGrid>
      {Array.from({ length: count }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </EventGrid>
  );
}

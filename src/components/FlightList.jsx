import { useEffect, useRef, useState } from "react";
import FlightCard from "./FlightCard";
import NarrationButton from "./NarrationButton";

const INITIAL_BATCH = 8;
const BATCH_SIZE = 6;

export default function FlightList({ flights = [], onSelectFlight }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const hasFlights = flights.length > 0;
  const displayFlights = flights.slice(0, visibleCount);
  const canLoadMore = visibleCount < flights.length;
  const narrationText = hasFlights
    ? `Showing ${flights.length} flights. Scroll to load more results and select a card to book.`
    : "No flights match your search. Adjust departure, arrival, or date filters.";

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_BATCH, flights.length || INITIAL_BATCH));
  }, [flights]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) {
      observerRef.current?.disconnect();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((count) =>
          Math.min(count + BATCH_SIZE, flights.length),
        );
      }
    });

    observer.observe(sentinel);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [canLoadMore, flights.length]);

  return (
    <section className="flightlist">
      <div className="flightlist-header">
        <div className="flightlist-title-row">
          <h2 className="flightlist-title">Results</h2>
          <NarrationButton
            text={narrationText}
            label="Hear flight results summary"
            small
          />
        </div>
        {hasFlights && (
          <span className="flightlist-count">
            {flights.length} {flights.length === 1 ? "flight" : "flights"}
          </span>
        )}
      </div>

      {hasFlights ? (
        <>
          <div className="flightlist-grid">
            {displayFlights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onSelect={onSelectFlight}
              />
            ))}
          </div>
          {canLoadMore && (
            <div ref={sentinelRef} className="flightlist-sentinel" aria-hidden />
          )}
        </>
      ) : (
        <p className="flightlist-empty">
          No flights match your search. Try adjusting departure, arrival, or date
          filters.
        </p>
      )}
    </section>
  );
}

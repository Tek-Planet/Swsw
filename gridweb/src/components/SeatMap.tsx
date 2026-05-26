import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Accessibility } from 'lucide-react';
import { Venue, Seat, MAX_MOVIE_SEATS_PER_ORDER, EventCurrency } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface SeatMapProps {
  venue: Venue;
  seats: Record<string, Seat>;
  soldSeatIds: string[]; // Master list of permanently sold seats
  selected: string[];
  onToggle: (seatId: string) => void;
  currency?: EventCurrency;
}

const SEAT_BASE =
  'flex items-center justify-center rounded-md text-[10px] font-medium select-none transition-colors';
const SEAT_SIZE = 'w-7 h-7 sm:w-8 sm:h-8';

const formatPrice = (price: number, currency: EventCurrency = 'HKD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
};

/**
 * Cinema seat map. Renders a screen at top, rows of seats below.
 * Status comes from the realtime `seats` map and the master `soldSeatIds` list.
 */
const SeatMap = ({ venue, seats, soldSeatIds, selected, onToggle, currency }: SeatMapProps) => {
  const { user } = useAuth();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const soldSet = useMemo(() => new Set(soldSeatIds || []), [soldSeatIds]); // Use master list
  const cur = currency ?? venue.currency ?? 'HKD';
  const atCap = selected.length >= MAX_MOVIE_SEATS_PER_ORDER;

  return (
    <div className="space-y-6">
      {/* Screen */}
      <div className="space-y-2">
        <div className="mx-auto h-2 w-3/4 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Screen
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="mx-auto inline-block space-y-1.5">
          {venue.rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-5 text-center text-xs font-semibold text-muted-foreground">
                {row.label}
              </span>
              <div className="flex gap-1.5">
                {row.seats.map((vs, idx) => {
                  if (vs.type === 'aisle') {
                    return <span key={`aisle-${row.label}-${idx}`} className="w-3" />;
                  }
                  const seatId = `${row.label}-${vs.label}`;
                  const live = seats[seatId];
                  const status = live?.status ?? 'available';
                  
                  const isMine = live?.heldBy === user?.uid;
                  const isSelected = selectedSet.has(seatId);
                  const isSold = soldSet.has(seatId); // Primary check for sold status

                  const disabled =
                    isSold || // Use the master list first
                    status === 'sold' || // Realtime status as fallback
                    status === 'blocked' ||
                    (status === 'held' && !isMine) ||
                    (!isSelected && atCap);

                  return (
                    <button
                      key={seatId}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggle(seatId)}
                      title={`Row ${row.label}, Seat ${vs.label} — ${formatPrice(row.price, cur)}`}
                      className={cn(
                        SEAT_BASE,
                        SEAT_SIZE,
                        'border',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : isSold || status === 'sold' // Styling based on sold status
                          ? 'bg-muted/60 text-muted-foreground border-border cursor-not-allowed opacity-60'
                          : status === 'held'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-not-allowed'
                          : status === 'blocked'
                          ? 'bg-destructive/20 border-destructive/40 cursor-not-allowed'
                          : 'bg-card border-border hover:border-primary/60 hover:bg-primary/10',
                        vs.type === 'wheelchair' && !isSelected && 'border-sky-500/40',
                      )}
                    >
                      {vs.type === 'wheelchair' ? (
                        <Accessibility className="w-3 h-3" />
                      ) : (
                        vs.label
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="w-5 text-center text-xs font-semibold text-muted-foreground">
                {row.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <LegendDot className="bg-card border border-border" label="Available" />
        <LegendDot className="bg-primary" label="Selected" />
        <LegendDot className="bg-amber-500/20 border border-amber-500/40" label="Held" />
        <LegendDot className="bg-muted/60 border border-border" label="Sold" />
        <span className="flex items-center gap-1.5">
          <Accessibility className="w-3 h-3 text-sky-400" /> Wheelchair
        </span>
      </div>

      {atCap && (
        <p className="text-center text-xs text-amber-400">
          Maximum {MAX_MOVIE_SEATS_PER_ORDER} seats per order.
        </p>
      )}
    </div>
  );
};

const LegendDot = ({ className, label }: { className: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span className={cn('inline-block w-3 h-3 rounded-sm', className)} />
    {label}
  </span>
);

export default SeatMap;

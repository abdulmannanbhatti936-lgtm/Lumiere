import { Minus, Plus } from 'lucide-react';

interface GuestCounterProps {
  guests: number;
  onGuestChange: (count: number) => void;
  maxGuests?: number;
}

export default function GuestCounter({
  guests,
  onGuestChange,
  maxGuests = 10,
}: GuestCounterProps) {
  return (
    <div className="card-luxury">
      <h3 className="font-semibold text-foreground mb-4">Number of Guests</h3>

      <div className="flex items-center justify-between">
        <button
          onClick={() => guests > 1 && onGuestChange(guests - 1)}
          className="p-2 hover:bg-muted rounded transition-colors disabled:opacity-50"
          disabled={guests <= 1}
        >
          <Minus size={20} />
        </button>

        <div className="text-2xl font-bold text-accent">{guests}</div>

        <button
          onClick={() => guests < maxGuests && onGuestChange(guests + 1)}
          className="p-2 hover:bg-muted rounded transition-colors disabled:opacity-50"
          disabled={guests >= maxGuests}
        >
          <Plus size={20} />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Maximum {maxGuests} guests
      </p>
    </div>
  );
}

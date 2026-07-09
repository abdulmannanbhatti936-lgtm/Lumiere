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
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => guests > 1 && onGuestChange(guests - 1)}
          className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center hover:border-accent hover:text-accent transition-colors disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-foreground"
          disabled={guests <= 1}
        >
          <Minus size={16} />
        </button>

        <div className="font-serif text-3xl text-accent">{guests}</div>

        <button
          onClick={() => guests < maxGuests && onGuestChange(guests + 1)}
          className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center hover:border-accent hover:text-accent transition-colors disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-foreground"
          disabled={guests >= maxGuests}
        >
          <Plus size={16} />
        </button>
      </div>

      <p className="label-caps !text-[9px] !text-muted-foreground mt-4 text-center">
        Maximum {maxGuests} guests
      </p>
    </div>
  );
}

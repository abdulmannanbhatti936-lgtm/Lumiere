import { Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Reveal from '@/components/motion/Reveal';

interface RoomOption {
  id: number;
  name: string;
  description: string | null;
  capacity: number;
  pricePerNight: string;
  totalUnits: number;
}

interface RoomSelectorProps {
  rooms: RoomOption[];
  selectedRoomId?: number;
  onSelect: (roomId: number) => void;
}

export default function RoomSelector({ rooms, selectedRoomId, onSelect }: RoomSelectorProps) {
  if (rooms.length === 0) {
    return (
      <div className="glass-panel p-16 text-center">
        <p className="text-muted-foreground">No rooms are configured for this hotel yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rooms.map((room, i) => {
        const isSelected = room.id === selectedRoomId;
        return (
          <Reveal key={room.id} delay={Math.min(i * 0.06, 0.3)}>
            <button
              type="button"
              onClick={() => onSelect(room.id)}
              className={`glass-panel w-full text-left p-6 transition-all ${
                isSelected ? 'border-accent/60 ring-2 ring-accent/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl mb-1">{room.name}</h3>
                  {room.description && (
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{room.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-3">
                    <Users size={14} className="text-accent" />
                    <span>Up to {room.capacity} guests</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-serif text-2xl text-accent">
                    {formatCurrency(Number(room.pricePerNight))}
                  </p>
                  <p className="label-caps !text-[9px] mt-1">per night</p>
                </div>
              </div>
            </button>
          </Reveal>
        );
      })}
    </div>
  );
}

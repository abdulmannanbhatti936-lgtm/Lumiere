import { Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
    return <p className="text-muted-foreground">No rooms are configured for this hotel yet.</p>;
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => {
        const isSelected = room.id === selectedRoomId;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            className={`card-luxury w-full text-left transition-colors ${
              isSelected ? 'border-2 border-accent' : 'border border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{room.name}</h3>
                {room.description && (
                  <p className="text-muted-foreground text-sm mt-1">{room.description}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                  <Users size={16} />
                  <span>Up to {room.capacity} guests</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(Number(room.pricePerNight))}
                </p>
                <p className="text-xs text-muted-foreground">per night</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

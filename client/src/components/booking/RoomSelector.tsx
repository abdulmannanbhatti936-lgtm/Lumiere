import { lazy, Suspense, useState } from 'react';
import { Users, Move3d, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Reveal from '@/components/motion/Reveal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const RoomPreview = lazy(() => import('@/components/3d/RoomPreview'));

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
  hotelCategory?: string;
}

function RoomPreviewFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );
}

export default function RoomSelector({ rooms, selectedRoomId, onSelect, hotelCategory }: RoomSelectorProps) {
  const [previewRoom, setPreviewRoom] = useState<RoomOption | null>(null);

  if (rooms.length === 0) {
    return (
      <div className="glass-panel p-16 text-center">
        <p className="text-muted-foreground">No rooms are configured for this hotel yet.</p>
      </div>
    );
  }

  // Normalizes each room's price against this hotel's own cheapest/priciest room, so the
  // 3D preview scales the room up (more space, more furniture) as price increases —
  // relative to its own hotel rather than a fixed dollar threshold, since a "Standard"
  // room at a luxury property can cost more than a "Suite" at a budget one.
  const prices = rooms.map((r) => Number(r.pricePerNight));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceTierOf = (room: RoomOption) =>
    maxPrice > minPrice ? (Number(room.pricePerNight) - minPrice) / (maxPrice - minPrice) : 0.5;

  return (
    <>
      <div className="space-y-4">
        {rooms.map((room, i) => {
          const isSelected = room.id === selectedRoomId;
          return (
            <Reveal key={room.id} delay={Math.min(i * 0.06, 0.3)}>
              <div
                className={`glass-panel w-full text-left p-6 transition-all ${
                  isSelected ? 'border-accent/60 ring-2 ring-accent/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <button type="button" onClick={() => onSelect(room.id)} className="text-left flex-1">
                    <h3 className="font-serif text-xl mb-1">{room.name}</h3>
                    {room.description && (
                      <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{room.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-3">
                      <Users size={14} className="text-accent" />
                      <span>Up to {room.capacity} guests</span>
                    </div>
                  </button>
                  <div className="text-right shrink-0">
                    <p className="font-serif text-2xl text-accent">
                      {formatCurrency(Number(room.pricePerNight))}
                    </p>
                    <p className="label-caps !text-[9px] mt-1">per night</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
                  <button
                    type="button"
                    onClick={() => onSelect(room.id)}
                    className={`text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select room'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewRoom(room)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary px-4 py-2 rounded-full border border-border hover:border-primary transition-colors"
                  >
                    <Move3d size={14} /> View in 3D
                  </button>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Dialog open={previewRoom !== null} onOpenChange={(open) => !open && setPreviewRoom(null)}>
        <DialogContent className="max-w-3xl w-[94vw] p-0 overflow-hidden gap-0 bg-card">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-serif text-xl">{previewRoom?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative h-[70vh] max-h-[520px] mt-4 border-y border-border">
            {previewRoom && (
              <Suspense fallback={<RoomPreviewFallback />}>
                <RoomPreview
                  roomName={previewRoom.name}
                  capacity={previewRoom.capacity}
                  hotelCategory={hotelCategory}
                  priceTier={priceTierOf(previewRoom)}
                />
              </Suspense>
            )}
            <div className="absolute top-4 left-4 glass-panel px-4 py-2.5 pointer-events-none">
              <span className="label-caps !text-[10px]">Live 3D Preview</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2 px-6 py-4">
            <Move3d size={15} className="text-primary shrink-0" /> Drag to rotate, scroll to zoom.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

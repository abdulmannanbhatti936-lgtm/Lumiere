import { Star, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ReviewCardProps {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
}

export default function ReviewCard({
  userName,
  rating,
  comment,
  createdAt,
}: ReviewCardProps) {
  return (
    <div className="glass-panel p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full border border-accent/30 bg-accent/10 flex items-center justify-center shrink-0">
          <User size={18} className="text-accent" />
        </div>
        <div>
          <p className="font-serif text-lg leading-tight">{userName}</p>
          <p className="label-caps !text-[9px] !text-muted-foreground mt-1">{formatDate(createdAt)}</p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? 'fill-accent text-accent' : 'text-muted'}
          />
        ))}
      </div>

      {/* Comment */}
      <p className="text-muted-foreground text-sm leading-relaxed">{comment}</p>
    </div>
  );
}

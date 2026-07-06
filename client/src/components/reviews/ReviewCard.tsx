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
    <div className="card-luxury">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <User size={20} className="text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'fill-accent text-accent' : 'text-muted'}
          />
        ))}
      </div>

      {/* Comment */}
      <p className="text-foreground text-sm leading-relaxed">{comment}</p>
    </div>
  );
}

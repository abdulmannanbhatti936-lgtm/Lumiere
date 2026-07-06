import { useState } from 'react';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  hotelId: number;
  onSubmit: (rating: number, comment: string) => void;
  isLoading?: boolean;
}

export default function ReviewForm({
  onSubmit,
  isLoading = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(rating, comment);
      setComment('');
      setRating(5);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-luxury">
      <h3 className="font-semibold text-foreground mb-4">Leave a Review</h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-2 block">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={24}
                className={
                  star <= (hoverRating || rating)
                    ? 'fill-accent text-accent'
                    : 'text-muted'
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-2 block">Your Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="input-luxury min-h-24 resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/500
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!comment.trim() || isLoading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

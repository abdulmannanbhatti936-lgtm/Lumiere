import { Star, MapPin } from 'lucide-react';
import { Link } from 'wouter';
import { formatCurrency } from '@/lib/utils';

interface HotelCardProps {
  id: number;
  name: string;
  city: string;
  country: string;
  starRating: number;
  imageUrl: string | null;
  price: number;
  amenities: string[];
  averageRating?: number | null;
  reviewCount?: number;
}

export default function HotelCard({
  id,
  name,
  city,
  country,
  starRating,
  imageUrl,
  price,
  amenities,
  averageRating,
  reviewCount,
}: HotelCardProps) {
  return (
    <Link href={`/hotel/${id}`}>
      <div className="card-luxury cursor-pointer group overflow-hidden">
        {/* Image */}
        <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=300&fit=crop'}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
            {formatCurrency(price )}/night
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
            {name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={16} />
            <span className="text-sm">{city}, {country}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < starRating ? 'fill-accent text-accent' : 'text-muted'}
              />
            ))}
            <span className="text-sm text-muted-foreground">({starRating}/5)</span>
            {averageRating != null && reviewCount ? (
              <span className="text-sm text-muted-foreground">
                · {averageRating} guest rating ({reviewCount})
              </span>
            ) : null}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2">
            {amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
              >
                {amenity}
              </span>
            ))}
          </div>

          {/* Button */}
          <button className="w-full btn-primary mt-4">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}

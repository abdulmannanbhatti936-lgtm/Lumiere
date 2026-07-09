import { Star, MapPin, ArrowRight, Sparkles } from 'lucide-react';
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
      <div className="group relative h-[440px] [perspective:1200px] cursor-pointer">
        <div className="relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
          {/* Front face */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 group-hover:border-primary/40 transition-colors duration-500 [backface-visibility:hidden]">
            <img
              src={imageUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=1000&fit=crop'}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/10" />

            <div
              className="absolute top-5 right-5 label-caps !text-[10px] px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md"
              style={{ background: 'hsl(0 0% 100% / 0.1)' }}
            >
              {formatCurrency(price)}
              <span className="text-muted-foreground normal-case tracking-normal">/night</span>
            </div>

            <div
              className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/15 backdrop-blur-xl p-5 flex flex-col items-start"
              style={{ background: 'hsl(0 0% 100% / 0.08)' }}
            >
              <span className="label-caps !text-[10px] mb-2 flex items-center gap-1.5">
                <MapPin size={12} /> {city}, {country}
              </span>
              <h3 className="font-serif text-2xl mb-2 leading-tight">{name}</h3>

              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className={i < starRating ? 'fill-accent text-accent' : 'text-muted'} />
                ))}
                {averageRating != null && reviewCount ? (
                  <span className="text-xs text-muted-foreground ml-1">
                    {averageRating} ({reviewCount})
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Back face — flips into view on hover, Voyara-style highlight reveal */}
          <div
            className="absolute inset-0 rounded-2xl border border-primary/30 p-7 flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ background: 'linear-gradient(160deg, hsl(var(--card)), hsl(var(--background)))' }}
          >
            <span className="label-caps !text-[10px] mb-1 flex items-center gap-1.5">
              <MapPin size={12} /> {city}, {country}
            </span>
            <h3 className="font-serif text-2xl mb-5 leading-tight">{name}</h3>

            <div className="space-y-3 flex-1 overflow-hidden">
              {amenities.length > 0 ? (
                amenities.slice(0, 5).map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Sparkles size={12} className="text-accent shrink-0" />
                    {amenity}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Full amenity details on the hotel page.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="font-serif text-xl text-accent">
                {formatCurrency(price)}
                <span className="text-xs text-muted-foreground normal-case tracking-normal"> /night</span>
              </span>
              <span className="label-caps !text-[10px] flex items-center gap-1.5">
                View Details <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

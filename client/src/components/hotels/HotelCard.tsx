import { Star, MapPin, Heart, ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import TiltCard from '@/components/motion/TiltCard';

const CATEGORY_LABELS: Record<string, string> = {
  beach: 'Beachfront',
  city: 'City Stay',
  mountain: 'Mountain View',
  boutique: 'Boutique',
};

interface HotelCardProps {
  id: number;
  name: string;
  city: string;
  country: string;
  starRating: number;
  imageUrl: string | null;
  price: number;
  amenities?: string[];
  averageRating?: number | null;
  reviewCount?: number;
  category?: string;
  layout?: 'vertical' | 'horizontal';
}

export default function HotelCard({
  id,
  name,
  city,
  country,
  starRating,
  imageUrl,
  price,
  averageRating,
  reviewCount,
  category,
  layout = 'vertical',
}: HotelCardProps) {
  const displayRating = averageRating ?? starRating;
  const tag = category ? CATEGORY_LABELS[category] ?? category : null;

  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: wishlistIds } = trpc.wishlist.listMineIds.useQuery(undefined, { enabled: isAuthenticated });
  const isWishlisted = wishlistIds?.includes(id) ?? false;
  const onWishlistError = () => toast.error('Could not update your saved stays. Please try again.');
  const addWishlist = trpc.wishlist.add.useMutation({
    onSuccess: () => utils.wishlist.listMineIds.invalidate(),
    onError: onWishlistError,
  });
  const removeWishlist = trpc.wishlist.remove.useMutation({
    onSuccess: () => utils.wishlist.listMineIds.invalidate(),
    onError: onWishlistError,
  });

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isWishlisted) removeWishlist.mutate({ hotelId: id });
    else addWishlist.mutate({ hotelId: id });
  };

  const wishlistButton = (
    <button
      type="button"
      onClick={toggleWishlist}
      aria-label={isWishlisted ? 'Remove from saved stays' : 'Save stay'}
      className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
        isWishlisted ? 'bg-primary text-primary-foreground' : 'bg-white/90 text-foreground hover:bg-white'
      }`}
    >
      <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
    </button>
  );

  const photo = imageUrl ? (
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
    />
  ) : (
    <div className="photo-placeholder absolute inset-0 flex items-center justify-center">
      <span className="photo-placeholder-caption">PHOTO — {city}, {country}</span>
    </div>
  );

  const viewBadge = (
    <span className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 text-primary flex items-center justify-center opacity-0 scale-75 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0">
      <ArrowUpRight size={16} />
    </span>
  );

  if (layout === 'horizontal') {
    return (
      <Link href={`/hotel/${id}`}>
        <TiltCard maxTilt={4} className="group glass-panel overflow-hidden cursor-pointer flex flex-col sm:flex-row transition-shadow duration-300 hover:shadow-xl">
          <div className="relative h-52 sm:h-auto sm:w-[280px] shrink-0 overflow-hidden">
            {photo}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent sm:hidden" />
            {wishlistButton}
            {viewBadge}
          </div>
          <div className="p-6 flex flex-col flex-1 justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className="font-serif text-xl font-semibold leading-tight transition-colors group-hover:text-primary">{name}</h3>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold bg-muted px-2.5 py-1 rounded-full">
                  <Star size={12} className="fill-accent text-accent" /> {displayRating}
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin size={13} /> {city}, {country}
              </p>
              {averageRating != null && reviewCount ? (
                <p className="text-sm text-muted-foreground mt-2">
                  {averageRating} guest rating ({reviewCount})
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div>
                {tag && <span className="label-caps !text-[10px] block mb-1">{tag}</span>}
                <span className="font-serif text-2xl text-primary">
                  {formatCurrency(price)}
                  <span className="text-xs text-muted-foreground font-sans normal-case"> / night</span>
                </span>
              </div>
              <span className="btn-secondary !py-2.5 text-sm">View stay</span>
            </div>
          </div>
        </TiltCard>
      </Link>
    );
  }

  return (
    <Link href={`/hotel/${id}`}>
      <TiltCard maxTilt={6} className="group glass-panel overflow-hidden cursor-pointer h-full flex flex-col transition-shadow duration-300 hover:shadow-xl">
        <div className="relative h-56 overflow-hidden">
          {photo}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent transition-opacity duration-300 group-hover:from-black/25" />
          {wishlistButton}
          {viewBadge}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-serif text-[19px] font-semibold leading-tight transition-colors group-hover:text-primary">{name}</h3>
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold bg-muted px-2 py-1 rounded-full">
              <Star size={12} className="fill-accent text-accent" /> {displayRating}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
            <MapPin size={13} /> {city}, {country}
          </p>
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
            {tag ? <span className="label-caps !text-[10px]">{tag}</span> : <span />}
            <span className="text-base font-bold">
              {formatCurrency(price)}
              <span className="text-xs text-muted-foreground font-normal"> / night</span>
            </span>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

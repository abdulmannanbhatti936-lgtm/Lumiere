import { useEffect, useState } from 'react';
import { useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import HotelCard from '@/components/hotels/HotelCard';
import Reveal from '@/components/motion/Reveal';
import { HotelCardSkeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import type { HotelsQueryInput, HotelCategory } from '@shared/validation';

const CATEGORY_OPTIONS: { label: string; value: HotelCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Beach', value: 'beach' },
  { label: 'City', value: 'city' },
  { label: 'Mountain', value: 'mountain' },
  { label: 'Boutique', value: 'boutique' },
];

const RATING_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '4.5+', value: 4.5 },
  { label: '4.8+', value: 4.8 },
];

const SORT_OPTIONS: { label: string; value: HotelsQueryInput['sortBy'] }[] = [
  { label: 'Recommended', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top rated', value: 'rating' },
];

export default function Hotels() {
  const searchParams = new URLSearchParams(useSearch());
  const initialCity = searchParams.get('city') ?? '';
  const initialCategory = (searchParams.get('category') as HotelCategory | null) ?? 'all';

  const [selectedCity] = useState(initialCity);
  const [category, setCategory] = useState<HotelCategory | 'all'>(initialCategory);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<HotelsQueryInput['sortBy']>('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [category, minRating, sortBy]);

  const { data, isLoading, isError } = trpc.hotels.list.useQuery({
    city: selectedCity || undefined,
    category: category === 'all' ? undefined : category,
    minRating: minRating || undefined,
    sortBy,
    page,
    limit: 10,
  });

  const hotels = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="bg-background pb-section-gap">
      <div className="container">
        <Reveal className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Search stays</h1>
          <p className="text-muted-foreground">Browse our collection of boutique hotels and villas.</p>
        </Reveal>

        {/* Mobile category chip row */}
        <div className="lg:hidden flex gap-2.5 overflow-x-auto no-scrollbar mb-6 pb-1">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategory(opt.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                category === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-gutter items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block w-[240px] shrink-0 glass-panel p-6 sticky top-[126px]">
            <h3 className="label-field mb-3">Category</h3>
            <div className="space-y-2.5 mb-7">
              {CATEGORY_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={category === opt.value}
                    onChange={() => setCategory(opt.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>

            <h3 className="label-field mb-3">Minimum rating</h3>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMinRating(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    minRating === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {pagination ? `${pagination.total} stay${pagination.total === 1 ? '' : 's'} found` : ' '}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as HotelsQueryInput['sortBy'])}
                className="input-luxury !w-auto text-sm py-2"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <HotelCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="glass-panel text-center py-16">
                <p className="text-muted-foreground text-lg">Something went wrong loading hotels. Please try again.</p>
              </div>
            ) : hotels.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={page}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {hotels.map((hotel) => (
                      <HotelCard
                        key={hotel.id}
                        layout="horizontal"
                        id={hotel.id}
                        name={hotel.name}
                        city={hotel.city}
                        country={hotel.country}
                        starRating={hotel.starRating}
                        imageUrl={hotel.imageUrl}
                        price={Number(hotel.basePrice)}
                        category={hotel.category}
                        averageRating={hotel.averageRating}
                        reviewCount={hotel.reviewCount}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-6 mt-14">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="btn-secondary disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="btn-secondary disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-panel text-center py-16">
                <p className="text-muted-foreground text-lg">No hotels found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

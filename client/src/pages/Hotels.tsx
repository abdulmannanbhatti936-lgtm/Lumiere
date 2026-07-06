import { useEffect, useState } from 'react';
import { Search, Filter, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useSearch } from 'wouter';
import HotelCard from '@/components/hotels/HotelCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { trpc } from '@/lib/trpc';
import type { HotelsQueryInput } from '@shared/validation';

export default function Hotels() {
  const initialCity = new URLSearchParams(useSearch()).get('city') ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [starRating, setStarRating] = useState(0);
  const [sortBy, setSortBy] = useState<HotelsQueryInput['sortBy']>('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery);
  const debouncedCity = useDebouncedValue(selectedCity);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedCity, maxPrice, starRating, sortBy]);

  const { data, isLoading, isError } = trpc.hotels.list.useQuery({
    search: debouncedSearch || undefined,
    city: debouncedCity || undefined,
    maxPrice,
    minStars: starRating || undefined,
    sortBy,
    page,
    limit: 12,
  });

  const hotels = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Discover Luxury Hotels</h1>
          <p className="text-muted-foreground text-lg">
            Browse our collection of premium accommodations worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="card-luxury sticky top-24">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-semibold text-foreground">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Search
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Hotel name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-luxury pl-10"
                  />
                </div>
              </div>

              {/* City Filter */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Any city..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="input-luxury"
                />
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Max Price: ${maxPrice}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-foreground mb-3 block">
                  Star Rating
                </label>
                <div className="space-y-2">
                  {[0, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={starRating === rating}
                        onChange={(e) => setStarRating(parseInt(e.target.value))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-foreground">
                        {rating === 0 ? 'All Ratings' : `${rating}+ Stars`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-foreground mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as HotelsQueryInput['sortBy'])}
                  className="input-luxury"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Star Rating</option>
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                  setMaxPrice(1000);
                  setStarRating(0);
                  setSortBy('newest');
                }}
                className="w-full btn-secondary"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Hotels Grid */}
          <div className="lg:col-span-3">
            {/* Filter Toggle for Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-6 btn-secondary flex items-center gap-2 w-full justify-center"
            >
              <Filter size={20} />
              Filters
            </button>

            {/* Results */}
            <div className="mb-6">
              <p className="text-muted-foreground">
                {pagination ? `Showing ${hotels.length} of ${pagination.total} hotels` : ' '}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-24">
                <Loader2 size={40} className="animate-spin text-accent" />
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Something went wrong loading hotels. Please try again.
                </p>
              </div>
            ) : hotels.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      id={hotel.id}
                      name={hotel.name}
                      city={hotel.city}
                      country={hotel.country}
                      starRating={hotel.starRating}
                      imageUrl={hotel.imageUrl}
                      price={Number(hotel.basePrice)}
                      amenities={hotel.amenities}
                      averageRating={hotel.averageRating}
                      reviewCount={hotel.reviewCount}
                    />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                      <ChevronLeft size={18} /> Prev
                    </button>
                    <span className="text-muted-foreground text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No hotels found matching your criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

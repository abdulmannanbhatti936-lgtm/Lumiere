export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-md ${className}`} />;
}

export function HotelCardSkeleton() {
  return (
    <div className="card-luxury">
      <Skeleton className="w-full h-48 mb-4" />
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-5 w-1/3" />
    </div>
  );
}

import { formatCurrency } from '@/lib/utils';

interface PriceBreakdownProps {
  pricePerNight: number;
  nights: number;
}

export default function PriceBreakdown({ pricePerNight, nights }: PriceBreakdownProps) {
  const total = pricePerNight * nights;

  if (nights <= 0) {
    return <p className="text-sm text-muted-foreground">Select your dates to see the total price.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {formatCurrency(pricePerNight)} × {nights} night{nights > 1 ? 's' : ''}
        </span>
        <span className="font-semibold">{formatCurrency(total)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
        <span>Total:</span>
        <span className="text-accent">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

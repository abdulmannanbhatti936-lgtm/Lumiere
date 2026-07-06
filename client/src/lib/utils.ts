import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay);
}

export function generateStars(rating: number): string[] {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push('full');
    } else if (i - rating < 1) {
      stars.push('half');
    } else {
      stars.push('empty');
    }
  }
  return stars;
}

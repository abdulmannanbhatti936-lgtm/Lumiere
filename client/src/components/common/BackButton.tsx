import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function BackButton({ fallbackHref = '/', label = 'Back', variant = 'light', className = '' }: BackButtonProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`back-button group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
        variant === 'dark'
          ? 'bg-black/30 text-white border border-white/25 backdrop-blur-md hover:bg-black/40'
          : 'bg-card border border-border text-foreground hover:border-primary/40'
      } ${className}`}
    >
      <span className="back-button-sweep" aria-hidden="true" />
      <ArrowLeft size={15} className="relative z-10 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

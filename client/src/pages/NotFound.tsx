import { Link } from 'wouter';
import { Home, ArrowLeft } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute -top-1/4 -left-1/4 w-[50vw] h-[50vw] aurora-glow-teal" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] aurora-glow" />
      <div className="absolute inset-0 hero-vignette" />

      <Reveal className="relative z-10 text-center max-w-md px-4">
        <div className="font-serif text-8xl md:text-9xl gradient-text text-glow mb-4">404</div>
        <span className="label-caps mb-4 block">Lost In Transit</span>
        <h1 className="font-serif text-3xl md:text-4xl mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Magnetic className="flex-1 block">
            <Link href="/">
              <button className="btn-primary flex items-center justify-center gap-2 w-full">
                <Home size={18} />
                Go Home
              </button>
            </Link>
          </Magnetic>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 w-full"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </Reveal>
    </div>
  );
}

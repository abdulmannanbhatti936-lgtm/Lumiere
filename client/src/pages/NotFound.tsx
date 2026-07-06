import { Link } from 'wouter';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-4xl font-bold text-foreground mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/">
            <button className="btn-primary flex items-center justify-center gap-2 w-full">
              <Home size={20} />
              Go Home
            </button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center gap-2 w-full"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

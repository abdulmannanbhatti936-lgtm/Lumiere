import { lazy, Suspense, useEffect, useState } from 'react';

const PreloaderAnimation = lazy(() => import('./PreloaderAnimation'));

export default function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => setVisible(false), 700);
  };

  useEffect(() => {
    // Safety net in case the Lottie asset/library fails to load or complete fires late.
    const fallback = setTimeout(dismiss, 6800);
    return () => clearTimeout(fallback);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-background transition-opacity duration-700"
      style={{ zIndex: 5000, opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-56 h-56 md:w-72 md:h-72">
          <Suspense fallback={null}>
            <PreloaderAnimation onComplete={dismiss} />
          </Suspense>
        </div>
        <span className="font-serif text-[19px] font-semibold text-foreground -mt-4">Lumière Stays</span>
      </div>
    </div>
  );
}

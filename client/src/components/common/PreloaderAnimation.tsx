import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface PreloaderAnimationProps {
  onComplete: () => void;
}

export default function PreloaderAnimation({ onComplete }: PreloaderAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/preloader-circular.json')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) onComplete();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!animationData) return null;

  return (
    <Lottie animationData={animationData} loop={false} autoplay onComplete={onComplete} className="w-full h-full" />
  );
}

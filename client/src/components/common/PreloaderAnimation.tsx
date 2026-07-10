import { useEffect, useRef, useState } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';

interface PreloaderAnimationProps {
  onComplete: () => void;
}

// The source Lottie file runs ~6s at its native frame rate (181 frames @ 30fps) —
// too long to block a splash screen on. Playing it back faster keeps the full,
// visually-complete animation but brings it down to a reasonable wait.
const PLAYBACK_SPEED = 3;

export default function PreloaderAnimation({ onComplete }: PreloaderAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

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
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={false}
      autoplay
      onComplete={onComplete}
      onDOMLoaded={() => lottieRef.current?.setSpeed(PLAYBACK_SPEED)}
      className="w-full h-full"
    />
  );
}

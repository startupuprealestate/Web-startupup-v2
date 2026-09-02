import * as React from 'react';
import { cn } from './cn';

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger the entrance against its siblings. */
  delay?: 0 | 100 | 200 | 300;
  /** Skip the animation and render revealed - useful for above-the-fold content. */
  immediate?: boolean;
  children?: React.ReactNode;
}

const DELAY: Record<number, string> = {
  0: '',
  100: 'delay-100',
  200: 'delay-200',
  300: 'delay-300',
};

/**
 * Fades and lifts its children into place once they scroll into view. Wrap a
 * section, or a few siblings with staggered `delay`s, to get the site's
 * entrance animation.
 */
export function Reveal({
  delay = 0,
  immediate = false,
  className,
  children,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = React.useState(immediate);

  React.useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    // No IntersectionObserver (SSR fallbacks, older engines) - show it rather than hide it.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  return (
    <div
      ref={ref}
      className={cn('reveal-on-scroll', DELAY[delay], revealed && 'is-revealed', className)}
      {...props}
    >
      {children}
    </div>
  );
}

import Image from 'next/image';

interface Props {
  /** Font size (px) of the "EyesTalk" wordmark. The mark scales with it. */
  fontSize?: number;
  /** Show the speech-bubble mark to the left. */
  showMark?: boolean;
  /** Show the breathing mint "live" dot after the word. */
  liveDot?: boolean;
  className?: string;
}

/**
 * EyesTalk wordmark lockup — gradient mark + "Eyes" (white) / "Talk" (violet
 * gradient) in Clash Display, with an optional breathing mint "live" dot.
 */
export function Wordmark({
  fontSize = 20,
  showMark = true,
  liveDot = false,
  className,
}: Props) {
  const mark = Math.round(fontSize * 1.8);
  const dot = Math.max(6, Math.round(fontSize * 0.28));

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: fontSize * 0.5 }}
    >
      {showMark && (
        <Image
          src="/logo-mark.svg"
          alt="EyesTalk"
          width={mark}
          height={mark}
          priority
          style={{ filter: 'drop-shadow(0 0 16px rgba(124,111,247,0.55))' }}
        />
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '-1px',
          fontSize,
          lineHeight: 1,
          color: 'var(--text-primary)',
        }}
      >
        Eyes
        <span className="text-gradient-primary">Talk</span>
      </span>
      {liveDot && (
        <span
          aria-hidden
          className="wordmark-live-dot"
          style={{ width: dot, height: dot, marginBottom: fontSize * 0.4 }}
        />
      )}
    </span>
  );
}

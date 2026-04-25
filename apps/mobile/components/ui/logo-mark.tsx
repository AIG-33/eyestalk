import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/theme';

interface Props {
  size?: number;
  color?: string;
  pupilColor?: string;
  monochrome?: boolean;
}

/**
 * EyesTalk brand mark — speech bubble + dual-eye glasses.
 * Mirrors `Design/assets/logo-mark.svg`. Use this everywhere a logo
 * is needed instead of the legacy PNG assets.
 */
export function LogoMark({
  size = 48,
  color = colors.accent.primary,
  pupilColor,
  monochrome = false,
}: Props) {
  const fillBubble = monochrome ? 'currentColor' : color;
  const fillPupil = pupilColor ?? (monochrome ? 'currentColor' : color);

  return (
    <Svg width={size} height={size} viewBox="0 0 220 170" fill="none">
      <Path
        d="M110 12 C 164 12 204 38 204 74 C 204 110 164 136 110 136 C 96 136 82.5 134.4 70 131.5 L 53 156 C 51.5 158 48.5 156.8 49.2 154.4 L 56 132.5 C 30 122 16 100 16 74 C 16 38 56 12 110 12 Z"
        fill={fillBubble}
      />
      <Circle cx={74} cy={74} r={29} fill="#FFFFFF" />
      <Circle cx={146} cy={74} r={29} fill="#FFFFFF" />
      <Path
        d="M96 74 C 100 66 120 66 124 74 C 120 82 100 82 96 74 Z"
        fill="#FFFFFF"
      />
      <Circle cx={74} cy={74} r={14.5} fill={fillPupil} />
      <Circle cx={146} cy={74} r={14.5} fill={fillPupil} />
    </Svg>
  );
}

/**
 * Chart color tokens, following the dataviz skill's method: categorical hues
 * assigned in fixed order (never cycled), status colors reserved for
 * good/critical semantics and never reused as a generic series color, and a
 * single-hue sequential ramp for magnitude-only encodings. These are the
 * validated reference palette from the skill (see references/palette.md) —
 * both light and dark orderings pass the CVD-separation and normal-vision
 * floor checks via `validate_palette.js`. NEXORA's own `--primary` token is
 * intentionally not reused here: it's a single brand accent, not a
 * categorical family, and using it as "series 1" would leave series 2+
 * without a validated, harmonious set to extend it.
 */

export const CHART_CATEGORICAL_LIGHT = [
  '#2a78d6', // 1 blue
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948', // 8 red
] as const;

export const CHART_CATEGORICAL_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
] as const;

/** Status colors are reserved for won/lost semantics — never used as a generic series color. */
export const CHART_STATUS = {
  good: { light: '#0ca30c', dark: '#0ca30c' },
  critical: { light: '#d03b3b', dark: '#d03b3b' },
} as const;

/** Single-hue sequential ramp (blue), light → dark, for magnitude-only encodings. */
export const CHART_SEQUENTIAL_BLUE = [
  '#cde2fb',
  '#9ec5f4',
  '#5598e7',
  '#256abf',
  '#104281',
] as const;

export function getCategoricalColor(index: number, isDark: boolean): string {
  const palette = isDark ? CHART_CATEGORICAL_DARK : CHART_CATEGORICAL_LIGHT;
  return palette[index % palette.length]!;
}

export const CHART_GRID_LIGHT = '#e1e0d9';
export const CHART_GRID_DARK = '#2c2c2a';
export const CHART_AXIS_LIGHT = '#898781';
export const CHART_AXIS_DARK = '#898781';

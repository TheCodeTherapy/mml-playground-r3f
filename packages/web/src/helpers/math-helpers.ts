export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function repeat(t: number, length: number) {
  return clamp(t - Math.floor(t / length) * length, 0, length);
}

export function deltaAngle(current: number, target: number) {
  let delta = repeat(target - current, 360);
  if (delta > 180) delta -= 360;
  return delta;
}

export function deltaAngleRad(current: number, target: number) {
  let delta = repeat(target - current, 360 * (Math.PI / 180));
  if (delta > 180 * (Math.PI / 180)) delta -= 360 * (Math.PI / 180);
  return delta;
}

export const round = (n: number, digits: number): number => {
  return Number(n.toFixed(digits));
};

export const ease = (target: number, n: number, factor: number): number => {
  return round((target - n) * factor, 5);
};

export const remap = (
  value: number,
  minValue: number,
  maxValue: number,
  minScaledValue: number,
  maxScaledValue: number
): number => {
  return minScaledValue + ((maxScaledValue - minScaledValue) * (value - minValue)) / (maxValue - minValue);
};

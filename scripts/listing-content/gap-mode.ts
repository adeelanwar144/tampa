let enabled = false;

export function setGapMode(value: boolean): void {
  enabled = value;
}

export function isGapMode(): boolean {
  return enabled;
}

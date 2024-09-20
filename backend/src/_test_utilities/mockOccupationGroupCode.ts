let _code = 0;
export function getMockRandomOccupationGroupCode(): string {
  if (_code > 9999) {
    console.warn("Codes is exhausted! Recycling");
    _code = 0;
  }
  return (_code++).toString().padStart(4, "0");
}

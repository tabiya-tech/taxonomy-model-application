let _iscoCode = 0;
export function getMockRandomISCOGroupCode(): string {
  if (_iscoCode > 9999) {
    console.warn("ISCO codes is exhausted! Recycling");
    _iscoCode = 0;
  }
  return (_iscoCode++).toString().padStart(4, "0");
}

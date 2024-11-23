let _code = 0;
export function getMockRandomISCOGroupCode(): string {
  if (_code > 9999) {
    console.warn("Codes is exhausted! Recycling");
    _code = 0;
  }
  return (_code++).toString();
}
let _alphabetIndex = 0;
const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function getMockRandomLocalGroupCode(): string {
  if (_alphabetIndex >= characters.length) {
    console.warn("Alphabet is exhausted! Recycling");
    _alphabetIndex = 0;
  }
  return characters[_alphabetIndex++];
}

export function resetMockRandomISCOGroupCode(): void {
  _code = 0;
}

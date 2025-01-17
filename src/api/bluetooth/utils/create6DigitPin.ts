// Creates a string of 6 digits and ensures the first digit will never be 0
export function create6DigitPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

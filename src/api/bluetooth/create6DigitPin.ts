// Creates a number of 6 digits and ensures the first digit will never be 0
export function create6DigitPin(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

export function newRunSeed() {
  const input = new URLSearchParams(window.location.search).get("seed");
  if (input !== null && /^\d+$/.test(input)) {
    const seed = Number(input);
    if (Number.isSafeInteger(seed) && seed < 2 ** 31) return seed;
  }
  return Math.floor(Math.random() * 2 ** 31);
}

export function truncateNumber(num: number, decPlaces: number): string {
  const [beforeDec, afterDec] = num.toString().split(".");

  if (afterDec) {
    return `${beforeDec}.${afterDec.slice(0, decPlaces)}`;
  }

  return beforeDec;
}

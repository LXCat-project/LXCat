export const linspace = (
  start: number,
  stop: number,
  cardinality: number,
): Array<number> => {
  const step = (stop - start) / (cardinality - 1);
  return Array.from({ length: cardinality }, (_, i) => start + i * step);
};

export const logspace = (
  start: number,
  stop: number,
  cardinality: number,
): Array<number> => {
  const linStart = Math.log10(start);
  const linStop = Math.log10(stop);

  return linspace(linStart, linStop, cardinality).map(element =>
    Math.pow(10, element)
  );
};

export const quadraticspace = (
  start: number,
  stop: number,
  cardinality: number,
): Array<number> => {
  const linStart = Math.sqrt(start);
  const linStop = Math.sqrt(stop);

  return linspace(linStart, linStop, cardinality).map(element =>
    Math.pow(element, 2)
  );
};

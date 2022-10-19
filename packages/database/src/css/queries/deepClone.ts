export function deepClone<T>(i: T): T {
  return JSON.parse(JSON.stringify(i));
}

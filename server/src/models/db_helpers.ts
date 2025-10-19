// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractArraysByKeys<T extends Record<string, any>, K extends keyof T>(
  objects: T[],
  keys: K[]
): Array<T[K][]> {
  return keys.map(key => objects.map(obj => obj[key]));
}

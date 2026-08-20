export const compactInput = <TOutput extends object>(
  input: object,
): Partial<TOutput> =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== null),
  ) as Partial<TOutput>;

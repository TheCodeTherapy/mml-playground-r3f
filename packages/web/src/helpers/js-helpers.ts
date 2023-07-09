export const caseInsensitiveMatch = (a: string, b: string): boolean => {
  return a.toString().toLocaleLowerCase() === b;
};

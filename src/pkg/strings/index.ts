export const removeQuotes = (value: string) => {
  return value ? value.replace(/^"(.+)"$/, '$1') : value
}

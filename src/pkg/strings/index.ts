export const removeQuotes = (value: string) => {
  return value.replace(/^"(.+)"$/, '$1')
}

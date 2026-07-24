const DECIMAL_DEGREES = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/

export const validLatitude = (value: string) => {
  const trimmed = value.trim()
  if (!DECIMAL_DEGREES.test(trimmed)) return false
  const number = Number(trimmed)
  return Number.isFinite(number) && number >= -90 && number <= 90
}

export const validLongitude = (value: string) => {
  const trimmed = value.trim()
  if (!DECIMAL_DEGREES.test(trimmed)) return false
  const number = Number(trimmed)
  return Number.isFinite(number) && number >= -180 && number <= 180
}

export const parseCoordinatePair = (value: string) => {
  const match = value.trim().match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/,
  )
  if (!match || !validLatitude(match[1]) || !validLongitude(match[2])) return undefined
  return { latitude: match[1], longitude: match[2] }
}

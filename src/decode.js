const builtinRefs = {
  $undef: undefined,
  $null: null,
  $nan: NaN,
  $inf: Infinity
}

export function decode (input, refs) {
  if (input === '' || input === '?') return {}
  if (input.charAt(0) !== '?') throw new Error()

  const result = {}
  const localRefs = { ...builtinRefs, ...refs }
  const cursor = 1

  function peekChar () {
    return input.charAt(cursor)
  }

  function readRawString (endDelimiter) {

  }

  function readKey () {
    const ch = peekChar()
    if (ch === '?') {
      readRawString('=')
    }
  }

  function readValue () {

  }

  while (true) {
    const key = readKey()
    const keyDelimiter = peekChar()
    if (keyDelimiter === '' || keyDelimiter === '&') {
      result[key] = !key.startsWith('-')
      if (keyDelimiter === '') break
    } else if (keyDelimiter === '=') {
      const value = readValue()
      result[key] = value
    } else {
      throw new Error()
    }
  }
}

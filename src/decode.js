const builtinRefs = {
  $undef: undefined,
  $null: null,
  $true: true,
  $false: false,
  $nan: NaN,
  $inf: Infinity,
  $date: (time) => {
    return new Date(time)
  },
  $regexp: (source, flags) => {
    return new RegExp(source, flags)
  },
  $bigint: (str) => {
    // eslint-disable-next-line no-undef
    return BigInt(str)
  }
}

export function decode (input, refs) {
  if (input === '' || input === '?') return {}
  if (input.charAt(0) !== '?') throw new Error()

  const localRefs = { ...builtinRefs, ...refs }

  let cursor = 1

  function peek () {
    return input.charAt(cursor)
  }

  function findIndex (endDelimiter, startIndex) {
    if (typeof endDelimiter === 'string') {
      return input.indexOf(endDelimiter, startIndex)
    }
    endDelimiter.lastIndex = startIndex
    const match = endDelimiter.exec(input)
    if (match) return match.index
    return -1
  }

  function readUntil (endDelimiter) {
    const endIndex = findIndex(endDelimiter, cursor)
    if (endIndex === -1) {
      const str = input.slice(cursor)
      cursor = input.length
      return str
    }
    const str = input.slice(cursor, endIndex)
    cursor = endIndex
    return str
  }

  function readRawString () {
    cursor++
    const str = readUntil(/\?[,;=&]/g)
    if (cursor < input.length) {
      cursor++
    }
    return str
  }

  function readString () {
    const ch = peek()

    let str
    if (ch === '?') {
      str = readRawString()
    } else {
      str = readUntil(/[,;=&]/g)
    }

    return decodeURIComponent(str)
  }

  function readArray (setRefEarly) {
    cursor++

    const result = []
    if (setRefEarly) {
      setRefEarly(result)
    }

    const ch = peek()
    if (ch === ';' || ch === '&' || ch === '') {
      if (ch === ';') {
        cursor++
      }
      return result
    }

    while (true) {
      const value = readValue()
      result.push(value)

      const ch = peek()
      if (ch === ';') {
        cursor++
        break
      }
      if (ch !== ',') {
        break
      }
      cursor++
    }
    return result
  }

  function readDictInner (setRefEarly) {
    const result = {}
    if (setRefEarly) {
      setRefEarly(result)
    }

    while (true) {
      const ch = peek()
      if (ch === ';' || ch === '&' || ch === '') {
        if (ch === ';') {
          cursor++
        }
        break
      }

      const key = readString()
      const ch2 = peek()

      if (ch2 === '' || ch2 === '&') {
        if (key.startsWith('-')) {
          result[key.slice(1)] = false
        } else {
          result[key] = true
        }
        if (ch2 === '') break
      } else if (ch2 === '=') {
        cursor++
        const value = readValue()
        result[key] = value
      } else {
        throw new Error()
      }
      const ch3 = peek()
      if (ch3 !== '&') {
        break
      }
      cursor++
    }

    return result
  }

  function readDict (setRefEarly) {
    cursor++

    const result = readDictInner(setRefEarly)

    const ch = peek()
    if (ch === ';') {
      cursor++
    }

    return result
  }

  function readValue (setRefEarly) {
    const ch = peek()

    if (ch === '&' || ch === '') {
      return ''
    }

    if (/^[0-9]$/.test(ch)) {
      const reg = /(?:[1-9][0-9]*|0)\$/gy
      reg.lastIndex = cursor
      const match = reg.exec(input)
      if (match !== null) {
        cursor = reg.lastIndex
        const key = match[0].slice(0, -1)
        const value = readValue((value) => {
          localRefs[`$${key}`] = value
        })
        localRefs[`$${key}`] = value
        return value
      }
      const str = readUntil(/[,;=&]/g)
      const num = Number(str)
      if (isNaN(num)) {
        return decodeURIComponent(str)
      }
      return num
    }

    if (ch === ':') {
      return readArray(setRefEarly)
    }

    if (ch === '$') {
      const key = readUntil(/[^A-Za-z0-9_$]/g)
      if (peek() === ':') {
        const params = readArray()
        return localRefs[key](...params)
      }
      const value = localRefs[key]
      return value
    }

    if (ch === '-') {
      cursor++
      const value = readValue()
      return -value
    }

    if (ch === '+') {
      return readDict(setRefEarly)
    }

    return readString()
  }

  return readDictInner()
}

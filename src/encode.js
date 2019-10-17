export function encode (obj) {
  let buffer = ''

  const objMetaMap = new Map()
  const dupSet = new Set()

  function emit (value) {
    buffer += value
  }

  function emitDate (value) {
    emit('$date+')
    emitValue(value.getTime())
    emit(';')
  }

  function emitRegExp (value) {
    emit('$regexp+')
    emitValue(value.source)
    emit(',')
    emitValue(value.flags)
    emit(';')
  }

  function emitValue (value, endDelimiter) {
    switch (typeof value) {
      case 'undefined': {
        emit('$undef')
        return
      }
      case 'boolean': {
        if (value) {
          emit('$true')
        } else {
          emit('$false')
        }
        return
      }
      case 'string': {
        emitString(value, endDelimiter)
        return
      }
      case 'object': {
        if (value === null) return emit('$null')
        const objMeta = objMetaMap.get(value)
        if (objMeta != null) {
          objMeta.uses.push(buffer.length)
          dupSet.add(objMeta)
          return
        }
        objMetaMap.set(value, {
          def: buffer.length,
          uses: []
        })
        if (Array.isArray(value)) {
          emitArray(value, endDelimiter)
          return
        }
        if (value instanceof Date) {
          emitDate(value)
          return
        }
        if (value instanceof RegExp) {
          emitRegExp(value)
          return
        }
        emitObject(value, endDelimiter)
        return
      }
      case 'number': {
        if (isNaN(value)) return emit('$nan')
        if (value === Infinity) return emit('$inf')
        if (value === -Infinity) return emit('-$inf')
        return emit(`${value}`)
      }
      // Fallthrough
      case 'bigint': {
        return emit(`$bigint+${value};`)
      }
      case 'symbol':
      case 'function':
      default: {
        throw new Error('Not supported')
      }
    }
  }

  function emitString (str, endDelimiter) {
    str = str.replace(/[^A-Za-z0-9-._~?/:@$&+,;=]+/g, (m) => encodeURIComponent(m))

    if (/[,;&=]/.test(str) || /^[+\-$?:0-9]/.test(str)) {
      str = str.replace(/\?[,;=&]/g, (m) => `?${encodeURIComponent(m.charAt(1))}`)
      if (endDelimiter === '') {
        emit(`?${str}`)
        return
      }
      emit(`?${str}?`)
      return
    }

    emit(str)
  }

  function emitPair (key, value, endDelimiter) {
    if (value === false) {
      emit('-')
    }

    if (typeof value === 'boolean') {
      emitString(key, endDelimiter)
      return
    }

    emitString(key, '=')
    emit('=')
    emitValue(value, endDelimiter)
  }

  function emitObjectInner (obj, endDelimiter) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const isLast = i === keys.length - 1
      if (isLast) {
        emitPair(key, obj[key], endDelimiter)
      } else {
        emitPair(key, obj[key], '&')
        emit('&')
      }
    }
  }

  function emitObject (obj, endDelimiter) {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      if (endDelimiter === '&' || endDelimiter === '') {
        emit(':')
      } else {
        emit(':;')
      }
    } else {
      emit(':')
      if (endDelimiter === '') {
        emitObjectInner(obj, '')
      } else {
        emitObjectInner(obj, ';')
        emit(';')
      }
    }
  }

  function emitArray (arr, endDelimiter) {
    emit('+')
    for (let i = 0; i < arr.length; i++) {
      const value = arr[i]
      const isLast = i === arr.length - 1
      emitValue(value, ',')
      if (!isLast) {
        emit(',')
      }
    }
    if (!(endDelimiter === '' || endDelimiter === '&')) {
      emit(';')
    }
  }

  function insertDefsAndUses () {
    let nextRefId = 0
    const refIdMap = new Map()
    const toInsert = []
    for (const dup of dupSet) {
      let refId = refIdMap.get(dup)
      if (refId == null) {
        refId = nextRefId++
        refIdMap.set(dup, refId)
      }
      toInsert.push({
        offset: dup.def,
        token: `${refId}$`
      })
      for (const use of dup.uses) {
        toInsert.push({
          offset: use,
          token: `$${refId}`
        })
      }
    }
    toInsert.sort((a, b) => a.offset - b.offset)
    let newBuffer = ''
    let lastOffset = 0
    for (const { offset, token } of toInsert) {
      if (offset > lastOffset) {
        newBuffer += buffer.slice(lastOffset, offset)
      }
      newBuffer += token
      lastOffset = offset
    }
    if (lastOffset < buffer.length) {
      newBuffer += buffer.slice(lastOffset, buffer.length)
    }
    buffer = newBuffer
  }

  emit('?')
  emitObjectInner(obj, '')

  if (dupSet.size > 0) {
    insertDefsAndUses()
  }

  return buffer
}

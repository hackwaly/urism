import { encode } from './encode'

test('encode undefined', () => {
  expect(encode({ a: undefined })).toBe('?')
  expect(encode({ a: undefined, b: 1 })).toBe('?b=1')
  expect(encode({ a: [undefined] })).toBe('?a=:$undef')
})

test('encode null, undefined', () => {
  expect(encode({ a: null })).toBe('?a=$null')
})

test('encode true, false', () => {
  expect(encode({ a: true })).toBe('?a')
  expect(encode({ a: false })).toBe('?-a')
  expect(encode({ a: true, b: true })).toBe('?a&b')
  expect(encode({ a: true, b: false })).toBe('?a&-b')
  expect(encode({ a: false, b: true })).toBe('?-a&b')
  expect(encode({ a: [true] })).toBe('?a=:$true')
  expect(encode({ a: [false] })).toBe('?a=:$false')
})

test('encode number', () => {
  expect(encode({ a: 0 })).toBe('?a=0')
  expect(encode({ a: Infinity })).toBe('?a=$inf')
  expect(encode({ a: -Infinity })).toBe('?a=-$inf')
  expect(encode({ a: NaN })).toBe('?a=$nan')
  expect(encode({ a: 123 })).toBe('?a=123')
  expect(encode({ a: 1.23 })).toBe('?a=1.23')
  expect(encode({ a: -5 })).toBe('?a=-5')
  expect(encode({ a: 1e5 })).toBe('?a=1e5')
})

test('encode bigint', () => {
  // eslint-disable-next-line no-eval
  expect(encode({ a: eval('100000000000n') })).toBe('?a=$bigint:100000000000;')
})

test('encode string', () => {
  expect(encode({ a: '' })).toBe('?a=')
  expect(encode({ a: '', b: true })).toBe('?a=&b')
  expect(encode({ a: '0' })).toBe('?a=?0')
  expect(encode({ a: '123' })).toBe('?a=?123')
  expect(encode({ a: '-123' })).toBe('?a=?-123')
  expect(encode({ a: '-123', b: true })).toBe('?a=?-123?&b')
  expect(encode({ a: '1.0.0' })).toBe('?a=1.0.0')
  expect(encode({ a: '63510009-e258-4162-8bbe-7e61c9ddcfd8' })).toBe('?a=63510009-e258-4162-8bbe-7e61c9ddcfd8')
  expect(encode({ a: 'hello' })).toBe('?a=hello')
  expect(encode({ a: 'hello world' })).toBe('?a=hello%20world')
  expect(encode({ a: 'hello 中国' })).toBe('?a=hello%20%E4%B8%AD%E5%9B%BD')
  expect(encode({ a: 'git@github.com:hackwaly/urism.git' })).toBe('?a=git@github.com:hackwaly/urism.git')
  expect(encode({ a: 'git@github.com:hackwaly/urism.git#master' })).toBe('?a=git@github.com:hackwaly/urism.git%23master')
  expect(encode({ a: '$100' })).toBe('?a=?$100')
  expect(encode({ a: 'a+-:@/$;=?' })).toBe('?a=?a+-:@/$;=?')
  expect(encode({ a: 'a+-:@/$,;=?' })).toBe('?a=?a+-:@/$,;=?')
  expect(encode({ a: 'a+-:@/&' })).toBe('?a=?a+-:@/&')
})

test('encode array', () => {
  expect(encode({ a: [] })).toBe('?a=:')
  expect(encode({ a: [1] })).toBe('?a=:1')
  expect(encode({ a: [1, 2, 3] })).toBe('?a=:1,2,3')
  expect(encode({ a: [',', 1] })).toBe('?a=:?,?,1')
  expect(encode({ a: [',', 1] })).toBe('?a=:?,?,1')
  expect(encode({ a: [1], b: true })).toBe('?a=:1&b')
  expect(encode({ a: [[1, 2], 3] })).toBe('?a=::1,2;,3')
})

test('encode object', () => {
  expect(encode({ a: {} })).toBe('?a=+')
  expect(encode({ a: {}, b: true })).toBe('?a=+&b')
  expect(encode({ a: { b: {} } })).toBe('?a=+b=+')
  expect(encode({ a: { b: {}, c: true } })).toBe('?a=+b=+&c')
})

test('encode cyclic reference', () => {
  const a = {}
  a.a = a
  expect(encode({ a })).toBe('?a=0$+a=$0')
})

test('encode date', () => {
  function withTimezoneOffset (date, offset) {
    const result = new Date(date.getTime())
    result.getTimezoneOffset = () => offset
    return result
  }
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0), 0) })).toBe('?a=$date:2019Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 1), 0) })).toBe('?a=$date:2019-02Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0, 2), 0) })).toBe('?a=$date:2019-01-02Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0, 1, 1), 0) })).toBe('?a=$date:2019-01-01T01:00Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0, 1, 1, 1), 0) })).toBe('?a=$date:2019-01-01T01:01Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0, 1, 1, 1, 1), 0) })).toBe('?a=$date:2019-01-01T01:01:01Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0, 1, 1, 1, 1, 1), 0) })).toBe('?a=$date:2019-01-01T01:01:01.001Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0, 1, 1, 1, 1, 999), 0) })).toBe('?a=$date:~2019-01-01T01:01:02Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0, 1, 1, 1, 59, 999), 0) })).toBe('?a=$date:~2019-01-01T01:02Z;')
  expect(encode({ a: withTimezoneOffset(new Date(2019, 0), -480) })).toBe('?a=$date:2019+08;')
})

test('encode regexp', () => {
  expect(encode({ a: /a|b/g })).toBe('?a=$regexp:a%7Cb,g;')
})

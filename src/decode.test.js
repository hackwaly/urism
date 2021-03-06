import { decode } from './decode'

test('decode null, undefined', () => {
  expect(decode('?a=$null')).toEqual({ a: null })
  expect(decode('?a=$undef')).toEqual({ a: undefined })
})

test('decode true, false', () => {
  expect(decode('?a')).toEqual({ a: true })
  expect(decode('?-a')).toEqual({ a: false })
  expect(decode('?a&b')).toEqual({ a: true, b: true })
  expect(decode('?a&-b')).toEqual({ a: true, b: false })
  expect(decode('?-a&b')).toEqual({ a: false, b: true })
  expect(decode('?a=:$true')).toEqual({ a: [true] })
  expect(decode('?a=:$false')).toEqual({ a: [false] })
})

test('decode number', () => {
  expect(decode('?a=0')).toEqual({ a: 0 })
  expect(decode('?a=$inf')).toEqual({ a: Infinity })
  expect(decode('?a=-$inf')).toEqual({ a: -Infinity })
  expect(decode('?a=$nan')).toEqual({ a: NaN })
  expect(decode('?a=123')).toEqual({ a: 123 })
  expect(decode('?a=1.23')).toEqual({ a: 1.23 })
  expect(decode('?a=-5')).toEqual({ a: -5 })
  expect(decode('?a=100000')).toEqual({ a: 1e5 })
  expect(decode('?a=1e5')).toEqual({ a: 1e5 })
})

try {
  /* eslint-disable no-eval */
  eval('100000000000n')
  test('decode bigint', () => {
    expect(decode('?a=$bigint:100000000000;')).toEqual({ a: eval('100000000000n') })
  })
} catch (ex) {}

test('decode string', () => {
  expect(decode('?a=')).toEqual({ a: '' })
  expect(decode('?a=&b')).toEqual({ a: '', b: true })
  expect(decode('?a=?0')).toEqual({ a: '0' })
  expect(decode('?a=?123')).toEqual({ a: '123' })
  expect(decode('?a=0123')).toEqual({ a: '0123' })
  expect(decode('?a=?-123')).toEqual({ a: '-123' })
  expect(decode('?a=?-123?&b')).toEqual({ a: '-123', b: true })
  expect(decode('?a=1.0.0')).toEqual({ a: '1.0.0' })
  expect(decode('?a=63510009-e258-4162-8bbe-7e61c9ddcfd8')).toEqual({ a: '63510009-e258-4162-8bbe-7e61c9ddcfd8' })
  expect(decode('?a=hello')).toEqual({ a: 'hello' })
  expect(decode('?a=hello%20world')).toEqual({ a: 'hello world' })
  expect(decode('?a=hello%20%E4%B8%AD%E5%9B%BD')).toEqual({ a: 'hello 中国' })
  expect(decode('?a=git@github.com:hackwaly/urism.git')).toEqual({ a: 'git@github.com:hackwaly/urism.git' })
  expect(decode('?a=git@github.com:hackwaly/urism.git%23master')).toEqual({ a: 'git@github.com:hackwaly/urism.git#master' })
  expect(decode('?a=?$100')).toEqual({ a: '$100' })
  expect(decode('?a=?a+-:@/$;=?')).toEqual({ a: 'a+-:@/$;=?' })
  expect(decode('?a=?a+-:@/$,;=?')).toEqual({ a: 'a+-:@/$,;=?' })
  expect(decode('?a=?a+-:@/&')).toEqual({ a: 'a+-:@/&' })
  expect(decode('?a=1%202')).toEqual({ a: '1 2' })
})

test('decode array', () => {
  expect(decode('?a=:')).toEqual({ a: [] })
  expect(decode('?a=:?=')).toEqual({ a: ['='] })
  expect(decode('?a=:1')).toEqual({ a: [1] })
  expect(decode('?a=:1,2,3')).toEqual({ a: [1, 2, 3] })
  expect(decode('?a=:?,?,1')).toEqual({ a: [',', 1] })
  expect(decode('?a=:?,?,1')).toEqual({ a: [',', 1] })
  expect(decode('?a=:1&b')).toEqual({ a: [1], b: true })
  expect(decode('?a=::1,2;,3')).toEqual({ a: [[1, 2], 3] })
})

test('decode object', () => {
  expect(decode('?a=+')).toEqual({ a: {} })
  expect(decode('?a=+&b')).toEqual({ a: {}, b: true })
  expect(decode('?a=+b=+')).toEqual({ a: { b: {} } })
  expect(decode('?a=+b=+&c')).toEqual({ a: { b: {}, c: true } })
  expect(decode('?a=+b&-c;&d=1')).toEqual({ a: { b: true, c: false }, d: 1 })
})

test('decode cyclic reference', () => {
  const a = {}
  a.a = a
  expect(decode('?a=0$+a=$0').a).toEqual(a)
})

test('decode date', () => {
  expect(decode('?a=$date:2017-01-01T08:00+08;')).toEqual({ a: new Date(1483228800000) })
})

test('decode regexp', () => {
  expect(decode('?a=$regexp:a%7Cb,g;')).toEqual({ a: /a|b/g })
})

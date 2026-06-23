import { test } from 'node:test'
import assert from 'node:assert'
import { cn } from './utils.ts'

test('cn utility', async (t) => {
  await t.test('concatenates classes', () => {
    assert.strictEqual(cn('a', 'b'), 'a b')
  })

  await t.test('handles conditional classes', () => {
    assert.strictEqual(cn('a', true && 'b', false && 'c'), 'a b')
    assert.strictEqual(cn('a', null, undefined, 0, false, 'b'), 'a b')
  })

  await t.test('handles objects', () => {
    assert.strictEqual(cn({ 'a': true, 'b': false }), 'a')
    assert.strictEqual(cn('base', { 'extra': true }), 'base extra')
  })

  await t.test('handles arrays', () => {
    assert.strictEqual(cn(['a', 'b'], 'c'), 'a b c')
    assert.strictEqual(cn(['a', ['b', 'c']]), 'a b c')
  })

  await t.test('handles mixed inputs', () => {
    assert.strictEqual(cn('a', ['b', { 'c': true, 'd': false }], 'e'), 'a b c e')
  })

  await t.test('merges tailwind classes', () => {
    // twMerge should resolve conflicts, e.g., p-4 overrides px-2 and py-2
    assert.strictEqual(cn('px-2 py-2', 'p-4'), 'p-4')
  })
})

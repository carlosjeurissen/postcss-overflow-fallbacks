import {
  expect,
  test,
} from 'vitest';

import postcss from 'postcss';

import plugin from './index.js';

async function run (input, output, opts = {}) {
  const result = await postcss([plugin(opts)]).process(input, { from: undefined });
  expect(result.css).toEqual(output);
  expect(result.warnings()).toHaveLength(0);
}

test('adds a fallback for overflow: clip', async () => {
  await run('a{ overflow: clip; }', 'a{ overflow: hidden; overflow: clip; }', {});
});

test('adds a fallback for overflow-block: clip', async () => {
  await run('a{ overflow-block: clip; }', 'a{ overflow-block: hidden; overflow-block: clip; }', {});
});

test('adds a fallback for overflow: overlay', async () => {
  await run('a{ overflow: overlay; }', 'a{ overflow: auto; overflow: overlay; }', {});
});

test('adds a fallback for overflow-x: overlay', async () => {
  await run('a{ overflow-x: overlay; }', 'a{ overflow-x: auto; overflow-x: overlay; }', {});
});

test('does not add a fallback for overflow: clip if a fallback is already present', async () => {
  await run('a{ overflow: hidden; overflow: clip; }', 'a{ overflow: hidden; overflow: clip; }', {});
});

test('does not add a fallback for overflow: clip if a fallback is already present', async () => {
  await run('a{ overflow: hidden !important; overflow: clip; }', 'a{ overflow: hidden !important; overflow: clip; }', {});
});

test('does add a fallback for overflow: clip if overflow: clip is present twice', async () => {
  await run('a{ overflow: clip; overflow: clip; }', 'a{ overflow: hidden; overflow: clip; overflow: clip; }', {});
});

test('does not add a fallback for overflow: clip if a another overflow fallback is present 1', async () => {
  await run('a{ overflow: something; overflow: clip; }', 'a{ overflow: something; overflow: clip; }', {});
});

test('does not add a fallback for overflow: clip if a another overflow fallback is present 2', async () => {
  await run('a{ overflow: clip; overflow: something; overflow: clip; }', 'a{ overflow: hidden; overflow: clip; overflow: something; overflow: clip; }', {});
});

test('does not add a fallback for overflow: clip if a another overflow fallback is present 3', async () => {
  await run('a{ overflow: clip; overflow: something; overflow: hidden; }', 'a{ overflow: hidden; overflow: clip; overflow: something; overflow: hidden; }', { upgradeHiddenToClip: true });
});

test('does not have other overflow side effects', async () => {
  await run('a{ overflow-wrap: clip; }', 'a{ overflow-wrap: clip; }', {});
});

test('does not adds overflow: clip when overflow: hidden is used', async () => {
  await run('a{ overflow: hidden; }', 'a{ overflow: hidden; }', {});
});

test('does not adds overflow: clip when overflow: hidden is used if specifically requested not to', async () => {
  await run('a{ overflow: hidden; }', 'a{ overflow: hidden; }', { upgradeHiddenToClip: false });
});

test('adds overflow: clip when overflow: hidden is used if specifically requested', async () => {
  await run('a{ overflow: hidden; }', 'a{ overflow: hidden; }', { upgradeHiddenToClip: true });
});

test('adds a fallback for overflow: clip on double values', async () => {
  await run('a{ overflow: hidden clip; }', 'a{ overflow: hidden hidden; overflow: hidden clip; }', {});
});

test('adds a fallback for overflow: clip on double values', async () => {
  await run('a{ overflow: clip clip; }', 'a{ overflow: hidden hidden; overflow: clip clip; }', {});
});

test('some test', async () => {
  await run('a{ overflow: overlay; overflow: clip; }', 'a{ overflow: auto; overflow: overlay; overflow: clip; }', {});
});

test('no side effects 1', async () => {
  await run('a{ overflow: scroll; overflow: hidden; overflow: clip; }', 'a{ overflow: scroll; overflow: hidden; overflow: clip; }', {});
});

test('no side effects 2', async () => {
  await run('a{ overflow: hidden; overflow: scroll; }', 'a{ overflow: hidden; overflow: scroll; }', {});
});

test('var 1', async () => {
  await run('a{ overflow: var(--something-something, clip); }', 'a{ overflow: var(--something-something, clip); }', {});
});

test('var 2', async () => {
  await run('a{ overflow: hidden; overflow: var(--something-something, clip); }', 'a{ overflow: hidden; overflow: var(--something-something, clip); }', {});
});

test('var 3', async () => {
  await run('a{ overflow: var(--something-something, clip); overflow: hidden; }', 'a{ overflow: var(--something-something, clip); overflow: hidden; }', {});
});

test('var 4', async () => {
  await run('a{ overflow: var(--something-something, hidden);}', 'a{ overflow: var(--something-something, hidden);}', { upgradeHiddenToClip: true });
});

test('var 5', async () => {
  await run('a{ overflow: hidden; overflow: var(--something-something, clip); overflow: hidden; }', 'a{ overflow: hidden; overflow: var(--something-something, clip); overflow: hidden; }', {});
});

test('properly handle fallbacks with multiple properties', async () => {
  await run('a{ overflow: clip; overflow: overlay; overflow: hidden; }', 'a{ overflow: hidden; overflow: clip; overflow: overlay; overflow: hidden; }', {});
});

test('properly handle fallbacks with multiple properties', async () => {
  await run('a{ overflow: clip !important; overflow: clip; overflow: hidden; overflow: overlay; }', 'a{ overflow: hidden !important; overflow: clip !important; overflow: clip; overflow: hidden; overflow: overlay; }', {});
});

test('Multiple overflow declarations and properly handles important statements', async () => {
  await run('a{ overflow: clip; overflow: overlay !important; overflow: hidden; }', 'a{ overflow: hidden; overflow: clip; overflow: overlay !important; overflow: hidden; }', {});
});

test('Add clip adds overflow: clip when overflow: hidden is used if specifically requested on double values 1', async () => {
  await run('a{ overflow: hidden visible; }', 'a{ overflow: hidden visible; }', { upgradeHiddenToClip: true });
});

test('Add clip adds overflow: clip when overflow: hidden is used if specifically requested on double values 2', async () => {
  await run('a{ overflow: clip !important; overflow: clip; overflow: hidden; overflow: overlay; overflow: clip; overflow: overlay !important; overflow: hidden; }', 'a{ overflow: hidden !important; overflow: clip !important; overflow: clip; overflow: hidden; overflow: overlay; overflow: clip; overflow: overlay !important; overflow: hidden; }', { upgradeHiddenToClip: true });
});

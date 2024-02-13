import {
  expect,
  test,
} from 'vitest';

import postcss from 'postcss';

import plugin from './index.js';

function runPlugin (input, opts = {}) {
  return postcss([plugin(opts)]).process(input, { from: undefined });
}

async function run (input, expectedOutput, opts) {
  const result = await runPlugin(input, opts);
  expect(result.css).toEqual(expectedOutput);
  expect(result.warnings()).toHaveLength(0);
}

function runError (input, expectedError, opts) {
  expect(() => runPlugin(input, opts)).toThrowError(expectedError);
}

test('adds a fallback for `clip`', async () => {
  await run('a{ overflow: clip; }', 'a{ overflow: hidden; overflow: clip; }');
  await run('a{ overflow-x: clip; }', 'a{ overflow-x: hidden; overflow-x: clip; }');
  await run('a{ overflow-y: clip; }', 'a{ overflow-y: hidden; overflow-y: clip; }');
  await run('a{ overflow-block: clip; }', 'a{ overflow-block: hidden; overflow-block: clip; }');
  await run('a{ overflow-inline: clip; }', 'a{ overflow-inline: hidden; overflow-inline: clip; }');
});

test('adds a fallback for `overlay`', async () => {
  await run('a{ overflow: overlay; }', 'a{ overflow: auto; overflow: overlay; }');
  await run('a{ overflow-x: overlay; }', 'a{ overflow-x: auto; overflow-x: overlay; }');
  await run('a{ overflow-y: overlay; }', 'a{ overflow-y: auto; overflow-y: overlay; }');
  await run('a{ overflow-block: overlay; }', 'a{ overflow-block: auto; overflow-block: overlay; }');
  await run('a{ overflow-inline: overlay; }', 'a{ overflow-inline: auto; overflow-inline: overlay; }');
});

test('skip adding fallback if preceded by another value of the same property', async () => {
  await run('a{ overflow: hidden; overflow: clip; }', 'a{ overflow: hidden; overflow: clip; }');
  await run('a{ overflow: hidden !important; overflow: clip; }', 'a{ overflow: hidden !important; overflow: clip; }');
  await run('a{ overflow: something; overflow: clip; }', 'a{ overflow: something; overflow: clip; }');
  await run('a{ overflow: clip; overflow: something; overflow: clip; }', 'a{ overflow: hidden; overflow: clip; overflow: something; overflow: clip; }');
});

test('does add a fallback for overflow: clip if overflow: clip is present twice', async () => {
  await run('a{ overflow: clip; overflow: clip; }', 'a{ overflow: hidden; overflow: clip; overflow: clip; }');
});

test('does not actively add overflow: clip when overflow: hidden is used', async () => {
  await run('a{ overflow: hidden; }', 'a{ overflow: hidden; }');
});

test('add fallback only to the first declaration when multiple declarations are following each other', async () => {
  await run('a{ overflow: overlay; overflow: clip; }', 'a{ overflow: auto; overflow: overlay; overflow: clip; }');
});

test('does not have other side effects on other overflow like properties', async () => {
  await run('a{ overflow-wrap: clip; }', 'a{ overflow-wrap: clip; }');
  await run('a{ overflow-anchor: none; }', 'a{ overflow-anchor: none; }');
  await run('a{ overflow-clip-margin: 20px; }', 'a{ overflow-clip-margin: 20px; }');
});

test('no side effects on other values', async () => {
  await run('a{ overflow-wrap: clip; }', 'a{ overflow-wrap: clip; }');
  await run('a{ overflow-anchor: none; }', 'a{ overflow-anchor: none; }');
  await run('a{ overflow-clip-margin: 20px; }', 'a{ overflow-clip-margin: 20px; }');
  await run('a{ overflow: scroll; overflow: hidden; overflow: clip; }', 'a{ overflow: scroll; overflow: hidden; overflow: clip; }');
  await run('a{ overflow: hidden; overflow: scroll; }', 'a{ overflow: hidden; overflow: scroll; }');
});

test('no side effects when using variables', async () => {
  await run('a{ overflow: var(--something-something, clip); }', 'a{ overflow: var(--something-something, clip); }');
  await run('a{ overflow: hidden; overflow: var(--something-something, clip); }', 'a{ overflow: hidden; overflow: var(--something-something, clip); }');
  await run('a{ overflow: var(--something-something, clip); overflow: hidden; }', 'a{ overflow: var(--something-something, clip); overflow: hidden; }');
  await run('a{ overflow: hidden; overflow: var(--something-something, clip); overflow: hidden; }', 'a{ overflow: hidden; overflow: var(--something-something, clip); overflow: hidden; }');
});

test('properly handle fallbacks with multiple properties', async () => {
  await run('a{ overflow: clip; overflow: overlay; overflow: hidden; }', 'a{ overflow: hidden; overflow: clip; overflow: overlay; overflow: hidden; }');
  await run('a{ overflow: clip !important; overflow: clip; overflow: hidden; overflow: overlay; }', 'a{ overflow: hidden !important; overflow: clip !important; overflow: clip; overflow: hidden; overflow: overlay; }');
});

test('correctly handles situations in which !important is used', async () => {
  await run('a{ overflow: clip; overflow: overlay !important; overflow: hidden; }', 'a{ overflow: hidden; overflow: clip; overflow: overlay !important; overflow: hidden; }');
});

test('adds a fallback for `clip` when specifically requested', async () => {
  await run('a{ overflow: clip; }', 'a{ overflow: hidden; overflow: clip; }', { addClipFallback: true });
});

test('adds a fallback for `overlay` when specifically requested', async () => {
  await run('a{ overflow: overlay; }', 'a{ overflow: auto; overflow: overlay; }', { addOverlayFallback: true });
});

test('do not add a fallback for overflow: clip when requested not to', async () => {
  await run('a{ overflow: clip; }', 'a{ overflow: clip; }', { addClipFallback: false });
});

test('do not add a fallback for overflow: overlay when requested not to', async () => {
  await run('a{ overflow: overlay; }', 'a{ overflow: overlay; }', { addOverlayFallback: false });
});

test('do not add a fallback for overflow: overlay or overflow: clip when requested not to', async () => {
  await run('a{ overflow: overlay; overflow-x: clip; }', 'a{ overflow: overlay; overflow-x: clip; }', { addOverlayFallback: false, addClipFallback: false });
});

test('deals with double-value syntax', async () => {
  await run('a{ overflow: hidden clip; }', 'a{ overflow: hidden hidden; overflow: hidden clip; }');
  await run('a{ overflow: clip clip; }', 'a{ overflow: hidden hidden; overflow: clip clip; }');
  await run('a{ overflow: auto overlay; }', 'a{ overflow: auto auto; overflow: auto overlay; }');
});

test('does not add a fallback on double-value syntax when requested not to', async () => {
  await run('a{ overflow: clip overlay; }', 'a{ overflow: clip auto; overflow: clip overlay; }', { addClipFallback: false });
  await run('a{ overflow: clip overlay; }', 'a{ overflow: hidden overlay; overflow: clip overlay; }', { addOverlayFallback: false });
  await run('a{ overflow: clip overlay; }', 'a{ overflow: clip overlay; }', { addClipFallback: false, addOverlayFallback: false });
});

test('add staged fallbacks for double-value syntax if needed', async () => {
  await run('a{ overflow: clip overlay; }', 'a{ overflow: hidden auto; overflow: hidden overlay; overflow: clip overlay; }');
});

test('do not add staged fallbacks for double-value syntax if not needed', async () => {
  await run('a{ overflow: clip auto; }', 'a{ overflow: hidden auto; overflow: clip auto; }');
  await run('a{ overflow: clip hidden; }', 'a{ overflow: hidden hidden; overflow: clip hidden; }');
});

test('throws on removed features', async () => {
  const errorMessage = 'the `add` and `upgradeHiddenToClip` options are removed. Use the `postcss-overflow-clip` plugin instead';
  await runError('a{ overflow: overlay; }', errorMessage, { upgradeHiddenToClip: false });
  await runError('a{ overflow: overlay; }', errorMessage, { upgradeHiddenToClip: true });
  await runError('a{ overflow: overlay; }', errorMessage, { add: false });
  await runError('a{ overflow: overlay; }', errorMessage, { add: true });
});

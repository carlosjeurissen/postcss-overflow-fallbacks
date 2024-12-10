/* eslint-disable disable-autofix/strict */

'use strict';

const valueParser = require('postcss-value-parser');

module.exports = function exports (options = {}) {
  const {
    addOverlayFallback = true,
    addClipFallback = true,
    operateOnDoubleValues = true,
  } = options;

  if ('add' in options || 'upgradeHiddenToClip' in options) {
    throw new Error('the `add` and `upgradeHiddenToClip` options are removed. Use the `postcss-overflow-clip` plugin instead.');
  }

  function handleDeclaration (decl) {
    if (!addOverlayFallback && !addClipFallback) return;

    const { prop, value } = decl;

    // do not add fallbacks if another fallback is present
    const prevDecl = decl.prev();
    if (prevDecl && prevDecl.prop === prop) return;

    if (value === 'overlay') {
      if (!addOverlayFallback) return;
      decl.cloneBefore({ value: 'auto' });
      return;
    }

    if (value === 'clip') {
      if (!addClipFallback) return;
      decl.cloneBefore({ value: 'hidden' });
      return;
    }

    if (!operateOnDoubleValues) return;

    if (prop !== 'overflow') return;

    const parsedValues = valueParser(value);

    if (parsedValues.nodes.length < 3) return;

    let changed = false;
    let fallbackDecl;
    if (addClipFallback) {
      parsedValues.walk((node) => {
        if (node.type !== 'word') return;
        if (node.value !== 'clip') return;
        node.value = 'hidden';
        changed = true;
      });
      if (changed) {
        const fallbackValue = parsedValues.toString();
        fallbackDecl = decl.cloneBefore({ value: fallbackValue });
      }
    }

    if (!addOverlayFallback) return;

    if (changed) {
      changed = false;
    }

    parsedValues.walk((node) => {
      if (node.type !== 'word') return;
      if (node.value !== 'overlay') return;
      node.value = 'auto';
      changed = true;
    });
    if (!changed) return;
    const fallbackValue = parsedValues.toString();
    const cloneBeforeDecl = fallbackDecl || decl;
    cloneBeforeDecl.cloneBefore({ value: fallbackValue });
  }

  const Declaration = {
    overflow: handleDeclaration,
    'overflow-block': handleDeclaration,
    'overflow-inline': handleDeclaration,
    'overflow-x': handleDeclaration,
    'overflow-y': handleDeclaration,
  };

  return {
    postcssPlugin: 'postcss-overflow-clip',
    Declaration: Declaration,
  };
};

module.exports.postcss = true;

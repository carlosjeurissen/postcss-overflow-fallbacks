/* eslint-disable no-autofix/strict */

'use strict';

const valueParser = require('postcss-value-parser');

module.exports = function exports (options = {}) {
  const {
    addOverlayFallback = true,
    addClipFallback = true,
  } = options;

  if ('add' in options || 'upgradeHiddenToClip' in options) {
    throw new Error('the `add` and `upgradeHiddenToClip` options are removed. Use the `postcss-overflow-clip` plugin instead.');
  }

  function singleKeywordReplacement (node) {
    if (node.type !== 'word') return;

    const value = node.value;
    if (value === 'overlay') {
      if (!addOverlayFallback) return;
      node.value = 'auto';
      return;
    }

    if (!addClipFallback) return;
    if (value !== 'clip') return;

    node.value = 'hidden';
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

    if (prop !== 'overflow') return;

    const parsedValues = valueParser(value);

    if (parsedValues.nodes.length < 3) return;

    parsedValues.walk(singleKeywordReplacement);

    const fallbackValue = parsedValues.toString();
    if (value === fallbackValue) return;

    decl.cloneBefore({ value: fallbackValue });
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

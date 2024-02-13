/* eslint-disable no-autofix/strict */

'use strict';

module.exports = function exports (options = {}) {
  const {
    addOverlayFallback = true,
    addClipFallback = true,
  } = options;

  if ('add' in options || 'upgradeHiddenToClip' in options) {
    console.warn('[overflow] To actively add clip when hidden is encountered, please use `postcss-overflow-clip`');
  }

  const twoValueSyntaxRegex = /^[A-Za-z]{2,20} [A-Za-z]{2,20}$/;

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

    const usesTwoValueSyntax = twoValueSyntaxRegex.test(value);
    if (!usesTwoValueSyntax) return;

    const fallbackValue = value.split(' ').map((keyword) => {
      if (addOverlayFallback && keyword === 'overlay') return 'auto';
      if (addClipFallback && keyword === 'clip') return 'hidden';
      return keyword;
    }).join(' ');

    if (fallbackValue === value) return;

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

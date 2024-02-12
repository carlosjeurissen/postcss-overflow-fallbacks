/* eslint-disable no-autofix/strict */

'use strict';

module.exports = function exports (options = {}) {
  const {
    addOverlayFallback = true,
    addClipFallback = true,
    upgradeHiddenToClip = false,
  } = options;

  const twoValueSyntaxRegex = /^[A-Za-z]{2,20} [A-Za-z]{2,20}$/;

  function usesTwoValueSyntax ({ prop, value }) {
    return prop === 'overflow' && twoValueSyntaxRegex.test(value);
  }

  function handleUpgrades (decl) {
    if (!upgradeHiddenToClip) return;

    const { prop, value } = decl;

    // do not add upgrades if another upgrade is present
    const nextDecl = decl.next();
    if (nextDecl && nextDecl.prop === prop) return;

    if (value === 'hidden') {
      decl.cloneAfter({ value: 'clip' });
      return;
    }

    const handleTwoValueSyntax = usesTwoValueSyntax(decl) && value.includes('hidden');
    if (!handleTwoValueSyntax) return;

    const upgradeValue = value.split(' ').map((keyword) => {
      if (keyword === 'hidden') return 'clip';
      return keyword;
    }).join(' ');

    decl.cloneAfter({ value: upgradeValue });
  }

  function handleFallbacks (decl) {
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

    const handleTwoValueSyntax = usesTwoValueSyntax(decl);
    if (!handleTwoValueSyntax) return;

    const fallbackValue = value.split(' ').map((keyword) => {
      if (addOverlayFallback && keyword === 'overlay') return 'auto';
      if (addClipFallback && keyword === 'clip') return 'hidden';
      return keyword;
    }).join(' ');

    if (fallbackValue === value) return;

    decl.cloneBefore({ value: fallbackValue });
  }

  function handleDeclaration (decl) {
    handleUpgrades(decl);
    handleFallbacks(decl);
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

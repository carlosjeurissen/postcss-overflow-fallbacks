# PostCSS Overflow Fallbacks

[PostCSS] Provides fallbacks for `overflow: clip` and `overflow: overlay`

[PostCSS]: https://github.com/postcss/postcss

```css
.foo {
    overflow-x: clip;
}

.bar {
    overflow: clip overlay;
    overflow-block: overlay;
}
```

```css
.foo {
    overflow-x: hidden;
    overflow-x: clip;
}

.bar {
    overflow: hidden auto;
    overflow: clip overlay;
    overflow-block: auto;
    overflow-block: overlay;
}
```

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-overflow-fallbacks
```

**Step 2:** Check you project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs]
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-overflow-fallbacks'),
  ]
}
```

## Options

**addOverlayFallback (default: true)**
Adds `auto` fallback for `overlay`

**addClipFallback (default: true)**
Adds `hidden` fallback for `clip`

## Removed options

Both `upgradeHiddenToClip` and `add` options have been removed. Please use https://www.npmjs.com/package/postcss-overflow-clip instead.

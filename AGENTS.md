This file provides guidance to agentic coding tools working on this package.

`emdash-plugin-math` is a **native** EmDash plugin. It adds one Portable Text
block type (`mathBlock`) that renders LaTeX with KaTeX on the server.

The package is standalone: it is not part of the EmDash monorepo, and it
depends on `emdash` and `astro` only as peer dependencies.

# Rules

**The plugin is native, and that is load-bearing.** A custom Portable Text
block needs an Astro rendering component, and only a native plugin can supply
one — the host site's build imports it. Do not restructure the package into a
sandboxed plugin, and do not add a registry publish step: the EmDash registry
accepts sandboxed plugins only. See [Distribution](#distribution).

**Two entrypoints, two jobs.** `dist/index.mjs` is built by tsdown and runs in
the host's Node or Worker process. `src/astro/index.ts` ships as **source** and
is compiled by the host's Astro build. Never move `src/astro/` or `src/styles/`
into `dist/`, and never remove them from the `files` array — the host build
resolves them from the published tarball.

**Keep the descriptor and the runtime in sync.** `mathPlugin()` and
`createPlugin()` must agree on `id`, `version`, and the block `type` string.
EmDash imports `createPlugin` **by name** from `entrypoint`. A default export
alone is not enough.

**No client-side rendering.** KaTeX runs in `MathBlock.astro`, at build or
request time. The page must ship finished HTML that works with JavaScript
disabled. The only client script is the copy behaviour, and formulas must
render correctly without it.

**Theme colours go through custom properties.** Never hard-code a colour in a
component. Add or change `--emdash-math-*` properties in `src/styles/math.css`
and give them fallbacks that work in a bare Astro site. Do not use
`!important` — themes must be able to win with a rule of equal specificity.

**Degrade visibly.** Malformed LaTeX renders as the raw source, not a blank gap
and not a KaTeX error glyph. See [The error path](#the-error-path).

**The two READMEs move together.** `README.md` is Chinese and `README_en.md`
is English. Both carry the same sections in the same order and link to each
other. A change to one is a change to both — a section that exists in only one
language is a bug. Write both to ASD-STE100: short sentences, active voice,
simple tenses, one meaning per word.

**Comments are for code readers.** Write a comment only for a non-obvious
"why". Never write justification, narrative, or issue references.

## Workflow

```bash
pnpm install
pnpm typecheck     # tsc --noEmit
pnpm build         # tsdown → dist/index.mjs + dist/index.d.mts
```

Run `pnpm typecheck` and `pnpm build` before considering a change complete.
Both must pass.

There is no test suite. Verify changes against a real EmDash site — see
[Verifying against a real site](#verifying-against-a-real-site).

## Package layout

```
src/
├── index.ts          # descriptor factory + createPlugin(); the block definition
├── client.ts         # copy behaviour, exported as a source string
├── types.ts          # MathBlockNode, shared with the Astro component
├── env.d.ts          # ambient `*.astro` module declaration for tsc
├── astro/
│   ├── index.ts      # exports `blockComponents` — keyed by block `_type`
│   └── MathBlock.astro
└── styles/
    └── math.css      # --emdash-math-* API + tone variants
```

`src/types.ts` exists because TypeScript cannot re-export a type declared
inside a `.astro` file. Put shared types there, not in the component.

## How the pieces connect

1. `admin.portableTextBlocks` in `createPlugin()` declares the editor UI. Its
   `type` becomes the stored `_type` and the `blockComponents` key.
2. `src/astro/index.ts` exports `blockComponents`, which EmDash merges into
   `<PortableText>` under the key from step 1.
3. `MathBlock.astro` receives the saved node as the `node` prop —
   `astro-portabletext` does **not** pass `value` to custom type components.
4. The `page:fragments` hook injects one inline script containing both the
   client config and the copy behaviour.

### Why config and behaviour ship as one script

The hook returns a single `inline-script` contribution with the config object
prepended to the behaviour. Two separate contributions would depend on the
host's ordering, which is not guaranteed. Keep them together.

The config global name is defined once, in `src/index.ts`
(`MATH_CONFIG_GLOBAL`), and `buildClientScript()` takes it as a parameter so
the writer and the reader cannot drift apart.

## The error path

`MathBlock.astro` treats a formula as failed when either:

- `katex.renderToString()` throws, or
- the output contains `katex-error`.

The second check matters: with `throwOnError: false`, KaTeX returns a
`<span class="katex-error">` instead of throwing. Without that check the
component would render the error glyph, which tells an author nothing useful.

A failed formula renders inside `.emdash-math--error` with the raw source in a
`<pre>`. It keeps `data-latex` so the copy handler still works, and sets
`data-math-error="1"` so the client script skips the copy button.

## Styling

`src/styles/math.css` has two layers, in this order:

1. `--emdash-math-*` custom properties on `.emdash-math`. This is the theme
   API. Fallbacks reference EmDash tokens (`--color-fill`, `--radius-lg`)
   with neutral literals after them.
2. `[data-tone="…"]` rules that set only those properties.

Dark mode uses a `prefers-color-scheme` media query rather than `light-dark()`,
so the plugin works in themes that set `color-scheme` themselves.

KaTeX inherits `color`, so the `ink` tone needs no special rule beyond setting
`--emdash-math-color`. Do not add a KaTeX-specific colour override.

## Distribution

Native plugins install from npm and are registered in the host's
`astro.config.mjs`. Installing the dependency alone does not activate the
plugin.

The `files` array must keep `dist`, `src/astro`, and `src/styles`. Dropping
either source directory produces a tarball that builds locally and fails in a
host site.

`logo.svg` and `README_en.md` are listed explicitly. npm includes `README.md`
automatically, but not `logo.svg` (which the README embeds) or
`README_en.md` (the underscore does not match npm's readme pattern). Without
both entries the published page shows a broken image and a dead language
link. Run `npm pack --dry-run` after changing `files`.

Bump the version in **three** places together: `package.json`,
`mathPlugin()`, and `createPlugin()`. The version an administrator sees comes
from `definePlugin()`, not from `package.json`.

## The logo

`logo.svg` is the word "KaTeX" set in KaTeX's own `KaTeX_Math-Italic` font.
The letters are **outlines, not a `<text>` element**, because the READMEs embed
the file with `<img>`, and an `<img>`-referenced SVG cannot load a webfont —
a `<text>` version would fall back to a system serif on most machines.

The outlines come from `katex`'s shipped TTF, and the spacing is the layout
`katex.renderToString("\\KaTeX")` produces: each glyph's advance width plus the
italic correction KaTeX puts after `K` (0.0715em) and `T` (0.1389em). Do not
re-space the letters by hand. Regenerate with `make-logo.mjs` in the scratch
directory if the KaTeX version changes.

Verify a regenerated logo by rendering it beside a real KaTeX render at the
same font size and comparing ink bounding boxes. They must match within about
1.5% in each dimension; a larger gap means the glyphs or the spacing are wrong.
Note that the comparison only means anything if the KaTeX webfont is embedded
as a data URI — loading it from `file://` races the screenshot and silently
compares against a fallback font.

## Verifying against a real site

Unit tests cannot cover the parts that break in practice: whether the host
build resolves `./astro`, whether KaTeX CSS lands in the page, and whether the
copy handler rewrites the clipboard without touching normal text.

The procedure:

1. Link the package into an EmDash site's `node_modules` and register
   `mathPlugin()` in its `astro.config.mjs`.
2. Insert a post whose `content` JSON contains `mathBlock` nodes — including
   one with deliberately broken LaTeX.
3. Start the dev server and request the post.
4. Check the served HTML for `.emdash-math`, `.katex`, `<math>`, `data-latex`,
   and the `__EMDASH_MATH__` global.
5. For copy behaviour, load the page in a headless browser and dispatch a
   `copy` event with a `DataTransfer`. Assert that a formula yields its LaTeX
   and that a normal paragraph is untouched.

Step 5 is the one that catches real regressions. A copy handler that throws on
an unexpected selection node breaks copying for the whole page, and no
server-side check will notice.

## Gotchas

- **`group: "block"`.** EmDash registers plugin blocks as block-level, so a
  formula cannot sit inside a paragraph. Inline math is not possible yet. Do
  not claim support for it in docs.
- **pnpm build scripts.** pnpm 11+ reads build-script allowlists from
  `pnpm-workspace.yaml` (`allowBuilds`), not from `package.json`. tsdown needs
  esbuild's postinstall to run.
- **`data-tone` is omitted for `none`.** The component writes `data-tone={null}`
  when the tone is `none` or absent, so the attribute does not appear. Style
  the untoned case with the base `.emdash-math` rule.
- **`astro-portabletext` passes `node`, not `value`.** A component that reads
  `Astro.props.value` silently renders nothing.

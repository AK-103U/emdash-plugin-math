<p align="center">
  <img src="logo.svg" alt="KaTeX" width="300">
</p>

<h1 align="center">emdash-plugin-math</h1>

<p align="center">
  <a href="README.md">中文</a> · English
</p>

---

# English

This plugin adds LaTeX formula rendering to EmDash CMS. The plugin uses KaTeX and renders formulas on the server.

## Features

The plugin gives you three features.

- **Server-side rendering.** The Astro component runs KaTeX at build time or at request time. The page sends finished HTML. Formulas do not need client-side JavaScript.
- **Copyable.** A reader selects a formula and copies it. The reader gets the LaTeX source. Without this feature, the copy result is a set of loose characters.
- **Themeable.** The plugin supplies five semantic tones and exposes `--emdash-math-*` CSS variables. A theme overrides these variables to change the look of every formula on the site.

When LaTeX is incorrect, the plugin shows the raw source. The plugin does not show a gap or broken characters.

## Requirements

- EmDash 1.2.0 or later
- Astro 7.3.0 or later

## Install

This plugin is a native plugin. You install native plugins from npm, and you register them in `astro.config.mjs`.

An installed dependency does not activate the plugin. You must change the Astro configuration.

Step 1: Install the package.

```bash
pnpm add emdash-plugin-math
```

Step 2: Register the plugin in `astro.config.mjs`.

```typescript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { mathPlugin } from "emdash-plugin-math";

export default defineConfig({
	integrations: [
		emdash({
			// Put native plugins in the `plugins` array. Do not put them in the
			// `sandboxed` array.
			plugins: [mathPlugin()],
		}),
	],
});
```

Step 3: Deploy the site again.

## Why the plugin must be native

A custom Portable Text block needs two parts: an editor definition, and an Astro rendering component.

Only a native plugin can supply an Astro component. The host site must import that component during its build. A sandboxed plugin can describe an editor interface with Block Kit. A sandboxed plugin cannot supply a rendering component.

You cannot publish a native plugin to the EmDash registry. Install this plugin from npm.

## Options

Pass options to `mathPlugin()`. The plugin writes the options into the page through the `page:fragments` hook.

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `copyable` | `boolean` | `true` | Change the clipboard contents when a reader copies a formula. Set this option to `false` on a site that blocks copying. |
| `copyDelimiters` | `boolean` | `false` | Add `$…$` or `$$…$$` around the copied LaTeX. The result then works as math when a reader pastes it into Markdown. |
| `copyButton` | `boolean` | `true` | Show a copy button when the pointer is over a formula. |
| `tones` | `MathTone[]` | all | The tones that the editor tone picker supplies. Limit this list to keep authors inside the theme palette. |

```typescript
mathPlugin({
	copyDelimiters: true,
	tones: ["none", "accent"],
});
```

## Theming

Override the custom properties in the theme CSS. The plugin does not use `!important`. A rule of equal specificity therefore takes effect.

```css
:root {
	--emdash-math-radius: 0;
	--emdash-math-margin: 2rem;
	--emdash-math-tag-color: var(--color-brand);
}

/* Give each tone the theme palette */
.emdash-math[data-tone="accent"] {
	--emdash-math-bg: light-dark(#eff6ff, #172554);
	--emdash-math-border: light-dark(#bfdbfe, #1e40af);
}
```

The available properties are `--emdash-math-bg`, `--emdash-math-border`, `--emdash-math-color`, `--emdash-math-padding`, `--emdash-math-radius`, `--emdash-math-margin`, and `--emdash-math-tag-color`.

When the theme defines the EmDash variables, the plugin uses them (`--color-fill`, `--color-border`, `--color-muted`, `--radius-lg`). When the theme does not define them, the plugin uses neutral values. The plugin therefore also operates in a plain Astro site.

## Page requirements

The formula block itself has no requirements. The component imports its own CSS. Astro bundles this CSS and removes duplicates.

The copy feature and the copy button come from the `page:fragments` hook. This hook requires the theme layout to render `<EmDashHead>`. If the theme does not render `<EmDashHead>`, the formulas are still correct. The reader cannot copy the LaTeX source.

## Stored data

The plugin stores a formula block as Portable Text.

```json
{
	"_type": "mathBlock",
	"_key": "01JMATH…",
	"latex": "\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}",
	"tag": "(1)",
	"tone": "accent"
}
```

You can omit `tag` and `tone`. If you remove this plugin, the stored JSON stays the same. The formula block only stops rendering.

## Accessibility

KaTeX operates with `output: "htmlAndMathml"`. Each formula has a MathML tree and a visible HTML tree. Screen readers and text extraction tools read the MathML tree.

The formula container also sets `role="math"` and `aria-label`. The value of `aria-label` is the LaTeX source.

## Known limitations

- **No inline formulas.** A `mathBlock` is a block-level Portable Text node. The EmDash editor registers plugin blocks as `group: "block"`. A formula therefore cannot go inside a paragraph. Inline formulas need new editor support in EmDash.
- **KaTeX supports a subset of LaTeX math.** A command that KaTeX cannot parse shows as the raw source. The plugin does not fail without a message.

## Development

```bash
pnpm install
pnpm build        # tsdown → dist/index.mjs + dist/index.d.mts
pnpm typecheck
```

`src/astro/` and `src/styles/` ship as source. The host Astro build compiles them. These two directories must therefore stay in the published package.

## License

MIT

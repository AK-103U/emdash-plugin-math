/**
 * Math plugin for EmDash CMS
 *
 * Adds a `mathBlock` Portable Text block that renders LaTeX with KaTeX on the
 * server, so formulas appear in the initial HTML with no client-side rendering.
 *
 * Three behaviours are built in:
 *
 * 1. **Server-side rendering.** KaTeX runs in the Astro component, so the page
 *    ships finished HTML. Works with `output: "server"` and with JavaScript off.
 * 2. **Copyable by default.** Selecting a formula and copying yields the LaTeX
 *    source, not the character soup a bare KaTeX tree produces. A global `copy`
 *    listener rewrites the clipboard only when the selection is inside a formula.
 * 3. **Themeable colours.** The plugin ships neutral defaults and exposes
 *    `--emdash-math-*` custom properties. A theme overrides those to restyle
 *    every formula on the site without touching content.
 *
 * @example Register in astro.config.mjs
 * ```typescript
 * import { defineConfig } from "astro/config";
 * import emdash from "emdash/astro";
 * import { mathPlugin } from "@ak-103u/emdash-plugin-math";
 *
 * export default defineConfig({
 *   integrations: [
 *     emdash({
 *       plugins: [mathPlugin()],
 *     }),
 *   ],
 * });
 * ```
 *
 * The KaTeX stylesheet and the plugin's own styles are imported by the render
 * component, so Astro bundles them and the site imports nothing. Site-level
 * options reach the browser through a small config script the `page:fragments`
 * hook injects — see {@link MathPluginOptions}.
 */

import type { PluginDescriptor, ResolvedPlugin } from "emdash";
import { definePlugin } from "emdash";

import { buildClientScript } from "./client.js";

/** The Portable Text block type this plugin registers. */
export const MATH_BLOCK_TYPE = "mathBlock";

/**
 * Colour tones the author can pick per formula.
 *
 * Tones are semantic, not literal colours: `accent` means "this is a result"
 * rather than "this is green". A theme decides what each tone looks like by
 * overriding the `--emdash-math-*` custom properties in `src/styles/math.css`.
 */
export const MATH_TONES = ["none", "note", "accent", "warn", "ink"] as const;
export type MathTone = (typeof MATH_TONES)[number];

/** Client-side config, serialized into the page by the `page:fragments` hook. */
export interface MathClientConfig {
	/** Rewrite the clipboard when a formula is copied. */
	copyable: boolean;
	/** Wrap copied LaTeX in `$…$` / `$$…$$` so it pastes into Markdown as math. */
	delimiters: boolean;
	/** Show a copy button on hover. */
	copyButton: boolean;
}

/** Global the injected config script assigns to. */
export const MATH_CONFIG_GLOBAL = "__EMDASH_MATH__";

export interface MathPluginOptions {
	/**
	 * Rewrite the clipboard when a reader copies a formula, so they get the
	 * LaTeX source instead of the fragmented characters KaTeX emits.
	 *
	 * Set to `false` on sites that intentionally block copying.
	 *
	 * @default true
	 */
	copyable?: boolean;

	/**
	 * Wrap copied LaTeX in `$…$` (inline) or `$$…$$` (display) delimiters, so
	 * the result pastes into a Markdown document as working math.
	 *
	 * @default false
	 */
	copyDelimiters?: boolean;

	/**
	 * Show a copy button on hover, as a discoverable alternative to selecting
	 * the formula by hand.
	 *
	 * @default true
	 */
	copyButton?: boolean;

	/**
	 * Tones offered in the editor's tone picker. Restrict this list to keep
	 * authors within a theme's intended palette.
	 *
	 * @default all of MATH_TONES
	 */
	tones?: readonly MathTone[];
}

const TONE_LABELS: Record<string, string> = {
	none: "None",
	note: "Note",
	accent: "Accent",
	warn: "Warning",
	ink: "Inverted",
};

/**
 * Descriptor factory, evaluated while Astro reads its configuration.
 *
 * Returns serializable build-time metadata only. The behaviour lives in
 * {@link createPlugin}, which EmDash imports from `entrypoint` at runtime.
 */
export function mathPlugin(
	options: MathPluginOptions = {},
): PluginDescriptor<MathPluginOptions> {
	return {
		id: "math",
		version: "0.1.0",
		format: "native",
		entrypoint: "@ak-103u/emdash-plugin-math",
		componentsEntry: "@ak-103u/emdash-plugin-math/astro",
		options,
	};
}

/**
 * Runtime definition. EmDash imports this by name from `entrypoint`.
 */
export function createPlugin(options: MathPluginOptions = {}): ResolvedPlugin {
	const {
		copyable = true,
		copyDelimiters = false,
		copyButton = true,
		tones = MATH_TONES,
	} = options;

	const clientConfig: MathClientConfig = {
		copyable,
		delimiters: copyDelimiters,
		copyButton,
	};

	return definePlugin({
		id: "math",
		version: "0.1.0",

		// The plugin reads no content, makes no network requests, and stores
		// nothing. The single capability covers the config-script hook below.
		capabilities: ["hooks.page-fragments:register"],

		admin: {
			portableTextBlocks: [
				{
					type: MATH_BLOCK_TYPE,
					label: "Formula",
					icon: "code",
					description: "Render a LaTeX formula with KaTeX",
					category: "Sections",
					fields: [
						{
							type: "text_input",
							action_id: "latex",
							label: "LaTeX",
							multiline: true,
							placeholder: String.raw`\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}`,
						},
						{
							type: "text_input",
							action_id: "tag",
							label: "Number (optional)",
							placeholder: "(1)",
						},
						{
							type: "select",
							action_id: "tone",
							label: "Tone",
							options: tones.map((tone) => ({
								value: tone,
								label: TONE_LABELS[tone] ?? tone,
							})),
							initial_value: "none",
						},
					],
				},
			],
		},

		hooks: {
			"page:fragments": async (event) => {
				// The admin UI and API routes never render formulas.
				if (event.page.path.startsWith("/_emdash/")) return null;

				// JSON.stringify output is safe inside a script element only if
				// no value can close it. The values here are booleans from the
				// plugin options, so escaping `<` is belt-and-braces for future
				// string options rather than a live requirement.
				const json = JSON.stringify(clientConfig).replace(/</g, "\\u003c");

				// Config and behaviour ship as one script so the order is fixed
				// by construction, rather than depending on how the host orders
				// two separate contributions.
				return {
					kind: "inline-script",
					placement: "head",
					key: "emdash-math-client",
					code: `window.${MATH_CONFIG_GLOBAL}=${json};\n${buildClientScript()}`,
				};
			},
		},
	});
}

export default createPlugin;

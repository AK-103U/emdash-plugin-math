/**
 * Shared types for emdash-plugin-math.
 *
 * Kept out of the `.astro` component so plain `.ts` modules can import them —
 * TypeScript cannot re-export a type declared inside an Astro file.
 */

/** A `mathBlock` Portable Text node, as stored in the database. */
export interface MathBlockNode {
	_type: "mathBlock";
	_key: string;
	/** Raw LaTeX source, as typed by the author. */
	latex?: string;
	/** Optional formula number, e.g. `"(1)"`. Rendered right-aligned. */
	tag?: string;
	/** Colour tone. See `MATH_TONES` in `src/index.ts`. */
	tone?: string;
}

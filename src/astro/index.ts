/**
 * Astro rendering components for emdash-plugin-math.
 *
 * EmDash merges these into `<PortableText>` automatically, keyed by the block
 * `_type`. The keys must match the `type` values declared in
 * `admin.portableTextBlocks` (`src/index.ts`).
 *
 * A site can still override any of them per usage:
 *
 * @example
 * ```astro
 * <PortableText
 *   value={post.data.content}
 *   components={{ type: { mathBlock: MyMath } }}
 * />
 * ```
 */

import MathBlock from "./MathBlock.astro";

export { MathBlock };
export type { MathBlockNode } from "../types.js";

/** Keyed by Portable Text `_type`; consumed by EmDash's virtual module. */
export const blockComponents = {
	mathBlock: MathBlock,
} as const;

export default blockComponents;

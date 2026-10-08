/// <reference types="astro/client" />

// Astro components are compiled by the host site's build, so TypeScript needs
// an ambient declaration to resolve `./Foo.astro` from a plain `.ts` module.
// `astro/client` does not ship one, because inside an Astro project the
// framework's own plugin supplies it.
declare module "*.astro" {
	import type { AstroComponentFactory } from "astro/runtime/server/index.js";

	const component: AstroComponentFactory;
	export default component;
}

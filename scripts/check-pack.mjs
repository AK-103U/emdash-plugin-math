/**
 * Assert the published tarball carries everything the host build needs.
 *
 * `files` in package.json decides what npm packs. Dropping `src/astro` or
 * `src/styles` still builds locally but breaks the host site, and the failure
 * appears far from its cause. Run this before a release.
 */

import { execSync } from "node:child_process";

const REQUIRED = [
	"dist/index.mjs",
	"dist/index.d.mts",
	"src/astro/index.ts",
	"src/astro/MathBlock.astro",
	"src/styles/math.css",
	"logo.svg",
	"README.md",
	"README_en.md",
];

// A shell is needed on Windows, where npm is a `.cmd` shim.
const raw = execSync("npm pack --dry-run --json", {
	encoding: "utf8",
	// npm writes its notices to stderr; only stdout carries the JSON report.
	stdio: ["ignore", "pipe", "ignore"],
});

const [report] = JSON.parse(raw);
const packed = new Set(report.files.map((file) => file.path));
const missing = REQUIRED.filter((path) => !packed.has(path));

if (missing.length > 0) {
	console.error(`${report.name}@${report.version} is missing from the tarball:`);
	for (const path of missing) console.error(`  ${path}`);
	console.error("\nCheck the `files` array in package.json.");
	process.exit(1);
}

console.log(
	`${report.name}@${report.version}: ${packed.size} files, ${report.size} bytes packed.`,
);

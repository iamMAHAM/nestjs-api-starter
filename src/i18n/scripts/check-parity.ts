/**
 * Fails when a locale drifts from the reference one (missing or extra keys).
 * Wired into lefthook's pre-commit so a half-translated feature never lands.
 *
 * Run: `bun run i18n:check`
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_LOCALES } from '../settings.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', 'locales');

const collectKeys = (
	value: unknown,
	prefix: string,
	out: Set<string>,
): void => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		for (const [key, child] of Object.entries(value)) {
			collectKeys(child, prefix ? `${prefix}.${key}` : key, out);
		}
		return;
	}
	out.add(prefix);
};

const readKeys = (locale: string, ns: string): Set<string> => {
	const keys = new Set<string>();
	const file = path.join(root, locale, `${ns}.json`);
	collectKeys(JSON.parse(readFileSync(file, 'utf8')), '', keys);
	return keys;
};

const referenceLocale = SUPPORTED_LOCALES[0];
const namespaces = readdirSync(path.join(root, referenceLocale))
	.filter((file) => file.endsWith('.json'))
	.map((file) => file.replace(/\.json$/, ''));

let drift = 0;
for (const ns of namespaces) {
	const reference = readKeys(referenceLocale, ns);
	for (const locale of SUPPORTED_LOCALES) {
		if (locale === referenceLocale) continue;
		const keys = readKeys(locale, ns);
		const missing = [...reference].filter((key) => !keys.has(key));
		const extra = [...keys].filter((key) => !reference.has(key));
		if (missing.length || extra.length) {
			drift += missing.length + extra.length;
			console.error(
				`[${ns}] ${locale}: missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`,
			);
		}
	}
}

if (drift > 0) {
	console.error(`\ni18n parity check failed: ${drift} key(s) drifted.`);
	process.exit(1);
}
console.log(`i18n parity OK across ${SUPPORTED_LOCALES.join(', ')}.`);

/* eslint-env node */
// Packs meet-transcriber-extension/ into a zip that Chrome can load after unzipping.
// Used by the Vite build (served as /taskbuddy-meet-extension.zip) and runnable on its own.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

export const EXTENSION_ZIP_NAME = 'taskbuddy-meet-extension.zip';

const ROOT_FOLDER = 'taskbuddy-meet-extension';
// Development-only files that do not belong in the installable package
const EXCLUDE = new Set(['README.md', 'icons/create-icons.cjs', 'icons/generate-icons.html', 'icons/icon.svg']);

function collect(dir, base, files) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(base, full).split(sep).join('/');
    if (statSync(full).isDirectory()) {
      collect(full, base, files);
    } else if (!EXCLUDE.has(rel)) {
      files[`${ROOT_FOLDER}/${rel}`] = readFileSync(full);
    }
  }
  return files;
}

export function buildExtensionZip(extensionDir) {
  return zipSync(collect(extensionDir, extensionDir, {}), { level: 9 });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = fileURLToPath(new URL('../meet-transcriber-extension', import.meta.url));
  const out = process.argv[2] || EXTENSION_ZIP_NAME;
  writeFileSync(out, buildExtensionZip(dir));
  console.log(`Wrote ${out}`);
}

import { opendir } from 'fs/promises'
import path from 'path'
import { defineConfig } from 'tsup'

async function* walk(dir) {
  for await (const d of await opendir(dir)) {
      const entry = path.join(dir, d.name);
      if (d.isDirectory()) yield* walk(entry);
      else if (d.isFile()) yield entry;
  }
}

// TODO in watch mode new files, dropped files will not be part of entry,
const entry: string[] = []
const excludes = ['cli', '.spec.', 'testutils.ts', '.schema.json']
for await (const p of walk('./src')) {
  if (excludes.some(e => p.includes(e))) {
    // ignore for build
  } else {
    entry.push(p)
  }
}

export default defineConfig({
  entry,
  dts: true,
  target: 'node16',
  format: 'esm'
})

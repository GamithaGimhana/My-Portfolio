import { copyFile, lstat, mkdir, readdir, realpath, rm } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const output = resolve(root, 'dist');
const pages = ['index.html', 'work.html', 'about.html', 'contact.html'];

// Delete only this script's direct, non-symlink output directory.
if (dirname(output) !== root || relative(root, output) !== 'dist') {
  throw new Error('Refusing to clean an unexpected build directory.');
}
try {
  const existing = await lstat(output);
  if (!existing.isDirectory() || existing.isSymbolicLink() || await realpath(output) !== output) {
    throw new Error('Refusing to clean dist because it is not a regular build directory.');
  }
  await rm(output, { recursive: true, force: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await mkdir(output, { recursive: true });

let count = 0;
async function copy(source, destination) {
  const resolvedSource = await realpath(source);
  const fromRoot = relative(root, resolvedSource);
  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    throw new Error(`Asset points outside the portfolio: ${source}`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolvedSource, destination);
  count += 1;
}

async function copyTree(directory, accept = () => true) {
  let entries;
  try {
    entries = await readdir(join(root, directory), { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await copyTree(file, accept);
    else if (entry.isFile() && accept(file)) await copy(join(root, file), join(output, file));
    else if (entry.isSymbolicLink()) throw new Error(`Symlink assets are not packaged: ${file}`);
  }
}

for (const page of pages) await copy(join(root, page), join(output, page));
await copyTree('projects', file => extname(file).toLowerCase() === '.html');
await copy(join(root, 'assets/favicon.svg'), join(output, 'assets/favicon.svg'));
await copyTree('assets/css');
await copyTree('assets/js');
await copyTree('assets/images');
await copyTree('assets/fonts');
await copyTree('data', file => extname(file).toLowerCase() === '.json');
for (const file of ['favicon.svg', 'robots.txt', 'sitemap.xml']) {
  try {
    await copy(join(root, file), join(output, file));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

console.log(`Built ${count} public files in dist/.`);

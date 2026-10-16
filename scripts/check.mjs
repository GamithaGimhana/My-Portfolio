import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = process.argv.includes('--dist') ? join(workspace, 'dist') : workspace;
const pages = ['index.html', 'work.html', 'about.html', 'contact.html'];
for (const file of await readdir(join(root, 'projects'))) {
  if (file.endsWith('.html')) pages.push(join('projects', file));
}
const errors = [];
let checkedLinks = 0;
let checkedScripts = 0;

function attributes(tag) {
  const values = new Map();
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    values.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]);
  }
  return values;
}

async function localLink(page, value) {
  const link = value.trim().replaceAll('&amp;', '&');
  if (!link || link.startsWith('#') || link.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(link)) return;
  let pathname;
  try {
    pathname = decodeURIComponent(link.split(/[?#]/, 1)[0]);
  } catch {
    errors.push(`${page}: malformed URL ${value}`);
    return;
  }
  if (!pathname) return;
  const target = pathname.startsWith('/')
    ? resolve(root, `.${pathname}`)
    : resolve(root, dirname(page), pathname);
  const fromRoot = relative(root, target);
  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    errors.push(`${page}: local link leaves the project: ${value}`);
    return;
  }
  const candidates = [target];
  if (!extname(target)) candidates.push(`${target}.html`, join(target, 'index.html'));
  if (pathname.endsWith('/')) candidates.push(join(target, 'index.html'));
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) {
        checkedLinks += 1;
        return;
      }
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    }
  }
  errors.push(`${page}: missing local file for ${value}`);
}

for (const page of pages) {
  let html;
  try {
    html = await readFile(join(root, page), 'utf8');
  } catch (error) {
    errors.push(`${page}: ${error.message}`);
    continue;
  }
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || '';
  if (!attributes(htmlTag).get('lang')?.trim()) errors.push(`${page}: missing document language`);
  if (!/<title\b[^>]*>\s*[^<\s][\s\S]*?<\/title>/i.test(html)) errors.push(`${page}: missing page title`);
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  if (!meta.some(item => item.get('charset')?.trim())) errors.push(`${page}: missing character encoding`);
  for (const name of ['description', 'viewport']) {
    if (!meta.some(item => item.get('name')?.toLowerCase() === name && item.get('content')?.trim())) {
      errors.push(`${page}: missing ${name} metadata`);
    }
  }
  const markup = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>');
  for (const match of markup.matchAll(/<[a-z][\w:-]*\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    for (const name of ['href', 'src']) {
      if (attrs.has(name)) await localLink(page, attrs.get(name));
    }
    const srcset = attrs.get('srcset');
    if (srcset && !srcset.trim().startsWith('data:')) {
      for (const candidate of srcset.split(',')) await localLink(page, candidate.trim().split(/\s+/)[0]);
    }
  }
}

async function checkScripts(directory) {
  let entries;
  try {
    entries = await readdir(join(root, directory), { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await checkScripts(file);
    else if (entry.isFile() && ['.js', '.mjs'].includes(extname(file))) {
      const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
      checkedScripts += 1;
      if (result.error || result.status !== 0) {
        errors.push(`${file}: ${result.error?.message || result.stderr.trim() || 'JavaScript syntax check failed'}`);
      }
    }
  }
}
await checkScripts('scripts');
await checkScripts('assets/js');

if (errors.length) {
  console.error(`Portfolio checks failed (${errors.length}):\n${errors.map(error => `  - ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.length} pages, ${checkedLinks} local references, and ${checkedScripts} JavaScript files.`);
}

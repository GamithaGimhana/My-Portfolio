import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const pages = new Set(['index.html', 'work.html', 'about.html', 'contact.html']);
const extras = new Set(['favicon.svg', 'robots.txt', 'sitemap.xml']);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
};

function withinRoot(path) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot);
}

function reply(response, status, message, method) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(method === 'HEAD' ? undefined : `${message}\n`);
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    return reply(response, 405, 'Method not allowed', request.method);
  }

  try {
    const url = new URL(request.url, `http://${host}:${port}`);
    const decodedPath = decodeURIComponent(url.pathname);
    if (decodedPath.includes('\0') || decodedPath.includes('\\')) {
      return reply(response, 400, 'Invalid path', request.method);
    }

    let path = decodedPath.replace(/^\/+/, '') || 'index.html';
    if (path.endsWith('/')) path += 'index.html';
    if (!extname(path) && pages.has(`${path}.html`)) path += '.html';
    const publicFile = pages.has(path) || extras.has(path) || path.startsWith('assets/') || /^projects\/[a-z0-9-]+\.html$/.test(path);
    const hasHiddenSegment = path.split('/').some(segment => segment.startsWith('.'));
    if (!publicFile || hasHiddenSegment) {
      return reply(response, 404, 'Not found', request.method);
    }

    const requestedFile = resolve(root, path);
    if (!withinRoot(requestedFile)) return reply(response, 404, 'Not found', request.method);
    const file = await realpath(requestedFile);
    if (!withinRoot(file)) return reply(response, 404, 'Not found', request.method);
    const info = await stat(file);
    if (!info.isFile()) return reply(response, 404, 'Not found', request.method);

    response.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') return response.end();
    const stream = createReadStream(file);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  } catch (error) {
    if (error instanceof URIError || error instanceof TypeError) {
      return reply(response, 400, 'Invalid request', request.method);
    }
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR' || error.code === 'EACCES') {
      return reply(response, 404, 'Not found', request.method);
    }
    console.error(error);
    reply(response, 500, 'Server error', request.method);
  }
});

server.on('error', error => {
  console.error(`Could not start the portfolio server: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Portfolio ready at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop.');
});

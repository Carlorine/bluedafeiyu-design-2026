#!/usr/bin/env node
// 生成展览页到 _site/：首页列出全部投稿，起步包与投稿原样复制。
// 用法：node scripts/build-gallery.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const SUB = path.join(ROOT, 'submissions');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COVERS = ['cover.png', 'cover.jpg', 'cover.jpeg', 'cover.webp', 'cover.gif'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, 'starter'), path.join(OUT, 'starter'), { recursive: true });

const items = [];
for (const name of fs.readdirSync(SUB).sort((a, b) => a.localeCompare(b))) {
  const dir = path.join(SUB, name);
  if (!fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, 'index.html'))) continue;
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')); } catch { console.warn('[gallery] ' + name + ' 的 meta.json 读取失败，用文件夹名代替'); }
  fs.cpSync(dir, path.join(OUT, 'submissions', name), { recursive: true });
  items.push({ name, example: name.startsWith('_'), title: meta.title || name, author: meta.author || name, description: meta.description || '', cover: COVERS.find(c => fs.existsSync(path.join(dir, c))) || '' });
}
items.sort((a, b) => Number(a.example) - Number(b.example));

const card = it => {
  const href = './submissions/' + encodeURIComponent(it.name) + '/';
  const art = it.cover ? '<img loading="lazy" src="' + href + esc(it.cover) + '" alt="">' : '<span class="ph" aria-hidden="true">🐳</span>';
  const who = it.example ? '示例' : '<a href="https://github.com/' + encodeURIComponent(it.name) + '" target="_blank" rel="noopener">@' + esc(it.name) + '</a>';
  return '<li><a class="art" href="' + href + '">' + art + '</a><h2><a href="' + href + '">' + esc(it.title) + '</a></h2><p class="who">' + who + '</p>' + (it.description ? '<p>' + esc(it.description) + '</p>' : '') + '</li>';
};
const real = items.filter(i => !i.example).length;
fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>投稿展览 · 蓝色大肥鱼国庆网站前台设计征集</title>
<link rel="stylesheet" href="./starter/tokens.css">
<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-sans); color: var(--text-primary); background: var(--paper); }
main { max-width: 1120px; margin: 0 auto; padding: 32px 16px 64px; }
header h1 { margin: 0 0 8px; }
header p { margin: 0 0 24px; color: var(--text-secondary); }
ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin: 0; padding: 0; list-style: none; }
li { padding: 12px; background: var(--paper-card); border: 2px solid var(--ink); border-radius: var(--radius-md); box-shadow: var(--shadow-paper); }
.art { display: grid; place-items: center; aspect-ratio: 16 / 10; overflow: hidden; background: var(--sticky-2); border: 2px solid var(--ink); border-radius: var(--radius-sm); }
.art img { width: 100%; height: 100%; object-fit: cover; }
.ph { font-size: 48px; }
h2 { margin: 12px 0 4px; font-size: 18px; }
h2 a, .who a { color: inherit; }
li p { margin: 4px 0 0; font-size: 14px; color: var(--text-secondary); }
.empty { padding: 24px; text-align: center; background: var(--paper-card); border: 2px dashed var(--ink-45); border-radius: var(--radius-md); }
</style>
</head>
<body>
<main>
<header>
<h1>🐳 投稿展览</h1>
<p>蓝色大肥鱼国庆网站前台设计征集 · 已合并 ${real} 份投稿 · <a href="https://xn--pssy23gqgbz2d718b.com/events/national-day-2026.html">活动详情</a></p>
</header>
${real ? '' : '<p class="empty">还没有投稿，来当第一个吧。</p>'}
<ul>${items.map(card).join('')}</ul>
</main>
</body>
</html>
`);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('[gallery] ' + items.length + ' 个作品（含示例）→ ' + OUT);

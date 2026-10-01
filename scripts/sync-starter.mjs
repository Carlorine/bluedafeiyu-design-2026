#!/usr/bin/env node
// 从蓝色大肥鱼.com 公开的 /site-data.json 生成起步包：starter/data.json 与 starter/data.js
// 用法：node scripts/sync-starter.mjs        （维护者在活动开始前运行一次即可，参赛者不需要运行）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://xn--pssy23gqgbz2d718b.com';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'starter');
const abs = u => (!u ? '' : /^https?:/.test(u) ? u : ORIGIN + '/' + String(u).replace(/^\/+/, ''));

const res = await fetch(ORIGIN + '/site-data.json');
if (!res.ok) throw new Error('拉取 site-data.json 失败：' + res.status);
const site = await res.json();

const characters = site.characters.filter(c => c.status === 'active' && c.id !== 'owner-picks')
  .map(c => ({ id: c.id, name: c.name, aliases: c.aliases || [], colorSoft: 'var(--art-' + c.id + '-a)', colorDeep: 'var(--art-' + c.id + '-b)' }));
const known = new Set(characters.map(c => c.id));
const categories = site.categories.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name, description: c.description || '' }));
const works = site.works.filter(w => w.status === 'published' && known.has(w.characterId))
  .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  .map(w => ({
    slug: w.slug, name: w.name, description: w.description || '', commentary: w.commentary || '',
    characterId: w.characterId, categoryIds: w.categoryIds || [], tags: w.tags || [],
    width: w.width || null, height: w.height || null, createdAt: w.createdAt,
    thumb: abs(w.thumbUrl || w.thumbnailPath), large: abs(w.displayUrl || w.fullPath || w.thumbUrl), original: abs(w.originalUrl || w.path),
    page: ORIGIN + '/works/' + w.slug + '.html'
  }));

const data = { source: ORIGIN + '/', syncedAt: new Date().toISOString(), characters, categories, works };
const json = JSON.stringify(data, null, 1);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'data.json'), json + '\n');
fs.writeFileSync(path.join(OUT, 'data.js'), '// 与 data.json 内容相同。双击打开 HTML（file://）时 fetch 读不了 JSON，用 <script src="./data.js"> 就能拿到 window.SITE_DATA\nwindow.SITE_DATA = ' + json + ';\n');
console.log('[starter] 角色 ' + characters.length + ' · 分类 ' + categories.length + ' · 作品 ' + works.length);

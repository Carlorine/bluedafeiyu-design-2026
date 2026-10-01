#!/usr/bin/env node
// PR 自动检查：只改自己的文件夹、有 index.html 和 meta.json、体积不过大。
// 错误会让检查失败；相对路径之类的问题只给提示，由站长打开页面确认能不能跑。
// 用法：node scripts/check-submission.mjs --root <PR 检出目录> --base <基准提交> --author <GitHub 用户名>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : ''; };
const root = path.resolve(arg('--root') || '.');
const base = arg('--base');
const author = arg('--author');
const MAX_BYTES = 20 * 1024 * 1024;
const errors = [], warnings = [];
const gh = process.env.GITHUB_ACTIONS === 'true';
const report = (level, msg, file) => {
  (level === 'error' ? errors : warnings).push(msg);
  if (gh) console.log('::' + level + (file ? ' file=' + file : '') + '::' + msg);
  else console.log((level === 'error' ? '✗ ' : '! ') + msg + (file ? '（' + file + '）' : ''));
};
if (!base || !author) { console.error('缺少 --base 或 --author'); process.exit(2); }

const changed = execFileSync('git', ['-C', root, 'diff', '--name-only', '--no-renames', base + '...HEAD'], { encoding: 'utf8' })
  .split('\n').map(s => s.trim()).filter(Boolean);
if (!changed.length) report('error', 'PR 里没有改动任何文件');

// GitHub 用户名不区分大小写；文件夹名按 PR 作者核对
const mine = changed.filter(f => f.split('/')[0] === 'submissions' && (f.split('/')[1] || '').toLowerCase() === author.toLowerCase());
for (const f of changed.filter(f => !mine.includes(f))) report('error', '只能修改 submissions/' + author + '/ 里的文件', f);

const dirName = mine.length ? mine[0].split('/')[1] : author;
const dir = path.join(root, 'submissions', dirName);
if (mine.length && fs.existsSync(dir)) {
  if (!fs.existsSync(path.join(dir, 'index.html'))) report('error', '缺少入口文件 submissions/' + dirName + '/index.html');
  const metaFile = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaFile)) report('error', '缺少 submissions/' + dirName + '/meta.json（格式见 submissions/_example/meta.json）');
  else {
    try { const m = JSON.parse(fs.readFileSync(metaFile, 'utf8')); if (!m.title || typeof m.title !== 'string') report('error', 'meta.json 需要 title 字段（作品名）', 'submissions/' + dirName + '/meta.json'); }
    catch (e) { report('error', 'meta.json 不是合法的 JSON：' + e.message, 'submissions/' + dirName + '/meta.json'); }
  }
  let bytes = 0;
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else bytes += fs.statSync(p).size; } };
  walk(dir);
  if (bytes > MAX_BYTES) report('error', '文件夹总大小 ' + (bytes / 1048576).toFixed(1) + ' MB，超过 20 MB 上限');

  // 根路径（/xxx）在展览页的子目录里会失效
  for (const f of mine.filter(f => /\.(html?|css|js)$/i.test(f) && fs.existsSync(path.join(root, f)))) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    const hits = text.match(/(?:src|href)\s*=\s*["']\/(?!\/)[^"']*/gi) || [];
    if (hits.length) report('warning', '发现以 / 开头的路径，部署后可能打不开，建议改成 ./ 开头：' + hits.slice(0, 3).join('，'), f);
  }
} else if (mine.length) {
  report('warning', '这个 PR 删除了 submissions/' + dirName + '/，合并后作品会从展览页移除');
}

console.log('\n检查完成：' + errors.length + ' 个错误，' + warnings.length + ' 个提示。');
process.exit(errors.length ? 1 : 0);

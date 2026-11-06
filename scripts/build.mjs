// Сборка: проверяет файлы и копирует сайт в dist/. Без зависимостей (Node 18+).
import { readFileSync, existsSync, mkdirSync, cpSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SITE_FILES = ['index.html', 'style.css', 'script.js', 'data.js', 'bank.js'];
const SITE_DIRS = ['img', 'media'];
let errors = 0;
const fail = (msg) => { console.error('✗ ' + msg); errors++; };

// 1. синтаксис JS
for (const f of SITE_FILES.filter(f => f.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); console.log('✓ синтаксис ' + f); }
  catch (e) { fail(`синтаксическая ошибка в ${f}\n${e.stderr}`); }
}

// 2. все ссылки на img/ и media/ ведут на существующие файлы
const assetRe = /(?:img|media)\/[A-Za-z0-9_.\-\/]+\.(?:jpg|jpeg|png|webp|svg|mp4|pdf)/g;
const seen = new Set();
for (const f of SITE_FILES) {
  const text = readFileSync(f, 'utf8').split('\n')
    .filter(l => !l.trim().startsWith('//')).join('\n'); // примеры в комментариях не считаем
  for (const p of text.match(assetRe) || []) {
    if (seen.has(p)) continue; seen.add(p);
    if (!existsSync(p)) fail(`${f}: нет файла ${p}`);
  }
}
console.log(`✓ проверено файлов в img/ и media/: ${seen.size}`);

// 3. уникальные id у проектов
const bank = readFileSync('bank.js', 'utf8');
const ids = [...bank.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map(m => m[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) fail('повторяются id проектов: ' + [...new Set(dup)].join(', '));
else console.log(`✓ id проектов уникальны (${ids.length})`);

if (errors) { console.error(`\nСборка остановлена: ошибок ${errors}`); process.exit(1); }

// 4. копирование в dist/
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of SITE_FILES) cpSync(f, `dist/${f}`);
for (const d of SITE_DIRS) cpSync(d, `dist/${d}`, { recursive: true });
const mb = (statSync('dist/media/projects.mp4').size / 1048576).toFixed(1);
console.log(`\n✓ Готово: dist/ (видео ${mb} МБ). Загрузи содержимое dist/ на хостинг.`);

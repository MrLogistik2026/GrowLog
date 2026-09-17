#!/usr/bin/env node
/**
 * Alle Tests in beiden Zeitzonen — ein Befehl statt einer Schleife von Hand.
 *
 *   node testlauf.js                     alle test_*.js, Europe/Berlin und Pacific/Kiritimati
 *   node testlauf.js lexikon iceflush    nur Dateien, deren Name einen der Begriffe enthält
 *   node testlauf.js --parallel 6        mehr gleichzeitige Läufe (Vorgabe: Hälfte der Kerne, höchstens 6)
 *   node testlauf.js --zonen Europe/Berlin
 *
 * Warum es diese Datei gibt (Bewertung vom 17.09.2026, Hebel 12): Ob alles grün ist, hing an einer
 * PowerShell-Schleife aus dem Gedächtnis. Zweimal ist dabei etwas schiefgegangen — ein Test blieb nach v1.5.237
 * unbemerkt rot, und ein Suchmuster ohne Groß-/Kleinschreibung meldete „Laufzeitfehler: keine“ als Fehler.
 *
 * Zeitzone: Unter Windows wirkt `TZ=… node` in Git Bash nicht (CLAUDE.md). Hier bekommt jeder Kindprozess TZ über
 * seine Umgebung; ob das greift, prüft der Lauf vor dem ersten Test und bricht sonst ab.
 *
 * Ein Lauf gilt als rot bei Exit-Code ≠ 0 oder einer Zeile, die mit „FEHL“ beginnt bzw. einen JS-Fehlernamen trägt —
 * mit Groß-/Kleinschreibung, damit „Laufzeitfehler: keine“ nicht zählt.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const DIR = __dirname;
const argv = process.argv.slice(2);
const opt = (name, vorgabe) => {
  const i = argv.indexOf(name);
  if (i < 0) return vorgabe;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const zonen = String(opt('--zonen', 'Europe/Berlin,Pacific/Kiritimati')).split(',').map((z) => z.trim()).filter(Boolean);
const parallel = Math.max(1, parseInt(opt('--parallel', String(Math.min(6, Math.max(1, Math.floor(os.cpus().length / 2))))), 10) || 1);
const zeitlimitMs = Math.max(30, parseInt(opt('--zeitlimit', '600'), 10) || 600) * 1000;
const muster = argv.filter((a) => !a.startsWith('--'));

const ERWARTET = { 'Europe/Berlin': -120, 'Pacific/Kiritimati': -840 };
for (const z of zonen) {
  const r = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(new Date(2026, 6, 1).getTimezoneOffset()))'], { env: { ...process.env, TZ: z } });
  const ist = parseInt(String(r.stdout), 10);
  if (z in ERWARTET && ist !== ERWARTET[z]) {
    console.error(`Zeitzone ${z} greift nicht (Versatz ${ist}, erwartet ${ERWARTET[z]}) — Lauf abgebrochen.`);
    process.exit(2);
  }
}

const dateien = fs.readdirSync(DIR).filter((d) => /^test_.*\.js$/.test(d)).sort()
  .filter((d) => !muster.length || muster.some((m) => d.includes(m)));
if (!dateien.length) { console.error('Keine passende Testdatei.'); process.exit(2); }

const SCHLECHT = /^\s*FEHL\b|FEHLER:|Uncaught|TypeError|ReferenceError|SyntaxError/;
const jobs = [];
for (const z of zonen) for (const d of dateien) jobs.push({ zone: z, datei: d });

const start = Date.now();
const ergebnisse = [];
let naechster = 0;
let fertig = 0;

function lauf(job) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const kind = spawn(process.execPath, [job.datei], { cwd: DIR, env: { ...process.env, TZ: job.zone } });
    let out = '';
    kind.stdout.on('data', (b) => { out += b; });
    kind.stderr.on('data', (b) => { out += b; });
    const wecker = setTimeout(() => { out += '\nFEHLER: Zeitlimit überschritten'; kind.kill(); }, zeitlimitMs);
    kind.on('close', (code) => {
      clearTimeout(wecker);
      const zeilen = out.split(/\r?\n/);
      const schlecht = zeilen.filter((z) => SCHLECHT.test(z));
      const letzte = zeilen.map((z) => z.trim()).filter(Boolean).pop() || '';
      resolve({ ...job, code, schlecht, letzte, ms: Date.now() - t0 });
    });
  });
}

async function arbeiter() {
  while (naechster < jobs.length) {
    const job = jobs[naechster++];
    const r = await lauf(job);
    ergebnisse.push(r);
    fertig++;
    const rot = r.code !== 0 || r.schlecht.length > 0;
    if (rot) console.log(`ROT  ${r.zone} ${r.datei} (exit ${r.code}) — ${r.schlecht[0] || r.letzte}`);
    else if (process.stdout.isTTY) process.stdout.write(`\r${fertig}/${jobs.length} grün bis hier …`);
  }
}

(async () => {
  console.log(`${dateien.length} Testdateien × ${zonen.length} Zeitzonen = ${jobs.length} Läufe, ${parallel} gleichzeitig · Start ${new Date().toLocaleTimeString('de-DE')}`);
  await Promise.all(Array.from({ length: parallel }, arbeiter));
  if (process.stdout.isTTY) process.stdout.write('\n');
  const rot = ergebnisse.filter((r) => r.code !== 0 || r.schlecht.length > 0);
  const dauer = Math.round((Date.now() - start) / 1000);
  const langsam = ergebnisse.slice().sort((a, b) => b.ms - a.ms).slice(0, 3).map((r) => `${r.datei} ${Math.round(r.ms / 1000)} s`).join(', ');
  console.log(`Ende ${new Date().toLocaleTimeString('de-DE')} · ${Math.floor(dauer / 60)} min ${dauer % 60} s · langsamste: ${langsam}`);
  if (rot.length) {
    console.log(`\n${rot.length} von ${jobs.length} Läufen ROT:`);
    for (const r of rot) {
      console.log(`  ${r.zone} ${r.datei} (exit ${r.code})`);
      for (const z of r.schlecht.slice(0, 5)) console.log('    ' + z.trim());
    }
    process.exit(1);
  }
  console.log(`ALLE ${jobs.length} LÄUFE GRÜN`);
})();

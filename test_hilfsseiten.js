/**
 * Hebel 3, Punkt 7 — die beiden Hilfsseiten (07.10.2026, v1.5.334/335).
 *
 * rettung.html ist der Weg zu den Daten, wenn GrowSmart nicht mehr startet: Sie muss jeden Stand anbieten, den es gibt.
 * wiederherstellung.html spielt einen Stand ein: Sie muss dieselbe Strukturprüfung haben wie die App und offene
 * GrowSmart-Fenster über die Kennung growsmart_v4_gen erreichen (v1.5.327).
 * Die Seiten laufen über GS_RETTUNG / GS_WIEDER auch gegen ältere Fassungen und fallen dort um.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RETTUNG = fs.readFileSync(path.join(__dirname, process.env.GS_RETTUNG || 'rettung.html'), 'utf8');
const WIEDER = fs.readFileSync(path.join(__dirname, process.env.GS_WIEDER || 'wiederherstellung.html'), 'utf8');
const APP = fs.readFileSync(path.join(__dirname, process.env.GS_INDEX || 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const SK = 'growsmart_v4';
const EINTRAEGE = Object.keys(JSON.parse(SICHERUNG).entries).length;
const kopie = (datum) => { const st = JSON.parse(SICHERUNG); st._bakDate = datum; return JSON.stringify(st, (k, v) => (k === 'photos' ? [] : v)); };

async function seite(html, speicher, opts = {}) {
  const errors = [], downloads = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e && e.message) || e); if (!/Not implemented/i.test(m)) errors.push(m); });
  const dom = new JSDOM(html, {
    url: 'https://growsmart.test/' + (opts.datei || 'seite.html'), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      Object.keys(speicher || {}).forEach(k => w.localStorage.setItem(k, speicher[k]));
      const B = w.Blob;
      w.Blob = function (teile, o) { const b = new B(teile, o); b.__text = teile.join(''); return b; };
      w.URL.createObjectURL = (b) => { downloads.push({ text: b.__text }); return 'blob:x'; };
      w.HTMLAnchorElement.prototype.click = function () { if (downloads.length) downloads[downloads.length - 1].name = this.download; };
      w.alert = (t) => errors.push('alert: ' + t);
      if (opts.gesperrt) Object.defineProperty(w, 'localStorage', { configurable: true, get() { throw new w.DOMException('insecure', 'SecurityError'); } });
    },
  });
  await new Promise((r) => setTimeout(r, 100));
  const w = dom.window;
  return { w, errors, downloads, text: () => { const b = w.document.body.cloneNode(true); b.querySelectorAll('script').forEach(x => x.remove()); return b.textContent.replace(/\s+/g, ' '); }, knoepfe: () => Array.from(w.document.querySelectorAll('button')) };
}

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + JSON.stringify(info).slice(0, 300) : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ===== R: rettung.html bietet jeden Stand an (v1.5.334) =====
  console.log('\nR - rettung.html');
  {
    const k = kopie('2026-09-16');
    const r = await seite(RETTUNG, { [SK]: SICHERUNG.slice(0, Math.floor(SICHERUNG.length * 0.6)), growsmart_v4_bak: k, growsmart_v4_rettung: '{kaputt', growsmart_v4_rettung_info: '{"am":1}', growsmart_v4_gen: 'abc' }, { datei: 'rettung.html' });
    const t = r.text();
    pruef('R1 Tageskopie angeboten, mit Zyklen, Einträgen und Datum', new RegExp('Automatische Tageskopie.*Zyklen: 1 · Tageseinträge: ' + EINTRAEGE + ' · vom 2026-09-16').test(t), t.slice(0, 400));
    pruef('R2 aufgehobener alter Stand angeboten, als „nicht direkt importieren"', /Aufgehobener alter Stand/.test(t) && /nicht direkt importieren/.test(t));
    pruef('R3 der unlesbare Hauptstand wird trotzdem angeboten', /Dein gespeicherter Stand/.test(t) && /Ließ sich nicht lesen/.test(t));
    pruef('R4 Verwaltungsschlüssel (rettung_info, gen) werden nicht angeboten', !/rettung_info|growsmart_v4_gen/.test(t));
    pruef('R5 sagt, wo die Datei hin muss (Import)', /Einstellungen → Daten & Sicherheit → Import/.test(t));
    const knopf = r.knoepfe().find(b => /Herunterladen/.test(b.textContent) && b.parentNode.textContent.includes('Automatische Tageskopie'));
    if (knopf) knopf.click();
    const heute = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
    const dl = r.downloads[r.downloads.length - 1] || {};
    pruef('R6 Download der Kopie: Name mit lokalem Datum, Inhalt unverändert', dl.name === 'growsmart_v4_bak-' + heute + '.json' && dl.text === k, { name: dl.name, gleich: dl.text === k });
    pruef('R7 kein Hinweis mehr auf die „Vorschau der Claude-App"', !/Claude-App|Vorschau/.test(t));
    pruef('R8 keine JS-Fehler', r.errors.length === 0, r.errors[0]);
  }
  {
    const r = await seite(RETTUNG, { growsmart_v4_bak: kopie('2026-09-16') }, { datei: 'rettung.html' });
    pruef('R9 nur eine Tageskopie da: sie wird angeboten', /Automatische Tageskopie/.test(r.text()) && /1 Stand gefunden/.test(r.text()), r.text().slice(0, 200));
    const leer = await seite(RETTUNG, {}, { datei: 'rettung.html' });
    pruef('R10 nichts da: „Keine GrowSmart-Daten in diesem Browser"', /Keine GrowSmart-Daten in diesem Browser/.test(leer.text()));
    const gesperrt = await seite(RETTUNG, {}, { datei: 'rettung.html', gesperrt: true });
    pruef('R11 gesperrter Speicher: sagt den Grund, ohne Programm-Meldung', /lässt diese Seite nicht an den Speicher/.test(gesperrt.text()) && !/insecure/.test(gesperrt.text()), gesperrt.text().slice(0, 200));
  }

  // ===== W: wiederherstellung.html prüft wie die App (v1.5.335) =====
  console.log('\nW - wiederherstellung.html');
  const pruefe = async (text) => {
    const s = await seite(WIEDER, { [SK]: SICHERUNG }, { datei: 'wiederherstellung.html' });
    s.w.document.getElementById('feld').value = text;
    s.w.document.getElementById('pruefen').click();
    return s;
  };
  for (const [name, text] of [['cycles [null]', '{"cycles":[null]}'], ['cycles als Objekt', '{"cycles":{"0":{}}}'], ['entries null', '{"cycles":[{"id":"a"}],"entries":null}'], ['Zyklus ohne Kennung', '{"cycles":[{"name":"x"}],"entries":{}}'], ['abgeschnitten', SICHERUNG.slice(0, 5000)]]) {
    const s = await pruefe(text);
    const t = s.text();
    pruef(`W ${name}: abgelehnt, kein Einspiel-Knopf, keine Programm-Meldung`, /keine (gültige |GrowSmart-)Sicherung/.test(t) && !s.knoepfe().some(b => /Jetzt einspielen/.test(b.textContent)) && !/Cannot read|Unexpected|is not a function/.test(t), t.slice(300, 600));
  }
  {
    const s = await pruefe(SICHERUNG);
    pruef('W gültige Sicherung: „sieht gut aus" mit Knopf', /Sicherung sieht gut aus/.test(s.text()) && s.knoepfe().some(b => /Jetzt einspielen/.test(b.textContent)));
    const vorher = s.w.localStorage.getItem('growsmart_v4_gen');
    s.knoepfe().find(b => /Jetzt einspielen/.test(b.textContent)).click();
    pruef('W Einspielen setzt eine neue Kennung für offene GrowSmart-Fenster', s.w.localStorage.getItem('growsmart_v4_gen') !== vorher && s.w.localStorage.getItem('growsmart_v4_gen') !== null);
    pruef('W … und sagt, dass ein offener Tab neu geladen werden muss', /anderen Tab offen: dort neu laden/.test(s.text()));
    pruef('W keine JS-Fehler', s.errors.length === 0, s.errors[0]);
  }
  {
    // Seite und App urteilen gleich
    const s = await seite(WIEDER, {}, { datei: 'wiederherstellung.html' });
    const vc = new VirtualConsole();
    const app = new JSDOM(APP, { url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {}; } });
    await new Promise((r) => setTimeout(r, 300));
    const faelle = ['null', '[]', '{}', '{"foo":1}', '{"cycles":null}', '{"cycles":{}}', '{"entries":[]}', '{"fertPlans":null}', '{"cycles":[null]}',
      '{"cycles":[{"id":"a","plants":null}]}', '{"cycles":[{"id":"a","plants":{}}]}', '{"cycles":[{"id":"a","plants":"x"}]}', '{"cycles":[{"id":"a","plants":4}]}',
      '{"cycles":[{"name":"ohne Kennung"}]}', '{"cycles":[{"id":"a"}],"entries":{"2026-09-01":{"cycleData":{"b":{}}}}}', '{"cycles":[],"entries":{}}', SICHERUNG];
    const seiteU = faelle.map(f => s.w.standMangel ? s.w.standMangel(JSON.parse(f)) : 'fehlt');
    const appU = faelle.map(f => app.window.eval('_standMangel(' + f + ')'));
    const abweichend = faelle.map((f, i) => (seiteU[i] === appU[i] ? null : f.slice(0, 60) + ': Seite ' + seiteU[i] + ', App ' + appU[i])).filter(Boolean);
    pruef('W Seite und App urteilen in ' + faelle.length + ' Fällen gleich', abweichend.length === 0, abweichend);
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
  process.exit(0);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });

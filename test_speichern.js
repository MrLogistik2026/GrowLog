/**
 * Hebel 3, Punkt 7 — die letzten Speicher-Störfälle (07.10.2026, ab v1.5.320).
 *
 * Jeder Abschnitt gehört zu einer Version und stellt zuerst die Lage her, in der die App früher still verlor:
 * ein Schreibfehler, der nicht „voll" heißt, eine Vorarbeit, die wirft, ein gesperrter Browser-Speicher,
 * Rückgängig bei vollem Speicher, ein zweites Fenster, die Speicheranzeige, der Versatz von ↩.
 * Läuft über GS_INDEX auch gegen einen älteren Build und fällt dort um.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, process.env.GS_INDEX || 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const SK = 'growsmart_v4';

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    lineCap: '', lineJoin: '', shadowBlur: 0, shadowColor: '', beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop,
    arcTo: noop, rect: noop, fill: noop, stroke: noop, fillRect: noop, clearRect: noop, strokeRect: noop, save: noop, restore: noop,
    translate: noop, rotate: noop, scale: noop, setTransform: noop, fillText: noop, strokeText: noop, drawImage: noop, clip: noop,
    setLineDash: noop, quadraticCurveTo: noop, bezierCurveTo: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}

async function load(speicher, opts = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    ...(opts.quota ? { storageQuota: opts.quota } : {}),
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      Object.keys(speicher || {}).forEach(k => w.localStorage.setItem(k, speicher[k]));
      // Fehler auf Zuruf: w.__kaputt = 'kaputt' lässt das Schreiben von growsmart_v4 mit einem Nicht-Quota-Fehler scheitern.
      const orig = w.Storage.prototype.setItem;
      w.Storage.prototype.setItem = function (k, v) {
        if (k === SK && w.__kaputt) { const e = new Error(w.__kaputt); e.name = w.__kaputt === 'voll' ? 'QuotaExceededError' : 'Error'; throw e; }
        return orig.call(this, k, v);
      };
      if (opts.gesperrt) {
        Object.defineProperty(w, 'localStorage', { configurable: true, get() { const e = new w.DOMException('The operation is insecure.', 'SecurityError'); throw e; } });
      }
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 60));
  const dialoge = [], toasts = [];
  w.customConfirm = (titel, text) => { dialoge.push(String(titel) + '\n' + String(text)); return Promise.resolve(!!opts.antwort); };
  w.toast = (t) => { toasts.push(String(t)); };
  await new Promise((r) => setTimeout(r, opts.warten === undefined ? 400 : opts.warten));
  const rot = () => { const els = Array.from(w.document.body.children).filter(el => /background:\s*var\(--red\)/.test(el.style.cssText) && el.style.width === '8px'); return els.some(el => el.style.opacity === '1'); };
  return { window: w, errors, dialoge, toasts, rot, E: (s) => w.eval(s), get: (k) => { try { return w.localStorage.getItem(k); } catch (e) { return null; } } };
}

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + JSON.stringify(info) : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ===== A: Speichern scheitert nie still (v1.5.320) =====
  console.log('\nA - Ein Schreibfehler, der nicht „voll" heißt');
  {
    const a = await load({ [SK]: SICHERUNG });
    pruef('A0 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    a.window.__kaputt = 'kaputt';
    a.toasts.length = 0;
    a.E("S.entries['2026-09-30'] = { note: 'nicht gespeichert' }; saveS()");
    pruef('A1 ein anderer Fehler als „voll" wird gemeldet', a.toasts.some(t => /Speichern fehlgeschlagen — deine letzte Änderung ist NICHT gespeichert/.test(t)), a.toasts);
    pruef('A2 der rote Punkt steht', a.rot());
    a.toasts.length = 0;
    a.E("S.entries['2026-09-30'].note = 'zweiter Versuch'; saveS()");
    pruef('A3 gleich danach kein zweiter Toast, der Punkt bleibt rot', a.toasts.length === 0 && a.rot());
    a.window.__kaputt = null;
    a.E('saveS()');
    pruef('A4 klappt das Speichern wieder, geht der Punkt aus', !a.rot() && (a.get(SK) || '').includes('zweiter Versuch'));
    // Vorarbeit wirft: trotzdem schreiben
    a.E("window.syncGlobalsToActivePlan = () => { throw new Error('Plan kaputt'); }; S.entries['2026-09-29'] = { note: 'trotz Vorarbeit' }; saveS._lastUndo = 0; saveS()");
    pruef('A5 wirft eine Vorarbeit, wird trotzdem geschrieben', (a.get(SK) || '').includes('trotz Vorarbeit') && !!a.E('saveS._vorarbeitFehler'), a.E('saveS._vorarbeitFehler'));
  }
  {
    // Viele verwaiste Tagesdaten auf einmal werden nicht gelöscht
    const st = JSON.parse(SICHERUNG);
    const tage = Object.keys(st.entries).slice(0, 15);
    tage.forEach(d => { st.entries[d].cycleData = st.entries[d].cycleData || {}; st.entries[d].cycleData['verloren'] = { water: '500' }; });
    const b = await load({ [SK]: JSON.stringify(st) });
    b.E('saveS._lastUndo = 0; saveS()');
    const rest = JSON.parse(b.get(SK));
    pruef('A6 15 verwaiste Tagesdaten auf einmal: stehen lassen und vermerken statt still löschen',
      Object.values(rest.entries).filter(e => e.cycleData && e.cycleData.verloren).length === 15 && /verwaiste Tagesdaten: 15/.test(b.E('saveS._vorarbeitFehler') || ''));
    pruef('A7 keine JS-Fehler', b.errors.length === 0, b.errors[0]);
  }

  // ===== B: Gesperrter Browser-Speicher wird gemeldet (v1.5.321) =====
  console.log('\nB - Der Browser lässt GrowSmart nicht an den Speicher');
  {
    const b = await load({}, { gesperrt: true, warten: 1500 });
    pruef('B0 Start ohne JS-Fehler', b.errors.length === 0, b.errors[0]);
    pruef('B1 die App weiß, dass der Speicher gesperrt ist', b.E("typeof _speicherGesperrt !== 'undefined' && _speicherGesperrt") === true);
    // Ohne Speicher erscheint der Haftungsausschluss bei jedem Start; der Hinweis folgt nach der Zustimmung.
    b.E('_acceptDisclaimer()');
    await new Promise((r) => setTimeout(r, 1000));
    const d =b.dialoge.find(x => /kann hier nichts speichern/.test(x)) || '';
    pruef('B2 beim Start erscheint ein Hinweis, der den Grund nennt', /Website-Daten/.test(d) && /beim Schließen weg/.test(d), b.dialoge);
    pruef('B3 der Hinweis sagt, was zu tun ist', /So behebst du es/.test(d) && /normalen Fenster/.test(d));
    pruef('B4 der Hinweis ist kein Download-Angebot', !/herunterlad/i.test(d));
    b.toasts.length = 0;
    b.E("S.entries['2026-09-30'] = { note: 'geht nicht' }; saveS._lastQuotaErr = 0; saveS()");
    pruef('B5 ein Speicherversuch nennt den Grund statt „gespeichert"', b.toasts.some(t => /lässt GrowSmart nicht an den Speicher/.test(t)), b.toasts);
    pruef('B6 der rote Punkt steht', b.rot());
  }
  {
    // Gegenprobe: normaler, leerer Speicher bleibt ein normaler Erststart
    const n = await load({}, { warten: 1500 });
    pruef('B7 normaler leerer Speicher gilt nicht als gesperrt', n.E("typeof _speicherGesperrt === 'undefined' ? false : _speicherGesperrt") === false && !n.dialoge.some(x => /kann hier nichts speichern/.test(x)), n.dialoge);
    pruef('B8 keine JS-Fehler', n.errors.length === 0, n.errors[0]);
  }

  // ===== C: Rückgängig und Wiederherstellen melden einen Fehlschlag (v1.5.322) =====
  console.log('\nC - ↩ und ↪, wenn das Speichern scheitert');
  {
    const c = await load({ [SK]: SICHERUNG });
    const tag = c.E('Object.keys(S.entries).sort()[0]');
    // Stand vor dem Löschen merken, dann löschen und speichern
    c.E(`undoStack.length = 0; redoStack.length = 0; undoStack.push(JSON.stringify(S)); delete S.entries['${tag}']; _skSchreiben(JSON.stringify(S));`);
    c.window.__kaputt = 'voll';
    c.toasts.length = 0;
    c.E('doUndo()');
    pruef('C1 ↩ bei vollem Speicher: im Arbeitsspeicher zurück', c.E(`!!S.entries['${tag}']`));
    pruef('C2 … und der Toast sagt „NICHT gespeichert" mit dem Grund', c.toasts.some(t => /Rückgängig gemacht, aber NICHT gespeichert/.test(t) && /Speicher ist voll/.test(t)), c.toasts);
    pruef('C3 … keine Erfolgsmeldung „↩ Rückgängig (…)"', !c.toasts.some(t => /^↩ Rückgängig \(/.test(t)), c.toasts);
    pruef('C4 … und der rote Punkt steht', c.rot());
    c.window.__kaputt = 'kaputt';
    c.toasts.length = 0;
    c.E('doRedo()');
    pruef('C5 ↪ bei anderem Schreibfehler: Toast „Wiederhergestellt, aber NICHT gespeichert"', c.toasts.some(t => /Wiederhergestellt, aber NICHT gespeichert/.test(t)) && !c.toasts.some(t => /^↪ Wiederhergestellt \(/.test(t)), c.toasts);
    c.window.__kaputt = null;
    c.toasts.length = 0;
    c.E('doUndo()');
    pruef('C6 klappt das Schreiben wieder: Erfolgsmeldung, Punkt aus, Eintrag gespeichert',
      c.toasts.some(t => /^↩ Rückgängig \(/.test(t)) && !c.rot() && !!JSON.parse(c.get(SK)).entries[tag], c.toasts);
    // Nach einem Import lädt die App gleich neu: ↩ darf dann nichts ändern
    c.E(`undoStack.push(JSON.stringify(S)); S.entries['2026-09-30'] = { note: 'vor dem Neuladen' }; _neuladenAnsteht = true;`);
    c.toasts.length = 0;
    c.E('doUndo()');
    pruef('C7 ↩ im Neulade-Fenster ändert nichts und sagt warum', c.E(`!!S.entries['2026-09-30']`) && c.toasts.some(t => /lädt gleich neu/.test(t)), c.toasts);
    pruef('C8 keine JS-Fehler', c.errors.length === 0, c.errors[0]);
  }

  // ===== D: Der erste Tipp auf ↩ nimmt die letzte Änderung zurück (v1.5.325) =====
  console.log('\nD - Rückgängig ohne Versatz');
  {
    const d = await load({ [SK]: SICHERUNG });
    const tag = d.E('Object.keys(S.entries).sort()[5]');
    const da = () => d.E(`!!S.entries['${tag}']`);
    const imSpeicher = () => !!JSON.parse(d.get(SK)).entries[tag];
    d.E(`saveS._lastUndo = 0; delete S.entries['${tag}']; saveS()`);
    d.E('doUndo()');
    pruef('D1 Eintrag löschen, ein Tipp auf ↩: wieder da, auch im Speicher', da() && imSpeicher());
    d.E('doRedo()');
    pruef('D2 ↪: wieder gelöscht', !da() && !imSpeicher());
    d.E('doUndo()');
    pruef('D3 ↩: wieder da', da());
    // Aufrufer, die vor der Änderung selbst pushUndo() rufen, plus saveS danach: nur ein Schritt
    d.E(`S.entries['${tag}'] = S.entries['${tag}'] || {}; saveS._lastUndo = 0; saveS()`);   // gegen den alten Stand: Eintrag sicher da
    const vorher = d.E('undoStack.length');
    d.E(`pushUndo(); S.entries['${tag}'].note = 'geändert'; saveS._lastUndo = 0; saveS()`);
    pruef('D4 pushUndo() vor der Änderung plus saveS: ein Schritt, nicht zwei', d.E('undoStack.length') === vorher + 1, [vorher, d.E('undoStack.length')]);
    d.E('doUndo()');
    pruef('D5 … und ein Tipp nimmt die Änderung zurück', d.E(`S.entries['${tag}'].note !== 'geändert'`));
    // Erste Änderung nach dem Start: ein Tipp genügt (frisch geladen)
    const e = await load({ [SK]: SICHERUNG });
    const t2 = e.E('Object.keys(S.entries).sort()[7]');
    e.E(`delete S.entries['${t2}']; saveS()`);
    e.E('doUndo()');
    pruef('D6 erste Änderung nach dem Start: ein Tipp genügt', e.E(`!!S.entries['${t2}']`));
    pruef('D7 keine JS-Fehler', d.errors.length === 0 && e.errors.length === 0, d.errors[0] || e.errors[0]);
  }

  // ===== E: Die Speicheranzeige zählt alle GrowSmart-Schlüssel (v1.5.326) =====
  console.log('\nE - Speicheranzeige');
  {
    const alt = 'x'.repeat(60000);
    const s = await load({ [SK]: SICHERUNG, growsmart_v3: alt, growsmart_v4_vor_wiederherstellung: alt, fremd_schluessel: alt });
    const info = JSON.parse(s.E('JSON.stringify(_storageInfo())'));
    const soll = JSON.parse(s.E("(() => { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('growsmart')) n += k.length + localStorage.getItem(k).length; } return JSON.stringify(n); })()"));
    pruef('E1 alte Schlüssel und die Vor-Wiederherstellungs-Kopie zählen mit', info.ownBytes === soll && info.ownBytes > SICHERUNG.length + 120000, [info.ownBytes, soll]);
    pruef('E2 Schlüssel anderer Seiten zählen nicht', info.ownBytes < soll + 60000);
    pruef('E3 keine JS-Fehler', s.errors.length === 0, s.errors[0]);
  }

  // ===== F: Ein anderes Fenster wird nicht überschrieben (v1.5.327) =====
  console.log('\nF - Zweites Fenster');
  const fremdStand = () => { const st = JSON.parse(SICHERUNG); st.entries['2026-09-28'] = { note: 'aus dem anderen Fenster' }; return JSON.stringify(st); };
  const ereignis = (x, key) => x.window.dispatchEvent(new x.window.StorageEvent('storage', { key }));
  {
    // Zweiter Tab schreibt, das Ereignis kommt an
    const f = await load({ [SK]: SICHERUNG });
    const fremd = fremdStand();
    f.window.localStorage.setItem(SK, fremd); f.window.localStorage.setItem('growsmart_v4_gen', 'anderer-tab');
    ereignis(f, SK);
    await new Promise((r) => setTimeout(r, 50));
    pruef('F1 Ereignis aus einem anderen Tab: Hinweis „woanders geändert" mit „Neu laden"', f.dialoge.some(d => /woanders geändert/.test(d) && /Lade neu/.test(d)), f.dialoge);
    pruef('F2 … rotes Band „Dieses Fenster speichert nicht mehr"', /Dieses Fenster speichert nicht mehr/.test(f.window.document.getElementById('sperrband')?.textContent || ''));
    f.toasts.length = 0;
    f.E("S.entries['2026-09-27'] = { note: 'alter Tab' }; saveS()");
    pruef('F3 der alte Tab überschreibt nicht; Band und roter Punkt stehen weiter', f.get(SK) === fremd && f.rot() && !!f.window.document.getElementById('sperrband'), f.toasts);
    f.toasts.length = 0;
    f.E('doUndo()');
    pruef('F4 auch ↩ schreibt nicht darüber und meldet keinen Erfolg', f.get(SK) === fremd && !f.toasts.some(t => /^↩ Rückgängig \(/.test(t)), f.toasts);
    // Die Tür: Import ersetzt bewusst alles
    f.E(`_standErsetzenUndNeuLaden(${JSON.stringify(SICHERUNG)}, 'Backup geladen')`);
    pruef('F5 Import bleibt möglich (ersetzt bewusst alles)', f.get(SK) === SICHERUNG);
    pruef('F6 keine JS-Fehler', f.errors.length === 0, f.errors[0]);
  }
  {
    // Eingefrorener Tab: kein Ereignis, aber die Kennung ist neu
    const g = await load({ [SK]: SICHERUNG });
    const fremd = fremdStand();
    g.window.localStorage.setItem(SK, fremd); g.window.localStorage.setItem('growsmart_v4_gen', 'anderer-tab');
    g.E("S.entries['2026-09-27'] = { note: 'alter Tab' }; saveS()");
    pruef('F7 ohne Ereignis (eingefrorener Tab): die neue Kennung reicht, nichts wird überschrieben', g.get(SK) === fremd && g.dialoge.some(d => /woanders geändert/.test(d)));
  }
  {
    // Zurück-Taste aus wiederherstellung.html: Stand neu, Kennung unverändert, kein Ereignis — beim Zurückkehren prüfen
    const h = await load({ [SK]: SICHERUNG });
    const fremd = fremdStand();
    h.window.localStorage.setItem(SK, fremd);
    h.window.document.dispatchEvent(new h.window.Event('visibilitychange'));
    pruef('F8 beim Zurückkehren ins Fenster wird der ganze Stand verglichen', h.dialoge.some(d => /woanders geändert/.test(d)), h.dialoge);
    h.E("S.entries['2026-09-27'] = { note: 'alter Tab' }; saveS()");
    pruef('F9 … und dann nicht überschrieben', h.get(SK) === fremd);
  }
  {
    // Fehlalarm-Schutz: anderer Tab schreibt denselben Stand neu
    const k = await load({ [SK]: SICHERUNG });
    k.E("saveS._lastUndo = 0; saveS()");
    const gleich = k.get(SK);
    k.window.localStorage.setItem(SK, gleich); k.window.localStorage.setItem('growsmart_v4_gen', 'anderer-tab');
    ereignis(k, SK);
    ereignis(k, 'fremder_schluessel');
    k.E("S.entries['2026-09-27'] = { note: 'darf gespeichert werden' }; saveS()");
    pruef('F10 derselbe Stand mit neuer Kennung ist kein Konflikt: kein Hinweis, es wird gespeichert', !k.dialoge.some(d => /woanders geändert/.test(d)) && (k.get(SK) || '').includes('darf gespeichert werden'), k.dialoge);
    pruef('F11 keine JS-Fehler', k.errors.length === 0, k.errors[0]);
  }
  {
    // Werkseinstellung in einem anderen Fenster: der Speicher ist leer, dieses Fenster schreibt nichts zurück
    const m = await load({ [SK]: SICHERUNG });
    m.window.localStorage.clear();
    ereignis(m, null);
    m.E("S.entries['2026-09-27'] = { note: 'alter Tab' }; saveS()");
    pruef('F12 nach „alles löschen" im anderen Fenster schreibt dieses Fenster die Daten nicht zurück', m.get(SK) === null);
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
  process.exit(0);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });

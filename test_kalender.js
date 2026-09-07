/**
 * (v1.5.127) Der Kalender — der letzte nie geprüfte Bildschirm.
 *
 * Drei Befunde vom 07.09.2026:
 *
 * BEFUND 1 - Das Tagesmenue war am Rechner gar nicht erreichbar.
 * `showCtx` hing ausschliesslich am Touch-Langdruck (`lpS` ueber `ontouchstart`), und
 * `oncontextmenu="return false"` schaltete den einzigen anderen Weg ausdruecklich ab.
 * Zwei Funktionen haengen sogar NUR daran: `skipDayFromCal` ("Giess-Tag ueberspringen",
 * bei Regen) und `restoreDayFromCal` ("Tag zurueckholen"). Der Hinweis unter dem Kalender
 * bewarb sie trotzdem auf jedem Geraet.
 *
 * BEFUND 2 - Bei zwei gleichzeitigen Grows gehoerten Symbol und Tagesnummer zu
 * VERSCHIEDENEN Pflanzen. Die Zelle waehlte Farbe und Symbol nach dem Zyklus mit der
 * Aktion (`actionDay`), die Nummer aber immer nach dem ersten Zyklus (`dayInfo[0]`).
 * Gemessen: Am 03.09. zeigte die Zelle "🌿 T111" - das Giess-Symbol gehoerte zum 52 Tage
 * alten zweiten Grow, T111 zum ersten, der laengst in der Trocknung war.
 *
 * BEFUND 3 - Hatte ein ZWEITER Zyklus am selben Tag etwas zu tun, war davon nichts zu
 * sehen. Am 06.09. stand "IceFlush" (Zyklus 1), waehrend Zyklus 2 einen Giesstag hatte.
 * Patrick will vor dem Release zwei Sorten in einem Zelt testen - genau dieser Fall.
 *
 * Geprueft und in Ordnung: Datumsraster ueber beide Zeitumstellungen 2026, Symbole
 * gegen `getAction`, Beschriftung nur am ersten Tag einer Phase (bewusst, sonst stuende
 * siebenmal "Trocknen" untereinander).
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    textBaseline: '', globalAlpha: 1, lineCap: '', lineJoin: '', shadowBlur: 0, shadowColor: '',
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop,
    rect: noop, fill: noop, stroke: noop, fillRect: noop, clearRect: noop, strokeRect: noop,
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop, setTransform: noop,
    fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}

async function load() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true;
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      w.localStorage.setItem('growsmart_v4', BACKUP);
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { window, errors, E: (s) => window.eval(s) };
}

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('');
  console.log('A - Das Datumsraster stimmt, auch ueber die Zeitumstellungen');
  {
    // 2026: Sommerzeit beginnt am 29.03., endet am 25.10. Dazu Februar und Jahreswechsel.
    const r = JSON.parse(E(`(function(){
      var fehler = [], monate = [[2026,1],[2026,2],[2026,3],[2026,9],[2026,10],[2026,11],[2027,0]];
      monate.forEach(function(mm){
        var j = mm[0], m = mm[1];
        calDate = new Date(j, m, 15);
        renderCal();
        var zellen = [].slice.call(document.querySelectorAll('#cal-body .cal-grid > *'))
          .filter(function(z){ return /calClick/.test(z.getAttribute('onclick') || ''); });
        var soll = new Date(j, m + 1, 0).getDate();
        if (zellen.length !== soll) fehler.push(j + '-' + (m+1) + ': ' + zellen.length + ' statt ' + soll);
        var gesehen = {};
        zellen.forEach(function(z){
          var iso = (z.getAttribute('onclick').match(/calClick\\('([\\d-]+)'\\)/) || [])[1];
          var num = (z.querySelector('.cal-num') || {}).textContent;
          if (!iso) { fehler.push('Zelle ohne Datum in ' + j + '-' + (m+1)); return; }
          if (gesehen[iso]) fehler.push('Tag doppelt: ' + iso);
          gesehen[iso] = 1;
          var t = iso.split('-');
          if (Number(t[0]) !== j || Number(t[1]) !== m + 1) fehler.push('Falscher Monat: ' + iso + ' in ' + j + '-' + (m+1));
          if (Number(t[2]) !== Number(num)) fehler.push('Zelle zeigt ' + num + ', Datum ist ' + iso);
        });
      });
      calDate = new Date(); renderCal();
      return JSON.stringify(fehler);
    })()`));
    pruef('Sieben Monate ohne einen einzigen Datumsfehler', r.length === 0, JSON.stringify(r.slice(0, 5)));
  }

  console.log('');
  console.log('B - Jeder Aktionstag traegt sein Symbol');
  {
    const r = JSON.parse(E(`(function(){
      var c = S.cycles[0], fehlend = [], geprueft = 0;
      for (var m = 4; m <= 9; m++) {
        calDate = new Date(2026, m, 15); renderCal();
        var zellen = [].slice.call(document.querySelectorAll('#cal-body .cal-grid > *'))
          .filter(function(z){ return /calClick/.test(z.getAttribute('onclick') || ''); });
        zellen.forEach(function(z){
          var iso = (z.getAttribute('onclick').match(/calClick\\('([\\d-]+)'\\)/) || [])[1];
          if (!iso) return;
          var a = getAction(iso, c);
          if (!a) return;
          geprueft++;
          if (!z.querySelector('.cal-icon')) fehlend.push(iso + '/' + a);
        });
      }
      calDate = new Date(); renderCal();
      return JSON.stringify({ geprueft: geprueft, fehlend: fehlend });
    })()`));
    pruef('Es gibt ueberhaupt Aktionstage zu pruefen', r.geprueft > 20, 'geprueft=' + r.geprueft);
    pruef('Keiner davon ohne Symbol', r.fehlend.length === 0, JSON.stringify(r.fehlend.slice(0, 6)));
  }

  console.log('');
  console.log('C - Das Tagesmenue ist auch ohne Touch erreichbar');
  {
    pruef('Die Zelle ruft beim Rechtsklick das Menue auf',
      E(`document.getElementById('cal-body').innerHTML.indexOf('calCtxMenu') >= 0`),
      'oncontextmenu ohne calCtxMenu');
    pruef('Der alte Riegel "return false" ist weg',
      !E(`/oncontextmenu="return false"/.test(document.getElementById('cal-body').innerHTML)`));

    // Maus-Rechtsklick: Menue auf, und der naechste Linksklick darf NICHT geschluckt werden.
    const maus = JSON.parse(E(`(function(){
      goTo('cal');
      lpDone = false;
      calCtxMenu(todayISO(), { preventDefault: function(){} });
      var offen = document.querySelectorAll('.ctx-item').length;
      var sperre = lpDone;
      closeCtx();
      goTo('cal');
      calClick(todayISO());
      var schirm = document.querySelector('.screen.active').id;
      goTo('cal');
      return JSON.stringify({ offen: offen, sperre: sperre, schirm: schirm });
    })()`));
    pruef('Rechtsklick oeffnet das Menue', maus.offen > 0, JSON.stringify(maus));
    pruef('Er setzt KEINE Klick-Sperre (die Maus feuert keinen Klick nach)',
      maus.sperre === false, JSON.stringify(maus));
    pruef('Der naechste Linksklick oeffnet den Tag sofort',
      maus.schirm === 'scr-entry', JSON.stringify(maus));

    // Touch: contextmenu waehrend der Langdruck-Timer laeuft (Android-Reihenfolge).
    const touch = JSON.parse(E(`(function(){
      goTo('cal');
      lpDone = false;
      lpS(todayISO(), { touches: [{ clientX: 1, clientY: 1 }] });
      calCtxMenu(todayISO(), { preventDefault: function(){} });
      var r = { offen: document.querySelectorAll('.ctx-item').length, sperre: lpDone };
      closeCtx(); lpDone = false; lpE();
      return JSON.stringify(r);
    })()`));
    pruef('Beruehrung: Menue oeffnet sich', touch.offen > 0, JSON.stringify(touch));
    pruef('Beruehrung: die Klick-Sperre wird gesetzt (dort folgt ein Klick)',
      touch.sperre === true, JSON.stringify(touch));

    // Und die zwei Funktionen, die NUR ueber dieses Menue erreichbar sind.
    pruef('skipDayFromCal existiert', E(`typeof skipDayFromCal === 'function'`));
    pruef('restoreDayFromCal existiert', E(`typeof restoreDayFromCal === 'function'`));
  }

  console.log('');
  console.log('D - Zwei gleichzeitige Grows: Symbol und Tagesnummer gehoeren zusammen');
  {
    const r = JSON.parse(E(`(function(){
      var sicherung = JSON.stringify(S.cycles);
      try {
        var c = S.cycles[0];
        var c2 = JSON.parse(JSON.stringify(c));
        c2.id = 'test2'; c2.name = 'Zweiter Grow';
        c2.colorId = (COLORS[1] || COLORS[0]).id; c2.symbol = SYMS[1] || SYMS[0];
        c2.startDate = isoPlus(todayISO(), -55);
        delete c2.offsetHistory;
        S.cycles.push(c2);
        calDate = new Date(); goTo('cal');
        var zellen = [].slice.call(document.querySelectorAll('#cal-body .cal-grid > *'))
          .filter(function(z){ return /calClick/.test(z.getAttribute('onclick') || ''); });
        var nurZweiter = null, beide = null;
        zellen.forEach(function(z){
          var iso = (z.getAttribute('onclick').match(/calClick\\('([\\d-]+)'\\)/) || [])[1];
          if (!iso) return;
          var a1 = getAction(iso, S.cycles[0]), a2 = getAction(iso, c2);
          var p1 = phase(iso, S.cycles[0]), p2 = phase(iso, c2);
          if (!p1 || !p2) return;
          var tag = (z.querySelector('.cal-tag') || {}).textContent || '';
          var punkte = z.querySelectorAll('span[title] span').length;
          if (!a1 && a2 && !nurZweiter) nurZweiter = { iso: iso, tagC1: p1.day, tagC2: p2.day, zeigt: tag };
          if (a1 && a2 && !beide) beide = { iso: iso, a1: a1, a2: a2, zeigt: tag, punkte: punkte,
            titel: (z.querySelector('span[title]') || {}).title || '' };
        });
        return JSON.stringify({ nurZweiter: nurZweiter, beide: beide });
      } finally { S.cycles = JSON.parse(sicherung); goTo('cal'); }
    })()`));

    pruef('Es gibt einen Tag, an dem nur der zweite Grow etwas hat', !!r.nurZweiter, JSON.stringify(r));
    if (r.nurZweiter) {
      pruef('Dort steht die Nummer des ZWEITEN Grows, nicht die des ersten',
        r.nurZweiter.zeigt === 'T' + r.nurZweiter.tagC2, JSON.stringify(r.nurZweiter));
      pruef('Und eben NICHT die des ersten (das war der Fehler)',
        r.nurZweiter.zeigt !== 'T' + r.nurZweiter.tagC1, JSON.stringify(r.nurZweiter));
    }

    pruef('Es gibt einen Tag, an dem BEIDE Grows etwas haben', !!r.beide, JSON.stringify(r));
    if (r.beide) {
      pruef('Der zweite Grow wird durch einen Punkt angezeigt',
        r.beide.punkte >= 1, JSON.stringify(r.beide));
      pruef('Der Punkt nennt im Tooltip Grow und Aufgabe',
        /Zweiter Grow/.test(r.beide.titel) && r.beide.titel.length > 12, r.beide.titel);
    }
  }

  console.log('');
  console.log('E - Mit nur einem Zyklus ist alles wie zuvor');
  {
    const r = JSON.parse(E(`(function(){
      calDate = new Date(2026, 8, 15); goTo('cal');
      var c = S.cycles[0];
      var zellen = [].slice.call(document.querySelectorAll('#cal-body .cal-grid > *'))
        .filter(function(z){ return /calClick/.test(z.getAttribute('onclick') || ''); });
      var punkte = 0, tagsFalsch = [];
      zellen.forEach(function(z){
        var iso = (z.getAttribute('onclick').match(/calClick\\('([\\d-]+)'\\)/) || [])[1];
        if (!iso) return;
        punkte += z.querySelectorAll('span[title] span').length;
        var p = phase(iso, c);
        var tag = (z.querySelector('.cal-tag') || {}).textContent || '';
        if (p && tag && tag !== 'T' + p.day) tagsFalsch.push(iso + ': ' + tag + ' statt T' + p.day);
      });
      calDate = new Date(); renderCal();
      return JSON.stringify({ punkte: punkte, tagsFalsch: tagsFalsch });
    })()`));
    pruef('Keine Zweit-Grow-Punkte bei nur einem Zyklus', r.punkte === 0, 'punkte=' + r.punkte);
    pruef('Jede Tagesnummer stimmt mit phase() ueberein',
      r.tagsFalsch.length === 0, JSON.stringify(r.tagsFalsch.slice(0, 5)));
  }

  console.log('');
  console.log('F - Der Hinweis unter dem Kalender verspricht nichts Unerreichbares');
  {
    const t = E(`(function(){ goTo('cal'); return document.getElementById('cal-body').textContent.replace(/\\s+/g,' '); })()`);
    pruef('Er nennt jetzt auch den Rechtsklick', /Rechtsklick/.test(t), t.slice(-220));
    pruef('Und weiterhin das lange Druecken', /lange drücken/.test(t), t.slice(-220));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();

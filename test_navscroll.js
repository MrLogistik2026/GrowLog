// Beim Blättern zwischen Tagen bleibt der Block oben im Bild derselbe.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-03');
  const out = {}, fehler = [];
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -110); c.anzuchtDays = 21; c.bloomDays = 85;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c); c.flushDryDays = 0; c._flushDryOff = true;
    S.entries = {}; saveS(); S.beginnerMode = false;
    // Trichom-Werte anlegen, damit der Block existiert
    [104, 106, 108].forEach(d => {
      const i = isoPlus(c.startDate, d - 1);
      S.entries[i] = { cycleData: { [c.id]: { trichomes: { clear: 30, milky: 66, amber: 4 } } } };
    });
    saveS();
    entryFrom = 'cal'; openEntry(isoPlus(c.startDate, 103));
  })()`);
  // Marker vorhanden?
  out.marker = ev(`[...document.getElementById('entry-body').querySelectorAll('[data-sect]')].map(x=>x.getAttribute('data-sect'))`);
  if (!out.marker.includes('trichome')) fehler.push('Trichom-Block ohne Marker');
  if (!out.marker.includes('umgebung')) fehler.push('Umgebungs-Block ohne Marker');

  // jsdom kennt keine echten Layout-Höhen — Positionen simulieren
  ev(`(function(){
    const el = document.getElementById('entry-body');
    el.getBoundingClientRect = () => ({ top: 0, bottom: 800, left: 0, right: 400, width: 400, height: 800 });
    Object.defineProperty(el, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 800, configurable: true });
    // Trichom-Block sitzt gerade oben im Bild (rel = 0), Umgebung darüber
    const setzen = () => {
      [...el.querySelectorAll('[data-sect]')].forEach(x => {
        const s = x.getAttribute('data-sect');
        const rel = s === 'trichome' ? 0 : (s === 'umgebung' ? -300 : -600);
        x.getBoundingClientRect = () => ({ top: rel, bottom: rel + 200, left: 0, right: 400, width: 400, height: 200 });
      });
    };
    setzen(); window._setzen = setzen;
    el.scrollTop = 1200;
  })()`);
  ev(`entryNav(1)`);
  await new Promise(x => setTimeout(x, 120));
  const nach = JSON.parse(ev(`(function(){
    const el = document.getElementById('entry-body'); const f = [];
    const hatTrich = !!el.querySelector('[data-sect="trichome"]');
    return JSON.stringify({ tag: editISO, scroll: el.scrollTop, trichDa: hatTrich, fehler: f });
  })()`));
  out.nachNav = nach;
  if (!nach.trichDa) fehler.push('Trichom-Block am nächsten Tag nicht vorhanden');
  // Der Anker wurde gefunden: scrollTop bleibt bei 1200, weil der Block wieder bei rel 0 liegt
  if (nach.scroll !== 1200) fehler.push('Scrollposition nicht am Block ausgerichtet (' + nach.scroll + ')');

  // Ohne passenden Block fällt es auf den Pixelwert zurück, ohne zu springen
  ev(`(function(){
    const el = document.getElementById('entry-body');
    el.getBoundingClientRect = () => ({ top: 0, bottom: 800, left: 0, right: 400, width: 400, height: 800 });
    Object.defineProperty(el, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 800, configurable: true });
    [...el.querySelectorAll('[data-sect]')].forEach(x => { x.getBoundingClientRect = () => ({ top: -900, bottom: -700 }); });
    el.scrollTop = 900;
  })()`);
  ev(`entryNav(1)`);
  await new Promise(x => setTimeout(x, 120));
  out.ohneAnker = ev(`document.getElementById('entry-body').scrollTop`);
  if (out.ohneAnker > 2200 || out.ohneAnker < 0) fehler.push('Rückfall auf den Pixelwert springt (' + out.ohneAnker + ')');

  Object.entries(out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(fehler.length ? 'FAIL\n  ' + fehler.join('\n  ') : 'OK navscroll');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(fehler.length ? 1 : 0);
})();

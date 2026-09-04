const { loadApp } = require('./harness');
(async () => {
  const { window, errors } = await loadApp();
  const ev = (src) => window.eval(src);
  const fail = [];
  if (errors.length) fail.push('jsdom-Errors: ' + errors.join(' | '));
  const ver = ev('typeof APP_VERSION!=="undefined" ? APP_VERSION : null');
  const nProb = ev('typeof PROBLEMS!=="undefined" ? PROBLEMS.length : -1');
  const nProd = ev('typeof FERT_PRESETS!=="undefined" ? (FERT_PRESETS.sensi_amnesia_auto.products||[]).length : -1');
  for (const fn of ['fertPlanWeek','contextFor','_localISO','isoPlus','isoDiff','customConfirm','calcVPD','analyzeRunoff','planWeekBounds','_planWeekQuestion'])
    if (typeof window[fn] !== 'function') fail.push(fn + ' fehlt');
  if (!ver) fail.push('APP_VERSION nicht lesbar');
  if (nProb < 1) fail.push('PROBLEMS leer');
  if (nProd < 1) fail.push('Preset ohne Produkte');
  console.log('Version:', ver, '| PROBLEMS:', nProb, '| Preset-Produkte:', nProd);
  console.log(fail.length ? 'FAIL\n' + fail.join('\n') : 'OK startup');
  process.exit(fail.length ? 1 : 0);
})();

const { loadApp } = require('./harness');
async function boot(debugDate, extra) {
  const { window, errors } = await loadApp();
  if (errors.length) throw new Error('jsdom-Init: ' + errors.join(' | '));
  const runtime = [];
  window.addEventListener('error', e => runtime.push(String(e.message || e)));
  const ev = (src) => window.eval(src);
  ev(`S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null; setDebugDate(${JSON.stringify(debugDate)});`);
  ev(`loadPreset('sensi_amnesia_auto');`);
  await new Promise(r => setTimeout(r, 20));
  ev(`_modalResolve && _modalResolve(true);`);
  await new Promise(r => setTimeout(r, 40));
  ev(`
    const _plan = S.fertPlans[0];
    const c = addCyc({ name:'Amnesia XXL', seedType:'auto', strain:'Sensi Amnesia XXL Auto', medium:'erde' });
    c.fertPlanId = _plan ? _plan.id : null;
    c.startDate = isoPlus(todayISO(), -84);
    c.anzuchtDays = 28; c.bloomDays = 77; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7;
    c.plants = 5; c.potSize = 11; c.weightMode = 'lift';
    S.beginnerMode = true;
    saveS();
  ` + (extra || ''));
  return { window, runtime, ev };
}
module.exports = { boot };

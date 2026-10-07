// Der Tageseintrag verliert keine Eingaben (Neubau-Prüfung 07.10.2026, Anfänger- und Profi-Prüfer, gemessen in Chromium).
//
//   A (v1.5.347)  Temperatur und Luftfeuchte überleben jedes Neuzeichnen (Hebe-Test, Mischhäkchen, ±-Knöpfe …).
//   B (v1.5.348)  Nach der Gießmenge geht der nächste Tipp nicht verloren (das pH-Feld bleibt im Fokus).
//   C (v1.5.349)  Die Gießmenge löscht den Hebe-Test von vor dem Guss nicht (außer „Voll" = gerade gegossen).
//   D (v1.5.350)  Das pH-Feld zeigt beim Antippen keinen Zielwert, der nie gespeichert wird.
//   E (v1.5.351)  Leer speichern meldet nicht „Gespeichert".
//   F (v1.5.352)  Die Kopfzeile passt aufs Handy (Titel ohne Jahr, darf umbrechen; ↩/↪ unter 370 px nur auf der Startseite).
//   G (v1.5.353)  „Tag automatisch ausfüllen" schreibt Vorschläge, keine Messungen; der Ø-pH der Startseite zählt sie nicht.
//   H (v1.5.357/358)  Trichom-Felder leer statt vorbelegt, Milchig ist der Rest, kein verlorener Tipp; „Ziel erreicht" nur mit Klar ≤ 10 %.
//   I (v1.5.359/360)  Startseite nennt Dünger mit Name und Menge; „Erledigt" bucht ihn am Düngertag als Vorschlag.
//   J (v1.5.361)  Diagnose: gelbe untere Blätter in der späten Blüte zuerst als natürliche Reife.
//   K (v1.5.362)  Einstellungen: „Damit ergibt sich" rechnet beim Tippen mit — derselbe Erntetag wie nach „Sichern".
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, rect: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop, quadraticCurveTo: noop,
    bezierCurveTo: noop, measureText: () => ({ width: 0 }), createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}
async function starte() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  const toasts = [];
  w.toast = (t) => toasts.push(String(t));
  w.customConfirm = () => Promise.resolve(true);
  return { w, errors, toasts, E: (s) => w.eval(s) };
}
const tippe = (w, id, wert) => { const el = w.document.getElementById(id); if (!el) return false; el.value = wert; el.dispatchEvent(new w.Event('input', { bubbles: true })); return true; };

(async () => {
  const fehler = [];
  const pruefe = (ok, text) => { if (!ok) fehler.push(text); };
  let n = 0;
  const a = await starte();
  a.E(`S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null;
    S._disclaimerAcceptedAt = Date.now(); S._welcomeSeen = true; S._modeAsked = true; S._seedlingProtocolShown = true;
    const pid = _planFuerVorlage('biobizz_light');
    addCyc({ name: 'Prüfzyklus', startDate: isoPlus(todayISO(), -58), seedType: 'auto', growType: 'indoor', medium: 'erde',
      potSize: 11, plantCount: 2, startMethod: 'direct', fertPlanId: pid }, { still: true });
    saveS(); goTo('entry'); openEntry(todayISO());`);
  await new Promise((r) => setTimeout(r, 60));

  // A · Temperatur und Luftfeuchte überleben das Neuzeichnen
  n++; pruefe(tippe(a.w, 'et', '24.5') && tippe(a.w, 'er', '45'), 'A0 Klimafelder fehlen im Eintrag');
  // Ein Tipp, der neu zeichnet — so wie Hebe-Test, Mischhäkchen und ±-Knöpfe es tun.
  const hebe = a.w.document.querySelector('[onclick*="setLiftFeel"]');
  if (hebe) hebe.click(); else a.E(`renderEntry(editISO)`);
  await new Promise((r) => setTimeout(r, 40));
  a.E(`renderEntry(editISO)`);
  const t = a.w.document.getElementById('et'), h = a.w.document.getElementById('er');
  n++; pruefe(t && t.value === '24.5', `A1 Temperatur nach dem Neuzeichnen weg („${t && t.value}")`);
  n++; pruefe(h && h.value === '45', `A2 Luftfeuchte nach dem Neuzeichnen weg („${h && h.value}")`);
  n++; pruefe(a.E(`(S.entries[editISO] || {}).temp`) === '24.5' && a.E(`(S.entries[editISO] || {}).humidity`) === '45', 'A3 Klima steht nicht im Zustand');
  // Verwerfen stellt den Stand beim Öffnen wieder her
  a.E(`_restoreEntrySnapshot()`);
  n++; pruefe(!a.E(`S.entries[todayISO()] && S.entries[todayISO()].temp`), 'A4 „Verwerfen" lässt die Temperatur stehen');

  // B · Nach der Gießmenge geht der nächste Tipp nicht verloren — am Gießtag (gestern, Tag 58) und an einem Tag ohne Guss (heute)
  for (const [name, tagNr] of [['Gießtag', 57], ['ohne Guss', 58]]) {
    a.E(`openEntry(isoPlus(S.cycles[0].startDate, ${tagNr})); renderEntry(editISO);`);
    await new Promise((r) => setTimeout(r, 40));
    const d = a.w.document;
    const menge = d.querySelector('#entry-body input[onchange*="_entryNeuNachFeld"], #entry-body input[onchange*="_rerenderEntryKeepScroll"]');
    const ph = d.querySelector(`#entry-body input[oninput*="'ph',this.value"]`);
    n++; pruefe(menge && ph, `B0 ${name}: Gießmenge oder pH-Feld fehlt`);
    if (!menge || !ph) continue;
    menge.focus(); menge.value = '3000'; menge.dispatchEvent(new a.w.Event('input', { bubbles: true }));
    // So wie im Browser: Der Finger landet auf dem pH-Feld, das Mengenfeld meldet „change", dann kommt der Klick.
    menge.dispatchEvent(new a.w.Event('change', { bubbles: true }));
    ph.focus();
    ph.dispatchEvent(new a.w.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 30));
    n++; pruefe(ph.isConnected && d.activeElement === ph, `B1 ${name}: Nach der Gießmenge ist das pH-Feld nicht mehr im Fokus (ersetzt: ${!ph.isConnected})`);
    ph.value = '6.3'; ph.dispatchEvent(new a.w.Event('input', { bubbles: true }));
    const cid = a.E(`S.cycles[0].id`);
    n++; pruefe(a.E(`String(((S.entries[editISO]||{}).cycleData||{})['${cid}'] ? S.entries[editISO].cycleData['${cid}'].ph : '')`) === '6.3', `B2 ${name}: pH 6,3 kam nicht an`);
    // Verlässt man die Felder, zeichnet der Eintrag einmal neu — mit beiden Werten
    const vor = a.E("typeof _entryRenderNr === 'number' ? _entryRenderNr : -1");
    ph.blur();
    // 400 ms Wartezeit der App plus Luft — unter Last laufen Zeitgeber später
    await new Promise((r) => setTimeout(r, 1200));
    n++; pruefe(a.E("typeof _entryRenderNr === 'number' ? _entryRenderNr : -1") > vor, `B3 ${name}: Nach dem Verlassen der Felder wurde nicht neu gezeichnet`);
    const ph2 = d.querySelector(`#entry-body input[oninput*="'ph',this.value"]`);
    n++; pruefe(ph2 && ph2.value === '6.3', `B4 ${name}: pH nach dem Neuzeichnen „${ph2 && ph2.value}"`);
  }

  // C · Die Gießmenge löscht den Hebe-Test von vorher nicht (am Gießtag, Tag 58)
  {
    const cid = a.E(`S.cycles[0].id`);
    a.E(`delete S.entries[isoPlus(S.cycles[0].startDate, 57)]; openEntry(isoPlus(S.cycles[0].startDate, 57)); renderEntry(editISO);`);
    await new Promise((r) => setTimeout(r, 30));
    a.E(`setLiftFeel('${cid}', 'low')`);
    const vorschlagVor = a.E(`(function(){ const c = S.cycles[0]; const g = gussMengeJePflanze(c, phase(editISO, c), editISO); return g ? g.m : null; })()`);
    a.E(`uEFWater('${cid}', '3000', 2)`);
    const cd = JSON.parse(a.E(`JSON.stringify(S.entries[editISO].cycleData['${cid}'])`));
    n++; pruefe(cd.restPct === 30 || cd.restPct === '30', `C1 Hebe-Test „Knapp" nach der Gießmenge weg (restPct ${cd.restPct})`);
    n++; pruefe(String(cd.liftAfterPct) === '100', `C2 Nachher-Wert nicht 100 (${cd.liftAfterPct})`);
    const vorschlagNach = a.E(`(function(){ const c = S.cycles[0]; const g = gussMengeJePflanze(c, phase(editISO, c), editISO); return g ? g.m : null; })()`);
    n++; pruefe(vorschlagNach === vorschlagVor, `C3 Vorschlag springt nach dem Eintippen der Menge (${vorschlagVor} → ${vorschlagNach} ml je Pflanze)`);
    a.E(`renderEntry(editISO)`);
    const txt = a.w.document.getElementById('entry-body').textContent;
    n++; pruefe(/Vor dem Guss: Knapp/.test(txt), 'C4 Eintrag sagt nicht, dass der Hebe-Test von vor dem Guss ist');
    n++; pruefe(!/Heute gießen — geplanter Gieß-Tag/.test(txt), 'C5 Nach dem Guss steht weiter „Heute gießen"');
    // „Voll" am Gießtag heißt „gerade gegossen" und weicht wie bisher
    a.E(`delete S.entries[editISO]; openEntry(editISO); renderEntry(editISO); setLiftFeel('${cid}', 'full'); uEFWater('${cid}', '3000', 2);`);
    const cd2 = JSON.parse(a.E(`JSON.stringify(S.entries[editISO].cycleData['${cid}'])`));
    n++; pruefe(cd2.restPct === undefined, `C6 „Voll" bleibt als Wert vor dem Guss stehen (${cd2.restPct}) — das würde die Topf-Kapazität verfälschen`);
  }

  // D · Das pH-Feld füllt sich beim Antippen nicht mit einem Zielwert, der nie gespeichert wird
  {
    const cid = a.E(`S.cycles[0].id`);
    a.E(`delete S.entries[isoPlus(S.cycles[0].startDate, 57)]; openEntry(isoPlus(S.cycles[0].startDate, 57)); renderEntry(editISO);`);
    const ph = a.w.document.querySelector(`#entry-body input[oninput*="'ph',this.value"]`);
    if (ph) { ph.focus(); ph.dispatchEvent(new a.w.FocusEvent('focus')); }
    const gesp = a.E(`String((((S.entries[editISO]||{}).cycleData||{})['${cid}']||{}).ph || '')`);
    n++; pruefe(ph && (ph.value === '' || ph.value === gesp), `D1 pH-Feld zeigt „${ph && ph.value}", gespeichert ist „${gesp}"`);
  }

  // E · Leer speichern meldet nicht „Gespeichert" und legt kein leeres Gerüst ab
  {
    a.E(`delete S.entries[isoPlus(S.cycles[0].startDate, 50)]; openEntry(isoPlus(S.cycles[0].startDate, 50)); renderEntry(editISO);`);
    a.toasts.length = 0;
    a.E(`saveEntry()`);
    await new Promise((r) => setTimeout(r, 20));
    n++; pruefe(!a.toasts.some((t) => /Gespeichert/.test(t)), `E1 Leerer Eintrag meldet „Gespeichert" (${a.toasts.join(' | ')})`);
    n++; pruefe(a.toasts.some((t) => /Noch nichts eingetragen/.test(t)), 'E2 Leerer Eintrag sagt nicht, dass nichts drinsteht');
    n++; pruefe(a.E(`S.entries[editISO] === undefined`), 'E3 Leeres Gerüst wurde gespeichert');
    // Mit einem echten Wert wird gespeichert wie bisher
    tippe(a.w, 'et', '23');
    a.toasts.length = 0;
    a.E(`saveEntry()`);
    await new Promise((r) => setTimeout(r, 20));
    n++; pruefe(a.toasts.some((t) => /Gespeichert/.test(t)) && a.E(`(S.entries[editISO]||{}).temp`) === '23', `E4 Eintrag mit Temperatur nicht gespeichert (${a.toasts.join(' | ')})`);
  }

  // F · Die Kopfzeile passt aufs Handy (gemessen in Chromium: 390 und 320 px; hier nur Text und Regeln, jsdom kennt kein Layout)
  {
    a.E(`openEntry(todayISO())`);
    const titel = a.w.document.getElementById('entry-ttl').textContent;
    n++; pruefe(!/\b20\d\d\b/.test(titel) && /^(Mo|Di|Mi|Do|Fr|Sa|So)/.test(titel), `F1 Titel „${titel}" — erwartet Wochentag, ohne Jahr`);
    const ttl = a.w.document.getElementById('entry-ttl');
    n++; pruefe(ttl && /min-width:\s*0/.test(ttl.getAttribute('style') || ''), 'F2 Titel darf nicht schrumpfen (min-width fehlt) — dann schiebt er „Speichern" aus dem Bild');
    n++; pruefe(/#entry-undo\s*\{\s*display:\s*none/.test(HTML), 'F3 Regel für sehr schmale Handys fehlt');
  }

  // G · „Tag automatisch ausfüllen" schreibt Vorschläge, keine Messungen
  {
    const cid = a.E(`S.cycles[0].id`);
    // Alle Einträge weg, damit nur der ausgefüllte Tag zählt
    a.E(`S.entries = {}; openEntry(isoPlus(S.cycles[0].startDate, 57)); renderEntry(editISO);`);
    await a.E(`(async function(){ const c = S.cycles[0]; await applyRecommended(c.id, fertPlanWeek(c, editISO, phase(editISO, c))); })()`);
    await new Promise((r) => setTimeout(r, 30));
    const cd = JSON.parse(a.E(`JSON.stringify(S.entries[editISO].cycleData['${cid}'])`));
    const sug = cd._suggested || {};
    n++; pruefe(!cd.ph || sug.ph === true, `G1 pH ${cd.ph} ohne Vorschlag-Kennzeichen eingetragen`);
    n++; pruefe(!cd.ec || sug.ec === true, `G2 EC ${cd.ec} ohne Vorschlag-Kennzeichen eingetragen`);
    n++; pruefe(!cd.water || sug.water === true, `G3 Gießmenge ${cd.water} ohne Vorschlag-Kennzeichen eingetragen`);
    const dosen = Object.keys(cd.doses || {}).filter((k) => parseFloat(cd.doses[k]) > 0);
    n++; pruefe(dosen.every((k) => cd._suggestedDoses && cd._suggestedDoses[k]), 'G4 Plan-Dosen ohne Vorschlag-Kennzeichen');
    n++; pruefe(!!(cd.ph || cd.water), 'G0 Ausfüllen hat nichts eingetragen (Testfall greift nicht)');
    a.E(`S.beginnerMode = false; saveS(); goTo('dash'); renderDash();`);
    const kachel = [...a.w.document.querySelectorAll('.stat-box')].find((el) => /Ø pH/.test(el.textContent));
    n++; pruefe(!kachel || /—/.test(kachel.textContent), `G5 Startseite zeigt einen Ø-pH aus einem Vorschlag („${kachel && kachel.textContent.trim()}")`);
    // Wer den Wert antippt und ändert, macht daraus eine Messung
    a.E(`openEntry(isoPlus(S.cycles[0].startDate, 57)); uEF('${cid}', 'ph', '6.3');`);
    n++; pruefe(!a.E(`!!(S.entries[editISO].cycleData['${cid}']._suggested||{}).ph`), 'G6 Eigener pH bleibt als Vorschlag markiert');
  }

  // H · Trichom-Felder (v1.5.358) und Trichom-Aussage (v1.5.357) — eigener Zyklus in Blüte-Woche 8
  {
    a.E(`const pid2 = _planFuerVorlage('biobizz_light');
      addCyc({ name: 'Reifezyklus', startDate: isoPlus(todayISO(), -75), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 2, startMethod: 'direct', fertPlanId: pid2 }, { still: true }); saveS();`);
    const c2 = a.E(`S.cycles[S.cycles.length - 1].id`);
    a.E(`S.entries = {}; openEntry(todayISO()); renderEntry(editISO);`);
    const d = a.w.document;
    const klar = d.getElementById(`trich-in-${c2}-clear`), bern = d.getElementById(`trich-in-${c2}-amber`), milch = d.getElementById(`trich-in-${c2}-milky`);
    n++; pruefe(klar && bern && milch, 'H0 Trichom-Felder fehlen (Ids)');
    if (klar && bern && milch) {
      n++; pruefe(klar.value === '' && klar.placeholder !== '', `H1 Klar ist vorbelegt („${klar.value}") statt leer mit grauem Stand`);
      n++; pruefe(/select\(\)/.test(klar.getAttribute('onfocus') || '') && /select\(\)/.test(bern.getAttribute('onfocus') || ''), 'H2 Feldinhalt wird beim Antippen nicht markiert');
      n++; pruefe(milch.readOnly, 'H3 Milchig ist eintippbar statt Rest');
      klar.focus(); klar.value = '20'; klar.dispatchEvent(new a.w.Event('change', { bubbles: true }));
      bern.focus(); bern.dispatchEvent(new a.w.MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 30));
      n++; pruefe(bern.isConnected && d.activeElement === bern, 'H4 Nach Klar ging der Tipp auf Bernstein verloren');
      bern.value = '10'; bern.dispatchEvent(new a.w.Event('change', { bubbles: true }));
      const t = JSON.parse(a.E(`JSON.stringify(S.entries[editISO].cycleData['${c2}'].trichomes)`));
      n++; pruefe(t.clear === 20 && t.amber === 10 && t.milky === 70, `H5 Klar 20 + Bernstein 10 ergab ${t.clear}/${t.milky}/${t.amber}`);
      n++; pruefe(milch.value.replace(',', '.') === '70', `H6 Milchig zeigt „${milch.value}" statt 70`);
    }
    // Aussage: Bernstein-Ziel erreicht, aber noch zu viel klar
    a.E(`(function(){ const c = S.cycles.find(x => x.id === '${c2}');
      S.entries[isoPlus(todayISO(), -4)] = { cycleData: { [c.id]: { trichomes: { clear: 30, milky: 66, amber: 4 } } } };
      if (!S.entries[todayISO()]) S.entries[todayISO()] = { cycleData: {} };
      if (!S.entries[todayISO()].cycleData[c.id]) S.entries[todayISO()].cycleData[c.id] = {};
      S.entries[todayISO()].cycleData[c.id].trichomes = { clear: 15, milky: 75, amber: 10, aMan: true };
      saveS(); renderEntry(editISO); })()`);
    const kt = (d.getElementById(`trich-${c2}`) || {}).textContent || '';
    n++; pruefe(/Fast bereit — noch 15 % klar/.test(kt), `H7 „Fast bereit" nennt nicht, warum (${kt.slice(0, 80)}…)`);
    n++; pruefe(!/Ziel erreicht —/.test(kt) || /aber noch 15 % klar/.test(kt), 'H8 „Ziel erreicht" bei 15 % klar, ohne zu sagen, dass noch nicht geschnitten wird');
  }

  // I · Startseite: Dünger mit Namen und Mengen (v1.5.359); „Erledigt" bucht ihn als Vorschlag (v1.5.360)
  {
    const cid = a.E(`S.cycles[0].id`);
    // Nächster Düngertag und nächster Wasser-Tag des Prüfzyklus
    const tage = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; let feed = null, wasser = null;
      for (let i = 0; i < 40 && !(feed && wasser); i++) { const iso = isoPlus(todayISO(), i); const a = getAction(iso, c);
        if (a !== 'giess') continue; const t = getFeedWaterEffective(c, phase(iso, c), iso, null);
        if (t === 'water' && !wasser) wasser = iso; else if (t !== 'water' && !feed) feed = iso; }
      return JSON.stringify({ feed, wasser }); })()`));
    n++; pruefe(!!tage.feed, 'I0 Kein Düngertag gefunden (Testfall greift nicht)');
    if (tage.feed) {
      a.E(`S.entries = {}; setDebugDate('${tage.feed}'); S.beginnerMode = false; goTo('dash'); renderDash();`);
      const txt = a.w.document.getElementById('scr-dash').textContent;
      n++; pruefe(!/Produkte \(siehe Eintrag\)/.test(txt), 'I1 Startseite nennt weiter nur die Zahl der Produkte');
      n++; pruefe(/Dünger Wo\. \d+ für [\d,]+ L: [^·]+ \d+(,\d)? (ml|g)/.test(txt), 'I2 Startseite nennt Dünger nicht mit Name und Menge');
      a.E(`markTodayDone('${cid}', '${tage.feed}')`);
      const cd = JSON.parse(a.E(`JSON.stringify(S.entries['${tage.feed}'].cycleData['${cid}'])`));
      const gegeben = Object.keys(cd.doses || {}).filter((k) => parseFloat(cd.doses[k]) > 0);
      n++; pruefe(gegeben.length > 0, 'I3 „Erledigt" am Düngertag bucht keinen Dünger');
      n++; pruefe(gegeben.every((k) => cd._suggestedDoses && cd._suggestedDoses[k]), 'I4 Dünger aus „Erledigt" nicht als Vorschlag gekennzeichnet');
    }
    if (tage.wasser) {
      a.E(`setDebugDate('${tage.wasser}'); markTodayDone('${cid}', '${tage.wasser}')`);
      const cdW = JSON.parse(a.E(`JSON.stringify(S.entries['${tage.wasser}'].cycleData['${cid}'])`));
      n++; pruefe(!Object.values(cdW.doses || {}).some((v) => parseFloat(v) > 0), 'I5 „Erledigt" am Wasser-Tag bucht Dünger');
    }
    a.E(`setDebugDate(null)`);
  }

  // J · Diagnose (v1.5.361): gelbe untere Blätter in der späten Blüte zuerst als natürliche Reife
  {
    const erg = JSON.parse(a.E(`(function(){ const c = S.cycles.find(x => x.name === 'Reifezyklus');
      const ctx = buildDiagnosticContext(c, todayISO());
      const r = diagnoseProblems({ location: ['oldLeaves'], colors: ['yellow'], shapes: [] }, ctx);
      return JSON.stringify({ stufe: bluetestufe(phase(todayISO(), c)), spaet: !!ctx.spaetbluete, ids: r.map(x => x.problem.id) }); })()`));
    n++; pruefe(erg.stufe === 'spaet' && erg.spaet, `J0 Testfall nicht in der späten Blüte (${erg.stufe})`);
    n++; pruefe(erg.ids[0] === 'normal_autumn_colors', `J1 Rang 1 in der späten Blüte: ${erg.ids[0]} (Reihenfolge ${erg.ids.join(', ')})`);
    const nText = a.E(`PROBLEMS.find(p => p.id === 'n_deficiency').action`);
    n++; pruefe(!/^Stickstoff erhöhen/.test(nText) && /natürliche Reife/.test(nText), 'J2 Stickstoff-Mangel rät ohne Unterscheidung zu „Stickstoff erhöhen"');
  }

  // K · Einstellungen (v1.5.362): „Damit ergibt sich" rechnet beim Tippen mit und zeigt, was „Sichern" ablegen wird
  {
    a.E(`S.beginnerMode = false; S.entries = {}; if (!S._setUI) S._setUI = {}; S._setUI.cyc_timing = true; S._setUI.durManual = true; const c = S.cycles[0]; selId = c.id; draft = { ...c }; draftTouched = {}; goTo('set'); renderSet();`);
    const vor = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; const e = endspurtState(c, todayISO()); return JSON.stringify({ bloom: c.bloomDays, ernte: e.ernteTag }); })()`));
    const txt0 = (a.w.document.getElementById('cyc-ketten-vorschau') || {}).textContent || '';
    n++; pruefe(/Damit ergibt sich/.test(txt0), 'K0 Vorschau „Damit ergibt sich" fehlt');
    a.E(`dd('bloomDays', ${vor.bloom + 7})`);
    const txt1 = (a.w.document.getElementById('cyc-ketten-vorschau') || {}).textContent || '';
    n++; pruefe(/noch nicht gesichert/.test(txt1) && /bisher Tag/.test(txt1), `K1 Vorschau zieht beim Tippen nicht nach („${txt1.slice(0, 90)}…")`);
    n++; pruefe(a.E(`S.cycles[0].bloomDays`) === vor.bloom, 'K2 Die Vorschau hat den Zyklus verändert');
    const ernteVorschau = Number((txt1.match(/Ernte Tag (\d+)/) || [])[1]);
    await a.E(`(async function(){ await saveDraft(); })()`);
    const nach = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; return JSON.stringify({ ernte: endspurtState(c, todayISO()).ernteTag }); })()`));
    n++; pruefe(ernteVorschau === nach.ernte, `K3 Vorschau nannte Ernte Tag ${ernteVorschau}, gesichert ist Tag ${nach.ernte}`);
  }

  n++; pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_eintragdaten: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_eintragdaten: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_eintragdaten abgebrochen:', (e && e.stack) || e); process.exit(1); });

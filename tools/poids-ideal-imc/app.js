const IMCCalculator = (() => {
  'use strict';
  const els = {};
  const CATEGORIES = [
    { min: 0, max: 18.5, color: '#3182CE', label: 'Insuffisance', cls: 'cat-under' },
    { min: 18.5, max: 25, color: '#2F855A', label: 'Normal', cls: 'cat-normal' },
    { min: 25, max: 30, color: '#D69E2E', label: 'Surpoids', cls: 'cat-over' },
    { min: 30, max: 35, color: '#DD6B20', label: 'Obésité I', cls: 'cat-ob1' },
    { min: 35, max: 40, color: '#E53E3E', label: 'Obésité II', cls: 'cat-ob2' },
    { min: 40, max: 50, color: '#9B2C2C', label: 'Obésité III', cls: 'cat-ob3' }
  ];
  const CFG = { min: 0, max: 50, start: -135, end: 135, cx: 140, cy: 140, rOut: 110, rIn: 75 };

  function init() {
    els.sexe = document.getElementById('sexe');
    els.taille = document.getElementById('taille');
    els.poids = document.getElementById('poids');
    els.btnCalc = document.getElementById('calculer');
    els.results = document.getElementById('results');
    els.imcVal = document.getElementById('imc-value');
    els.category = document.getElementById('category');
    els.idealWeight = document.getElementById('ideal-weight');
    els.diff = document.getElementById('weight-difference');
    els.note = document.getElementById('note-explicative');
    els.gaugeVal = document.getElementById('gauge-value');
    els.needle = document.getElementById('gauge-needle');
    els.scale = document.getElementById('gauge-scale');
    els.legend = document.getElementById('legend-container');
    els.resetBtn = document.getElementById('resetBtn');

    if (!els.sexe) return;
    createGauge();
    setNeedle(0);
    els.btnCalc.addEventListener('click', calculate);
    els.resetBtn.addEventListener('click', reset);
    window.addEventListener('resize', () => { clearTimeout(window._rto); window._rto = setTimeout(createGauge, 150); });
  }

  function calculate() {
    const sexe = els.sexe.value;
    const taille = parseNum(els.taille.value);
    const poids = parseNum(els.poids.value);
    if (!validate(taille, poids)) return;

    const imc = poids / ((taille/100)**2);
    const ideal = sexe === 'homme' ? taille - 100 - ((taille-150)/4) : taille - 100 - ((taille-150)/2.5);
    const cat = CATEGORIES.find(c => imc >= c.min && imc < c.max) || CATEGORIES[5];
    const diffVal = Math.abs(poids - ideal);
    const diffRounded = Math.round(diffVal * 10) / 10;

    let diffText = '', diffStyle = '';
    if (diffRounded < 0.1) { diffText = 'Poids idéal atteint ! 🎯'; diffStyle = 'background:#e8f5e8;color:#2e7d32;border-left:4px solid #4caf50;'; }
    else if (poids > ideal) { diffText = `Excès de : ${diffRounded} kg`; diffStyle = 'background:#ffebee;color:#d32f2f;border-left:4px solid #f44336;'; }
    else { diffText = `Déficit de : ${diffRounded} kg`; diffStyle = 'background:#e3f2fd;color:#1976d2;border-left:4px solid #2196f3;'; }

    els.imcVal.textContent = (Math.round(imc*10)/10).toFixed(1);
    els.category.textContent = cat.label;
    els.category.className = 'result-value ' + cat.cls;
    els.idealWeight.textContent = (Math.round(ideal*10)/10) + ' kg';
    els.diff.innerHTML = diffText;
    els.diff.style.cssText = diffStyle + 'margin-top:10px;padding:10px;border-radius:6px;font-weight:500;text-align:center;';
    els.note.hidden = false;
    els.gaugeVal.textContent = els.imcVal.textContent;
    els.results.hidden = false;
    setNeedle(0);
    setTimeout(() => setNeedle(Math.min(50, Math.max(0, imc))), 50);
  }

  function reset() {
    els.taille.value = ''; els.poids.value = ''; els.sexe.value = 'femme';
    els.results.hidden = true; els.note.hidden = true;
    setNeedle(0); els.gaugeVal.textContent = '--';
    els.category.textContent = '--'; els.category.className = 'result-value';
    els.idealWeight.textContent = '--'; els.diff.innerHTML = ''; els.diff.style.cssText = '';
  }

  function parseNum(v) { return parseFloat(String(v).trim().replace(',', '.')); }
  function validate(t, p) {
    if (isNaN(t) || isNaN(p)) { alert('Valeurs invalides.'); return false; }
    if (t<50||t>250||p<10||p>300) { alert('Valeurs hors limites (Taille: 50-250cm, Poids: 10-300kg).'); return false; }
    return true;
  }

  function setNeedle(imc) {
    const angle = CFG.start + ((imc - CFG.min) / (CFG.max - CFG.min)) * (CFG.end - CFG.start);
    els.needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }

  function createGauge() {
    if (!els.scale || !els.legend) return;
    els.scale.innerHTML = ''; els.legend.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 280 280');
    svg.style.width = '100%'; svg.style.height = '100%';
    const toRad = d => d * Math.PI / 180;
    const angleFor = v => CFG.start + ((v - CFG.min) / (CFG.max - CFG.min)) * (CFG.end - CFG.start);

    CATEGORIES.forEach(cat => {
      const a1 = angleFor(cat.min), a2 = angleFor(cat.max);
      const p = (r, a) => ({ x: CFG.cx + r * Math.cos(toRad(a)), y: CFG.cy + r * Math.sin(toRad(a)) });
      const pts = [p(CFG.rIn, a1), p(CFG.rOut, a1), p(CFG.rOut, a2), p(CFG.rIn, a2)];
      const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y} A${CFG.rOut} ${CFG.rOut} 0 ${large} 1 ${pts[2].x} ${pts[2].y} L${pts[3].x} ${pts[3].y} A${CFG.rIn} ${CFG.rIn} 0 ${large} 0 ${pts[0].x} ${pts[0].y}`);
      path.setAttribute('fill', cat.color);
      svg.appendChild(path);

      const mid = (a1 + a2) / 2;
      const lbl = document.createElement('div');
      lbl.className = 'legend-label';
      lbl.textContent = cat.label;
      const lr = CFG.rOut + 12;
      lbl.style.left = (CFG.cx + lr * Math.cos(toRad(mid))) + 'px';
      lbl.style.top = (CFG.cy + lr * Math.sin(toRad(mid))) + 'px';
      lbl.style.transform = (mid > 90 || mid < -90) ? 'translate(-100%, -50%)' : 'translate(0, -50%)';
      lbl.style.textAlign = (mid > 90 || mid < -90) ? 'right' : 'left';
      els.legend.appendChild(lbl);
    });

    // Ticks
    [0,10,20,30,40,50].forEach(v => {
      const a = angleFor(v);
      const r1 = CFG.rOut, r2 = CFG.rOut - 14;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', CFG.cx + r1*Math.cos(toRad(a))); line.setAttribute('y1', CFG.cy + r1*Math.sin(toRad(a)));
      line.setAttribute('x2', CFG.cx + r2*Math.cos(toRad(a))); line.setAttribute('y2', CFG.cy + r2*Math.sin(toRad(a)));
      line.setAttribute('stroke', '#000'); line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', CFG.cx + (r2-12)*Math.cos(toRad(a)));
      txt.setAttribute('y', CFG.cy + (r2-12)*Math.sin(toRad(a)));
      txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('dominant-baseline', 'middle');
      txt.setAttribute('font-size', '11'); txt.setAttribute('font-weight', '600');
      txt.setAttribute('fill', '#000'); txt.setAttribute('paint-order', 'stroke');
      txt.setAttribute('stroke', '#fff'); txt.setAttribute('stroke-width', '2');
      txt.textContent = v;
      svg.appendChild(txt);
    });
    els.scale.appendChild(svg);
  }

  document.addEventListener('DOMContentLoaded', init);
})();

/**
 * Poids idéal et IMC - Version professionnelle
 * Logique : Formule de Lorentz + Catégories OMS
 * Architecture modulaire - 100% frontend
 */

const IMCCalculator = (() => {
  'use strict';

  // ===== ÉLÉMENTS DOM =====
  const elements = {
    sexe: null,
    taille: null,
    poids: null,
    btnCalculer: null,
    results: null,
    imcValue: null,
    category: null,
    idealWeight: null,
    weightDifference: null,
    noteExplicative: null,
    gaugeValue: null,
    gaugeNeedle: null,
    gaugeScale: null,
    legendContainer: null
  };

  // ===== CONSTANTES =====
  const GAUGE_CONFIG = {
    min: 0,
    max: 50,
    startAngle: -135,
    endAngle: 135,
    cx: 140,
    cy: 140,
    outerRadius: 110,
    innerRadius: 75
  };

  const CATEGORIES = [
    { min: 0, max: 18.5, color: '#1976d2', label: 'Insuffisance pondérale', class: 'underweight' },
    { min: 18.5, max: 25, color: '#4caf50', label: 'Poids normal', class: 'normal' },
    { min: 25, max: 30, color: '#ff9800', label: 'Surpoids', class: 'overweight' },
    { min: 30, max: 35, color: '#ff5722', label: 'Obésité I', class: 'obese1' },
    { min: 35, max: 40, color: '#f44336', label: 'Obésité II', class: 'obese2' },
    { min: 40, max: 50, color: '#b71c1c', label: 'Obésité III', class: 'obese3' }
  ];

  // ===== INITIALISATION =====
  function init() {
    cacheElements();
    if (!validateElements()) return;
    
    createGaugeScale();
    updateGaugeNeedle(0);
    bindEvents();
    
    // Redessiner gauge au redimensionnement
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(createGaugeScale, 150);
    });
  }

  function cacheElements() {
    elements.sexe = document.getElementById('sexe');
    elements.taille = document.getElementById('taille');
    elements.poids = document.getElementById('poids');
    elements.btnCalculer = document.getElementById('calculer');
    elements.results = document.getElementById('results');
    elements.imcValue = document.getElementById('imc-value');
    elements.category = document.getElementById('category');
    elements.idealWeight = document.getElementById('ideal-weight');
    elements.weightDifference = document.getElementById('weight-difference');
    elements.noteExplicative = document.getElementById('note-explicative');
    elements.gaugeValue = document.getElementById('gauge-value');
    elements.gaugeNeedle = document.getElementById('gauge-needle');
    elements.gaugeScale = document.getElementById('gauge-scale');
    elements.legendContainer = document.getElementById('legend-container');
  }

  function validateElements() {
    const missing = Object.entries(elements)
      .filter(([_, el]) => el === null)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      console.error('IMC Calculator: éléments manquants:', missing);
      return false;
    }
    return true;
  }

  // ===== ÉVÉNEMENTS =====
  function bindEvents() {
    elements.btnCalculer.addEventListener('click', handleCalculate);
  }

  function handleCalculate(e) {
    e.preventDefault();
    
    const sexe = elements.sexe.value;
    const taille = parseNumber(elements.taille.value);
    const poids = parseNumber(elements.poids.value);

    if (!validateInputs(taille, poids)) return;

    const imc = computeIMC(poids, taille);
    const poidsIdeal = computePoidsIdeal(sexe, taille);
    const category = getCategory(imc);
    const difference = computeDifference(poids, poidsIdeal);

    renderResults(imc, category, poidsIdeal, difference);
    animateGauge(imc);
  }

  // ===== UTILITAIRES =====
  function parseNumber(value) {
    return parseFloat(String(value).trim().replace(',', '.'));
  }

  function validateInputs(taille, poids) {
    if (isNaN(taille) || isNaN(poids)) {
      alert('Veuillez entrer des valeurs numériques valides.');
      return false;
    }
    if (taille < 50 || taille > 250) {
      alert('Taille invalide (50-250 cm).');
      return false;
    }
    if (poids < 10 || poids > 300) {
      alert('Poids invalide (10-300 kg).');
      return false;
    }
    return true;
  }

  // ===== LOGIQUE MÉDICALE =====
  function computeIMC(poids, tailleCm) {
    const tailleM = tailleCm / 100;
    return poids / (tailleM * tailleM);
  }

  function computePoidsIdeal(sexe, tailleCm) {
    // Formule de Lorentz
    const base = tailleCm - 100;
    const correction = sexe === 'homme' 
      ? (tailleCm - 150) / 4 
      : (tailleCm - 150) / 2.5;
    return Math.round((base - correction) * 10) / 10;
  }

  function getCategory(imc) {
    return CATEGORIES.find(cat => imc >= cat.min && imc < cat.max) 
      || CATEGORIES[CATEGORIES.length - 1];
  }

  function computeDifference(poids, poidsIdeal) {
    const diff = Math.abs(poids - poidsIdeal);
    const rounded = Math.round(diff * 10) / 10;
    
    if (rounded < 0.1) {
      return { text: 'Poids idéal atteint ! 🎯', type: 'ok' };
    } else if (poids > poidsIdeal) {
      return { text: `Excès de : ${rounded} kg`, type: 'exces' };
    } else {
      return { text: `Déficit de : ${rounded} kg`, type: 'deficit' };
    }
  }

  // ===== RENDU =====
  function renderResults(imc, category, poidsIdeal, difference) {
    const imcRounded = Math.round(imc * 10) / 10;
    
    elements.imcValue.textContent = imcRounded.toFixed(1);
    elements.category.textContent = category.label;
    elements.category.className = 'result-value category ' + category.class;
    elements.idealWeight.textContent = poidsIdeal + ' kg';
    
    // Différence de poids
    elements.weightDifference.innerHTML = difference.text;
    elements.weightDifference.style.cssText = getDifferenceStyle(difference.type);
    
    // Note explicative
    elements.noteExplicative.hidden = false;
    
    // Valeur gauge
    elements.gaugeValue.textContent = imcRounded.toFixed(1);
    
    // Afficher résultats
    elements.results.hidden = false;
  }

  function getDifferenceStyle(type) {
    const styles = {
      ok: 'background:#e8f5e8;color:#2e7d32;border-left:4px solid #4caf50;',
      exces: 'background:#ffebee;color:#d32f2f;border-left:4px solid #f44336;',
      deficit: 'background:#e3f2fd;color:#1976d2;border-left:4px solid #2196f3;'
    };
    return 'margin-top:10px;padding:10px;border-radius:5px;font-weight:500;text-align:center;' + (styles[type] || '');
  }

  // ===== GAUGE SVG =====
  function createGaugeScale() {
    if (!elements.gaugeScale || !elements.legendContainer) return;
    
    elements.gaugeScale.innerHTML = '';
    elements.legendContainer.innerHTML = '';

    const svg = createSVGElement();
    const { cx, cy, outerRadius, innerRadius } = GAUGE_CONFIG;
    const valueToAngle = val => angleForValue(val);

    // Segments colorés
    CATEGORIES.forEach(segment => {
      const startAngle = valueToAngle(segment.min);
      const endAngle = valueToAngle(segment.max);
      const path = createArcPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
      
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', path);
      pathEl.setAttribute('fill', segment.color);
      svg.appendChild(pathEl);

      // Légende
      const midAngle = (startAngle + endAngle) / 2;
      const label = createLegendLabel(segment.label, midAngle, cx, cy, outerRadius);
      elements.legendContainer.appendChild(label);
    });

    // Graduations
    addGaugeTicks(svg, cx, cy, outerRadius, valueToAngle);

    elements.gaugeScale.appendChild(svg);
  }

  function createSVGElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 280 280');
    return svg;
  }

  function createArcPath(cx, cy, rInner, rOuter, startAngle, endAngle) {
    const toRad = deg => deg * Math.PI / 180;
    const toPoint = (r, angle) => ({
      x: cx + r * Math.cos(toRad(angle)),
      y: cy + r * Math.sin(toRad(angle))
    });

    const p1 = toPoint(rInner, startAngle);
    const p2 = toPoint(rOuter, startAngle);
    const p3 = toPoint(rOuter, endAngle);
    const p4 = toPoint(rInner, endAngle);
    
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} 
            A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p3.x} ${p3.y} 
            L ${p4.x} ${p4.y} 
            A ${rInner} ${rInner} 0 ${largeArc} 0 ${p1.x} ${p1.y}`;
  }

  function createLegendLabel(text, angle, cx, cy, radius) {
    const toRad = deg => deg * Math.PI / 180;
    const labelRadius = radius + 12;
    const x = cx + labelRadius * Math.cos(toRad(angle));
    const y = cy + labelRadius * Math.sin(toRad(angle));
    
    const div = document.createElement('div');
    div.className = 'legend-label';
    div.textContent = text;
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    
    if (angle > 90 || angle < -90) {
      div.style.transform = 'translate(-100%, -50%)';
      div.style.textAlign = 'right';
    } else {
      div.style.transform = 'translate(0, -50%)';
      div.style.textAlign = 'left';
    }
    return div;
  }

  function addGaugeTicks(svg, cx, cy, outerRadius, valueToAngle) {
    const toRad = deg => deg * Math.PI / 180;
    
    // Graduations principales
    [0, 10, 20, 30, 40, 50].forEach(value => {
      const angle = valueToAngle(value);
      const rad = toRad(angle);
      
      // Ligne
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx + outerRadius * Math.cos(rad));
      line.setAttribute('y1', cy + outerRadius * Math.sin(rad));
      line.setAttribute('x2', cx + (outerRadius - 14) * Math.cos(rad));
      line.setAttribute('y2', cy + (outerRadius - 14) * Math.sin(rad));
      line.setAttribute('stroke', '#000');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
      
      // Texte
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', cx + outerRadius * Math.cos(rad));
      text.setAttribute('y', cy + outerRadius * Math.sin(rad));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#000');
      text.setAttribute('paint-order', 'stroke');
      text.setAttribute('stroke', '#fff');
      text.setAttribute('stroke-width', '2');
      text.textContent = value;
      svg.appendChild(text);
    });
    
    // Graduations mineures
    for (let i = 5; i < 50; i += 5) {
      if ([0,10,20,30,40,50].includes(i)) continue;
      const angle = valueToAngle(i);
      const rad = toRad(angle);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx + outerRadius * Math.cos(rad));
      line.setAttribute('y1', cy + outerRadius * Math.sin(rad));
      line.setAttribute('x2', cx + (outerRadius - 10) * Math.cos(rad));
      line.setAttribute('y2', cy + (outerRadius - 10) * Math.sin(rad));
      line.setAttribute('stroke', '#666');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
  }

  function angleForValue(value) {
    const { min, max, startAngle, endAngle } = GAUGE_CONFIG;
    const clamped = Math.max(min, Math.min(max, value));
    return startAngle + ((clamped - min) / (max - min)) * (endAngle - startAngle);
  }

  function updateGaugeNeedle(angle) {
    if (elements.gaugeNeedle) {
      elements.gaugeNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
  }

  function animateGauge(imc) {
    // Reset puis animation
    updateGaugeNeedle(-135);
    setTimeout(() => {
      const targetAngle = angleForValue(imc);
      updateGaugeNeedle(targetAngle);
    }, 50);
  }

  // ===== API PUBLIQUE =====
  return { init };

})();

// Démarrage
document.addEventListener('DOMContentLoaded', IMCCalculator.init);
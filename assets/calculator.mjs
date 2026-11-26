const hoursFormat = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2});
const moneyFormat = new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'});
const ids = ['hours', 'rate', 'percent'];
const limits = {hours: {max: 168, step: 0.1}, rate: {max: 500, step: 0.01}, percent: {max: 100, step: 0.1}};

export function normalizeInput(value, id, fallback = 0) {
  const {max, step} = limits[id];
  const parsed = Number(value);
  if (value === '' || !Number.isFinite(parsed)) return fallback;
  const bounded = Math.min(max, Math.max(0, parsed));
  const units = 1 / step;
  const scaled = bounded * units;
  return Math.round(scaled + Math.abs(scaled) * Number.EPSILON) / units;
}

export function estimate(hours, rate, percent) {
  const annualHours = normalizeInput(hours, 'hours') * 52;
  const hourlyRate = normalizeInput(rate, 'rate');
  const annualSaved = annualHours * normalizeInput(percent, 'percent') / 100;
  return {
    'monthly-hours': annualHours / 12,
    'monthly-saved': annualSaved / 12,
    'remaining-hours': (annualHours - annualSaved) / 12,
    'yearly-hours': annualSaved,
    'monthly-cost': annualHours * hourlyRate / 12,
    'monthly-value': annualSaved * hourlyRate / 12,
    'yearly-value': annualSaved * hourlyRate
  };
}

export function formatEstimate(id, value) {
  if (id.endsWith('cost') || id.endsWith('value')) return moneyFormat.format(value);
  return hoursFormat.format(value) + ' h';
}

function mountCalculator(section) {
  const numberOf = id => section.querySelector('#' + id + '-number');
  const rangeOf = id => section.querySelector('#' + id + '-range');
  const feedback = section.querySelector('#calc-feedback');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const outputs = Object.fromEntries(Object.keys(estimate(0, 0, 0)).map(id => [id, section.querySelector('#' + id)]));
  const units = {hours: 'horas', rate: 'euros por hora', percent: '%'};
  let shown;
  let frame;

  function display() {
    const [hours, rate, percent] = ids.map(id => Number(rangeOf(id).value));
    const target = estimate(hours, rate, percent);
    const start = {...shown};
    const duration = shown && !motion.matches ? 360 : 0;
    const began = performance.now();
    cancelAnimationFrame(frame);
    function paint(now) {
      const t = duration ? Math.min(1, Math.max(0, (now - began) / duration)) : 1;
      shown = {};
      for (const [id, value] of Object.entries(target)) {
        shown[id] = t === 1 ? value : value + (start[id] - value) * (1 - t) ** 3;
        outputs[id].textContent = formatEstimate(id, shown[id]);
      }
      if (t < 1) frame = requestAnimationFrame(paint);
    }
    paint(began);
    section.querySelector('#current-bar').style.width = hours ? '100%' : '0%';
    section.querySelector('#future-bar').style.width = (hours ? 100 - percent : 0) + '%';
  }
  for (const id of ids) {
    const range = rangeOf(id);
    const number = numberOf(id);
    range.disabled = number.disabled = false;
    function sync(value) {
      range.value = value;
      range.setAttribute('aria-valuetext', hoursFormat.format(Number(range.value)) + ' ' + units[id]);
      number.removeAttribute('aria-invalid');
      feedback.textContent = '';
      display();
    }
    range.setAttribute('aria-valuetext', hoursFormat.format(Number(range.value)) + ' ' + units[id]);
    range.addEventListener('input', () => {
      number.value = range.value;
      sync(range.value);
    });
    number.addEventListener('input', () => {
      if (number.value !== '' && number.validity.valid) {
        sync(number.value);
      } else {
        number.setAttribute('aria-invalid', 'true');
        feedback.textContent = 'Introduce un valor entre 0 y ' + range.max + ' ' + units[id] +
          ', en pasos de ' + hoursFormat.format(limits[id].step) + '. Se muestra la última estimación válida.';
      }
    });
    number.addEventListener('blur', () => {
      const value = normalizeInput(number.value, id, Number(range.value));
      number.value = String(value);
      sync(value);
    });
  }
  motion.addEventListener('change', display);
  display();
}

if (typeof document !== 'undefined') {
  const section = document.getElementById('calculadora');
  if (section) mountCalculator(section);
}

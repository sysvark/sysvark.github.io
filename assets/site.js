"use strict";



document.documentElement.classList.add("js");

const menu = document.getElementById("primary-nav");
const toggle = document.querySelector(".nav-toggle");

function setMenu(open) {
  menu.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

if (menu && toggle) {
  toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", event => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  matchMedia("(min-width: 761px)").addEventListener("change", () => setMenu(false));
}

const ids = ["hours", "rate", "percent"];
const formatHours = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const formatMoney = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const ranges = ids.map(id => document.getElementById(id + "-range"));

let displayed;
let estimateFrame;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function displayEstimate() {
  const [hours, rate, percent] = ranges.map(range => Number(range.value));
  const monthlyHours = hours * 52 / 12;
  const monthlySaved = monthlyHours * percent / 100;
  const target = [monthlyHours, monthlySaved, monthlyHours - monthlySaved, monthlySaved * 12,
    monthlyHours * rate, monthlySaved * rate, monthlySaved * rate * 12];
  const outputs = ['monthly-hours','monthly-saved','remaining-hours','yearly-hours','monthly-cost','monthly-value','yearly-value'];
  const start = displayed || target;
  const duration = displayed && !reducedMotion.matches ? 360 : 0;
  const began = performance.now();
  cancelAnimationFrame(estimateFrame);
  function paint(now) {
    const t = duration ? Math.min(1, Math.max(0, (now - began) / duration)) : 1;
    displayed = target.map((value, i) => t === 1 ? value : value + (start[i] - value) * (1 - t) ** 3);
    outputs.forEach((id, i) => {
      document.getElementById(id).textContent = i < 4 ? formatHours.format(displayed[i]) + ' h' : formatMoney.format(displayed[i]);
    });
    if (t < 1) estimateFrame = requestAnimationFrame(paint);
  }
  paint(began);
  document.getElementById("current-bar").style.width = hours > 0 ? "100%" : "0";
  document.getElementById("future-bar").style.width = (hours > 0 ? 100 - percent : 0) + "%";
}

if (ranges.every(Boolean)) {
  ids.forEach((id, index) => {
    const number = document.getElementById(id + "-number");
    const range = ranges[index];
    range.addEventListener("input", () => {
      number.value = range.value;
      displayEstimate();
    });
    number.addEventListener("input", () => {
      if (number.value !== "" && number.validity.valid) {
        range.value = number.value;
        displayEstimate();
      }
    });
    number.addEventListener("change", () => {
      range.value = number.value || "0";
      number.value = range.value;
      displayEstimate();
    });
  });
  displayEstimate();
}

const blueprint = document.querySelector('.blueprint');
if (blueprint) {
  const layers = blueprint.querySelectorAll('.flow-layer');
  const labels = blueprint.querySelectorAll('.port-label');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const sources = [['googlesheets','Filas'], ['googledrive','Archivos'], ['gmail','Consultas'],
    ['googleforms','Solicitudes'], ['github','Incidencias'], ['airtable','Pedidos']];
  const destinations = [['notion','Fichas'], ['airtable','Registros'], ['googlecalendar','Citas'],
    ['gmail','Respuestas'], ['googlesheets','Informes'], ['googledrive','Copias']];
  const pick = items => items[Math.floor(Math.random() * items.length)];
  let previousNode;
  let fade;
  let timer;
  let frame;
  let visible = false;
  function compact() {
    frame = null;
    const rect = blueprint.getBoundingClientRect();
    const progress = motion.matches ? 0 : Math.min(1, Math.max(0, (innerHeight * .42 - rect.top) / (rect.height * .95)));
    layers.forEach(layer => layer.setAttribute('transform', 'translate(0 ' + Number(layer.dataset.offset) * (1 - .7 * progress) + ')'));
  }
  function queue() { if (visible && !frame) frame = requestAnimationFrame(compact); }
  function synchronize() {
    clearInterval(timer);
    clearTimeout(fade);
    blueprint.querySelectorAll(".fading").forEach(node => node.classList.remove("fading"));
    compact();
    if (visible && !document.hidden && !motion.matches) {
      timer = setInterval(() => {
        const used = new Set(Array.from(labels, label => label.parentNode.dataset.icon));
        const options = Array.from(labels, (label, i) => ({
          label, available: (i < 3 ? sources : destinations).filter(([icon]) => !used.has(icon))
        })).filter(option => option.available.length && option.label !== previousNode);
        if (!options.length) return;
        const {label, available} = pick(options);
        const node = label.parentElement;
        const [icon, name] = pick(available);
        node.classList.add('fading');
        fade = setTimeout(() => {
          node.querySelector('image').setAttribute('href','/assets/logos/' + icon + '.svg');
          label.textContent = name;
          node.classList.remove('fading');
          node.dataset.icon = icon;
          previousNode = label;
        }, 440);
      }, 1900);
    }
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; synchronize(); }).observe(blueprint);
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue);
  motion.addEventListener('change', synchronize);
  document.addEventListener('visibilitychange', synchronize);
}

const reveal = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      reveal.unobserve(entry.target);
    }
  }
}, {threshold: .3});
document.querySelectorAll('.ink, .experience-logos li').forEach(element => reveal.observe(element));

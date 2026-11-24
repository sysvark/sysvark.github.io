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

function displayEstimate() {
  const [hours, rate, percent] = ranges.map(range => Number(range.value));
  const monthlyHours = hours * 52 / 12;
  const monthlySaved = monthlyHours * percent / 100;
  const hourText = value => formatHours.format(value) + " h";
  const values = {
    "monthly-hours": hourText(monthlyHours),
    "monthly-saved": hourText(monthlySaved),
    "remaining-hours": hourText(monthlyHours - monthlySaved),
    "yearly-hours": hourText(monthlySaved * 12),
    "monthly-cost": formatMoney.format(monthlyHours * rate),
    "monthly-value": formatMoney.format(monthlySaved * rate),
    "yearly-value": formatMoney.format(monthlySaved * rate * 12)
  };
  Object.entries(values).forEach(([id, value]) => {
    document.getElementById(id).textContent = value;
  });
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
  const tools = [
    ['googlesheets','Sheets'],['googledrive','Drive'],['gmail','Gmail'],
    ['notion','Notion'],['airtable','Airtable'],['googlecalendar','Calendar'],
    ['googleforms','Forms'],['github','GitHub'],['n8n','n8n']
  ];
  let change = 0;
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
        const index = change % labels.length;
        const label = labels[index];
        const node = label.parentElement;
        const [icon, name] = tools[(index + 3 * (1 + Math.floor(change / labels.length))) % tools.length];
        node.classList.add('fading');
        fade = setTimeout(() => {
          node.querySelector('image').setAttribute('href','/assets/logos/' + icon + '.svg');
          label.textContent = name;
          node.classList.remove('fading');
          change++;
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

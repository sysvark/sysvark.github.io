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

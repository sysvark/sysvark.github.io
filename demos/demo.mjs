const theater = document.querySelector('.demo-theater');
const scenes = [...theater.querySelectorAll('.scene')];
const choices = [...theater.querySelectorAll('.scene-picker button')];
const steps = scenes.map(scene => [...scene.querySelectorAll('footer button')]);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let example = 0;
let stage = 0;
let visible = false;
let timer;

function render() {
  scenes.forEach((scene, index) => {
    const active = example === index;
    scene.hidden = !active;
    choices[index].setAttribute('aria-pressed', String(active));
    if (!active) return;
    scene.dataset.stage = String(stage);
    steps[index].forEach((button, i) => button.setAttribute('aria-pressed', String(stage === i)));
    scene.querySelectorAll('.workflow-nodes li').forEach((node,i) => {
      node.classList.toggle('reached', i <= stage);
      node.classList.toggle('current', i === stage);
    });
  });
}
function schedule() {
  clearTimeout(timer);
  if (!visible || document.hidden || motion.matches) return;
  timer = setTimeout(() => {
    if (stage + 1 < steps[example].length) stage++;
    else {
      const previous = scenes[example];
      example = (example + 1) % scenes.length;
      stage = 0;
      if (previous.contains(document.activeElement)) choices[example].focus({preventScroll:true});
    }
    render();
    schedule();
  }, 4200);
}
function select(index, step) {
  example = index;
  stage = step;
  render();
  schedule();
}
choices.forEach((button, i) => button.addEventListener('click', () => select(i, 0)));
steps.forEach((buttons,i) => buttons.forEach((button,j) => button.addEventListener('click', () => select(i,j))));
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(theater);
document.addEventListener('visibilitychange', schedule);
motion.addEventListener('change', schedule);
render();

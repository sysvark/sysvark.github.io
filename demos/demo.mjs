const theater = document.querySelector('.demo-theater');
const scenes = [...theater.querySelectorAll('.scene')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let tick = 0;
let visible = false;
let timer;

function render() {
  const active = Math.floor(tick / 3);
  scenes.forEach((scene, index) => {
    scene.hidden = !motion.matches && index !== active;
    scene.dataset.stage = motion.matches ? '2' : String(tick % 3);
  });
}
function synchronize() {
  clearInterval(timer);
  render();
  if (visible && !document.hidden && !motion.matches) {
    timer = setInterval(() => {
      tick = (tick + 1) % (scenes.length * 3);
      render();
    }, 2400);
  }
}
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  synchronize();
}).observe(theater);
document.addEventListener('visibilitychange', synchronize);
motion.addEventListener('change', synchronize);
render();

const burger = document.querySelector('.nav-burger');
const drawer = document.querySelector('.mobile-drawer');
if (burger && drawer) {
  burger.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
}

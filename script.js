(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js");
  body.classList.add("site-ready");

  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    revealItems.forEach((item) => observer.observe(item));
  }

  const menuButton = document.querySelector(".menu-button");
  const mobileNav = document.querySelector(".mobile-nav");
  const setMenu = (open) => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    mobileNav.classList.toggle("is-open", open);
  };
  menuButton?.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

  if (reduceMotion) return;

  const scenes = [...document.querySelectorAll("[data-scene]")];
  if ("IntersectionObserver" in window) {
    const sceneObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const shell = entry.target.querySelector(".scene-shell");
        if (!shell || shell.dataset.settled) return;
        shell.dataset.settled = "true";
        shell.animate(
          [
            { transform: "translate3d(0, 7vh, 0) perspective(1200px) rotateX(2.5deg) scaleY(.975)", filter: "blur(2px)" },
            { transform: "translate3d(0, -14px, 0) perspective(1200px) rotateX(-.4deg) scaleY(1.006)", filter: "blur(0)", offset: 0.72 },
            { transform: "translate3d(0, 0, 0) perspective(1200px) rotateX(0) scaleY(1)", filter: "blur(0)" },
          ],
          { duration: 1050, easing: "cubic-bezier(.16, 1, .3, 1)" },
        );
        sceneObserver.unobserve(entry.target);
      }),
      { threshold: 0.08 },
    );
    scenes.forEach((scene) => sceneObserver.observe(scene));
  }

  const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
  let frame = 0;
  let currentDrift = 0;
  let targetDrift = 0;
  let velocity = 0;
  let lastScrollY = window.scrollY;

  const update = () => {
    const scrollY = window.scrollY;
    const scrollRange = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    root.style.setProperty("--scroll-progress", String(Math.min(scrollY / scrollRange, 1)));
    targetDrift = Math.max(-18, Math.min(18, (scrollY - lastScrollY) * 0.7));
    velocity += (targetDrift - currentDrift) * 0.12;
    velocity *= 0.68;
    currentDrift += velocity;
    root.style.setProperty("--scroll-drift", `${currentDrift.toFixed(2)}px`);

    parallaxItems.forEach((item) => {
      const distance = item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2 - window.innerHeight / 2;
      const speed = Number(item.dataset.parallax || 0.05);
      const horizontal = Number(item.dataset.parallaxX || 0);
      const rotate = Number(item.dataset.parallaxRotate || 0);
      item.style.setProperty("--parallax-y", `${(distance * speed).toFixed(2)}px`);
      item.style.setProperty("--parallax-x", `${(distance * horizontal).toFixed(2)}px`);
      item.style.setProperty("--parallax-rotate", `${Math.max(-5, Math.min(5, distance * rotate)).toFixed(2)}deg`);
    });

    lastScrollY = scrollY;
    targetDrift *= 0.72;
    if (Math.abs(velocity) > 0.02 || Math.abs(targetDrift - currentDrift) > 0.02) {
      frame = requestAnimationFrame(update);
    } else {
      currentDrift = 0;
      root.style.setProperty("--scroll-drift", "0px");
      frame = 0;
    }
  };
  const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
  update();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
})();

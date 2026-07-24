function pageTransition() {
  let tl = gsap.timeline();

  tl.set(".transition", {
    clipPath: "inset(100% 0% 0% 0%)",
  });

  tl.to(".transition", {
    duration: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    ease: "power4.inOut",
  });

  tl.to(".transition", {
    duration: 1,
    clipPath: "inset(0% 0% 100% 0%)",
    ease: "power4.inOut",
    delay: 0.2,
  });
}

function delay(n) {
  n = n || 0;
  return new Promise((done) => {
    setTimeout(() => {
      done();
    }, n);
  });
}

function waitForLayout() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function waitForImages(container) {
  const imgs = container.querySelectorAll('img');
  return Promise.all(
    Array.from(imgs).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.addEventListener('load', res, { once: true });
            img.addEventListener('error', res, { once: true });
          })
    )
  );
}

barba.init({
  transitions: [
    {
      async leave(data) {
        pageTransition();
        await delay(1000);
      },

      async enter(data) {
        window.scrollTo(0, 0);
        if (window.lenis) {
          window.lenis.scrollTo(0, { immediate: true });
        }

        if (window.ScrollTrigger) {
          ScrollTrigger.getAll().forEach((st) => st.kill());
        }

        await waitForLayout();
        await waitForImages(data.next.container);

        if (window.initPageAnimations) {
          window.initPageAnimations();
        }

        if (window.initBottomNav) {
          window.initBottomNav();
        }
        if (window.initTopNavMenu) {
          window.initTopNavMenu();
        }

        if (window.ScrollTrigger) {
          ScrollTrigger.refresh();
        }
        window.dispatchEvent(new Event("resize"));
      },
    },
  ],
});
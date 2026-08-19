gsap.from(".work-title", {
    x: -80,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
        trigger: ".work-header",
        start: "top 88%",
        toggleActions: "play none none none",
    },
});

gsap.from(".work-year", {
    x: 80,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
        trigger: ".work-header",
        start: "top 88%",
        toggleActions: "play none none none",
    },
});


// // ── Tech carousel — Jason's ticker technique ──────────
// document.querySelectorAll('.card-tech-wrap').forEach(wrap => {
//     const rows = wrap.querySelectorAll('.card-tech-row');
//     if (rows.length < 2) return;

//     // Wait for fonts to load BEFORE measuring scrollWidth
//     // Inter loads async — measuring before it's ready gives wrong widths
//     document.fonts.ready.then(() => {
//         requestAnimationFrame(() => {
//             const rowW = rows[0].scrollWidth;

//             gsap.set(rows[0], { x: 0,    yPercent: -50 });
//             gsap.set(rows[1], { x: rowW, yPercent: -50 });

//             let x0 = 0;
//             let x1 = rowW;
//             const speed = 0.6;

//             gsap.ticker.add(() => {
//                 x0 -= speed;
//                 x1 -= speed;

//                 if (x0 <= -rowW) x0 = x1 + rowW;
//                 if (x1 <= -rowW) x1 = x0 + rowW;

//                 gsap.set(rows[0], { x: x0 });
//                 gsap.set(rows[1], { x: x1 });
//             });
//         });
//     });
// });

/////////////////////////////////////////
(function initFooterNavHide() {
    const topNav      = document.querySelector('nav'); // may be null on work page — that's fine
    const bottomNav   = document.getElementById('bottom-nav')
                     || document.getElementById('bottom-nav-work');
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;                          // only pageContent is truly required

    const navsToToggle = [topNav, bottomNav].filter(Boolean);
    const trailSvgs = document.querySelectorAll('.trail-svg');

    ScrollTrigger.create({
        trigger: pageContent,
        start: 'bottom bottom',
        onEnter: () => {
            if (navsToToggle.length) gsap.to(navsToToggle, {
                opacity: 0, pointerEvents: 'none', duration: 0.4, ease: 'power2.out'
            });
            trailActive = true;
            trailSvgs.forEach(svg => svg.style.opacity = '1');
        },
        onLeaveBack: () => {
            if (navsToToggle.length) gsap.to(navsToToggle, {
                opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out'
            });
            trailActive = false;
            trailSvgs.forEach(svg => svg.style.opacity = '0');
        },
    });
})();
/////////////////////////////////////////////////////////////////
gsap.utils.toArray('.work-card .card-media').forEach(media => {
    const img = media.querySelector('.card-image');
    if (!img) return;

    gsap.fromTo(img,
        { yPercent: -10 },
        {
            yPercent: 10,
            ease: 'none',                 // critical — no easing on parallax
            scrollTrigger: {
                trigger: media,
                start: 'top bottom',      // card enters from below
                end: 'bottom top',        // card exits at top
                scrub: 0.4,               // slight lag = the "classy" feel
            },
        }
    );
});

const cardContainers = document.querySelectorAll(".card-media.try");

cardContainers.forEach((cardContainer) => {
  const cardPaths = cardContainer.querySelectorAll(".svg-stroke path");
  
  const cardTitle = cardContainer.querySelector(".card-title h3");
  if (!cardTitle) return;

  const split = SplitText.create(cardTitle, {
    type: "words",
    mask: "words",
  });

  gsap.set(split.words, { yPercent: 100 });

  cardPaths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
  });

  let tl;

  cardContainer.addEventListener("mouseenter", () => {
    if (tl) tl.kill();
    tl = gsap.timeline();

    cardPaths.forEach((path) => {
      tl.to(
        path,
        {
          strokeDashoffset: 0,
          strokeWidth: 70,
          duration: 1.5,
          ease: "power2.out",
        },
        0,
      );
    });

    tl.to(
      split.words,
      {
        yPercent: 0,
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.075,
      },
      0.35,
    );
  });

  cardContainer.addEventListener("mouseleave", () => {
    if (tl) tl.kill();
    tl = gsap.timeline();

    cardPaths.forEach((path) => {
      const length = path.getTotalLength();
      tl.to(
        path,
        {
          strokeDashoffset: length,
          strokeWidth: 10,
          duration: 1,
          ease: "power2.out",
        },
        0,
      );
    });

    tl.to(
      split.words,
      {
        yPercent: 100,
        duration: 0.5,
        ease: "power3.out",
        stagger: { each: 0.05, from: "end" },
      },
      0,
    );
  });
});

//////////////////////////////////////////////////////////////////////////////
if (window.PageTransitions) {
      window.PageTransitions.init();
  }
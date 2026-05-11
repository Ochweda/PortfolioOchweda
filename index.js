// import Lenis from "lenis";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () =>{
    if (window.innerWidth >= 900) {
        const lenis = new Lenis();
        const imageContainer = document.querySelector(".image-container-desktop");
        const imageTitleElements = document.querySelectorAll(".image-title p");

        lenis.on("scroll", ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000)
        })

        gsap.ticker.lagSmoothing(0);

        //Large screen settings at aspect-ratio 5/4 to get perfect spacing for image preview section

    //     const breakpoints = [
    //   { maxWidth: 1000, translateY: -135, movMultiplier: 450 },
    //   { maxWidth: 1100, translateY: -130, movMultiplier: 500 },
    //   { maxWidth: 1200, translateY: -125, movMultiplier: 550 },
    //   { maxWidth: 1300, translateY: -120, movMultiplier: 600 },
    //   { maxWidth: 1440, translateY: -122, movMultiplier: 650 },  // ← ADD laptop range
    //   // { maxWidth: 1536, translateY: -108, movMultiplier: 460 },
    // ];

    // const getInitialValues = () => {
    //   const width = window.innerWidth;

    //   for (const bp of breakpoints) {
    //     if (width <= bp.maxWidth) {
    //       return {
    //         translateY: bp.translateY,
    //         movementMultiplier: bp.movMultiplier,
    //       };
    //     }
    //   }

    //   return {
    //     translateY: -130,
    //     movementMultiplier: 650,
    //   };
    // };
    const getInitialValues = () => {
            const vw = window.innerWidth;
 
            /*
             * translateY: percentage of element height to lift image into hero.
             * Element height = container width × (4/5) because aspect-ratio 5/4.
             * Container width = clamp(300px, 53vw, 1020px)
             * We keep these as tuned percentages — they scale automatically
             * because translateY% is relative to the element's own height.
             *
             * WAS: hardcoded per-breakpoint values
             * NOW: single formula that interpolates smoothly across all widths
             */
            const translateY = -gsap.utils.clamp(130, 135, gsap.utils.mapRange(900, 1920, 135, 108, vw));
 
            /*
             * WAS: fixed numbers (450, 500, 550 etc.)
             * NOW: 45% of viewport width — feels proportionally identical
             *      on any screen size because mouse drift scales with screen
             */
            const movementMultiplier = vw * 0.45;
 
            return { translateY, movementMultiplier };
        };

    const initialValues = getInitialValues();

    const animationState = {
      scrollProgress: 0,
      initialTranslateY: initialValues.translateY,
      currentTranslateY: initialValues.translateY,
      movementMultiplier: initialValues.movementMultiplier,
      scale: 0.25,
      fontSize: 80,
      gap: 2,
      targetMouseX: 0,
      currentMouseX: 0,
    };

    window.addEventListener("resize", () => {
      const newValues = getInitialValues();
      animationState.initialTranslateY = newValues.translateY;
      animationState.movementMultiplier = newValues.movementMultiplier;

      if (animationState.scrollProgress === 0) {
        animationState.currentTranslateY = newValues.translateY;
      }
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: ".intro",
        start: "top bottom",
        end: "top 10%",
        scrub: true,
        onUpdate: (self) => {
          animationState.scrollProgress = self.progress;

          animationState.currentTranslateY = gsap.utils.interpolate(
            animationState.initialTranslateY,
            0,
            animationState.scrollProgress
          );

          animationState.scale = gsap.utils.interpolate(
            0.35,
            0.65,
            animationState.scrollProgress
          );

          

          animationState.gap = gsap.utils.interpolate(
            2,
            1,
            animationState.scrollProgress
          );

          animationState.settledTranslateX = gsap.utils.interpolate(
              0,
              window.innerWidth * 0.28,
              animationState.scrollProgress
          );

          if (animationState.scrollProgress <= 0.4) {
            const firstPartProgress = animationState.scrollProgress / 0.4;
            animationState.fontSize = gsap.utils.interpolate(
              80,
              40,
              firstPartProgress
            );
          } else {
            const secondPartProgress =
              (animationState.scrollProgress - 0.4) / 0.6;
            animationState.fontSize = gsap.utils.interpolate(
              40,
              20,
              secondPartProgress
            );
          }
        },
      },
    });

    document.addEventListener("mousemove", (e) => {
    animationState.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  });

  const animate = () => {
    if (window.innerWidth < 900) return;

    const {
      scale,
      targetMouseX,
      currentMouseX,
      currentTranslateY,
      fontSize,
      gap,
      movementMultiplier
    } = animationState;

    const mouseInfluence = Math.max(0, 1 - animationState.scrollProgress * 2);
    const scaleMovementMultiplier = (1 - scale) * movementMultiplier;
    const maxHorizontalMovement = targetMouseX * scaleMovementMultiplier * mouseInfluence;

    animationState.currentMouseX = gsap.utils.interpolate(
      currentMouseX,
      maxHorizontalMovement,
      0.05
    );

    const totalX = (animationState.settledTranslateX || 0) + animationState.currentMouseX;
    imageContainer.style.transform = `translateY(${currentTranslateY}%) translateX(${totalX}px) scale(${scale})`;

    imageContainer.style.gap = `${gap}em`;

    imageTitleElements.forEach((element) => {
      element.style.fontSize = `${fontSize}px`;
    });

    requestAnimationFrame(animate);
  };

  animate();

  // ── About text animations ──────────────────────────────
  const paragraph = document.querySelector(".about-text p");

  if (paragraph) {

    const rawHTML = paragraph.innerHTML.trim();
    const lineSegments = rawHTML.split(/<br\s*\/?>/i);

    // ── Custom class assignment per word ─────────────────────
    // One number per word, in reading order.
    // 0 = no offset, 1 = -0.8em, 2 = +1.6em, 3 = -2.4em
    // Edit these numbers freely to match the feel you want.
    // Count your words and assign — do not need to follow any pattern.
    const wordClasses = [
        0, 2, 1,        // Passionate about bridging
        4, 5, 6,        // the gap between
        7, 8, 0,        // conceptualization & instantiation.
        0, 2, 1, 13,     // I design, build and
        14, 15, 16, 17, 18,  // ship intelligent systems powered by
        19, 20, 21, 22,     // AI. With leverage being
        23, 24, 25,        // my main concern,
        26, 27, 28, 29,     // I craft full stack
        30, 31, 32,        // systems whose value
        33, 34, 35, 36,     // addition would be to
        37, 38, 39,        // reduce wastage around
        40, 41, 42,        // time and money.
    ];

    let wordIndex = 0;

    const processedHTML = lineSegments.map((segment, segIndex) => {
        const words = segment.trim().split(/\s+/).filter(Boolean);
        const wordsHTML = words.map(word => {
            const n = wordClasses[wordIndex] !== undefined
                ? wordClasses[wordIndex]
                : wordIndex % 4; // fallback if array runs short
            wordIndex++;
            return `<span class="word${n}">${word}</span>`;
        }).join(" ");

        return segIndex < lineSegments.length - 1
            ? wordsHTML + "<br>"
            : wordsHTML;
    }).join("");

    paragraph.innerHTML = processedHTML;

    // CHANGE TO (Jason's actual values):
      gsap.set(".about-text .word1", { x: "2.8em" });
      gsap.set(".about-text .word2", { x: "1.6em" });
      gsap.set(".about-text .word3", { x: "-0.4em" });
      gsap.set(".about-text .word4", { x: "-0.8em" });
      gsap.set(".about-text .word5", { x: "-0.8em" });
      gsap.set(".about-text .word6", { x: "3.4em" });
      gsap.set(".about-text .word7", { x: "1.8em" });
      gsap.set(".about-text .word8", { x: "2.6em" });
      gsap.set(".about-text .word9", { x: "-0.4em" });
      gsap.set(".about-text .word10", { x: "2.8em" });
      gsap.set(".about-text .word11", { x: "1.6em" });
      gsap.set(".about-text .word12", { x: "-0.4em" });
      gsap.set(".about-text .word13", { x: "0.8em" });
      gsap.set(".about-text .word14", { x: "6.6em" });
      gsap.set(".about-text .word15", { x: 0 });
      gsap.set(".about-text .word16", { x: 0 });
      gsap.set(".about-text .word17", { x: "6.6em"});
      gsap.set(".about-text .word18", { x: "6.6em"});
      gsap.set(".about-text .word19", { x: "6.6em" });
      gsap.set(".about-text .word20", { x: 0 });
      gsap.set(".about-text .word21", { x: "0.6em" });
      gsap.set(".about-text .word22", { x: 0 });
      gsap.set(".about-text .word23", { x: 0 });
      gsap.set(".about-text .word24", { x: 0 });
      gsap.set(".about-text .word25", { x: 0 });
      gsap.set(".about-text .word26", { x: "6em" });
      gsap.set(".about-text .word27", { x: 0 });
      gsap.set(".about-text .word28", { x: "1.5em" });
      gsap.set(".about-text .word29", { x: "1em" });
      gsap.set(".about-text .word30", { x: "3em" });
      gsap.set(".about-text .word31", { x: 0 });
      gsap.set(".about-text .word32", { x: 0 });
      gsap.set(".about-text .word33", { x: "3em" });
      gsap.set(".about-text .word34", { x: 0 });
      gsap.set(".about-text .word35", { x: 0 });
      gsap.set(".about-text .word36", { x: 0 });
      gsap.set(".about-text .word37", { x: 0 });
      gsap.set(".about-text .word38", { x: 0 });
      gsap.set(".about-text .word39", { x: "3em" });
      gsap.set(".about-text .word40", { x: "3em" });
      gsap.set(".about-text .word41", { x: 0 });
      gsap.set(".about-text .word42", { x: 0 });

    gsap.to(".about-text .word0, .about-text .word1, .about-text .word2, .about-text .word3, .about-text .word9,.about-text .word10,.about-text .word11,.about-text .word12", {
      x: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 99%",
        end: "bottom 85%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word4, .about-text .word5", {
      x: "3.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 109%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word7, .about-text .word8", {
      x: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 109%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word23, .about-text .word24", {
      x: "2em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 95%",
        end: "bottom 65%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word31, .about-text .word32", {
      x: "3em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 95%",
        end: "bottom 55%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word39, .about-text .word40", {
      x: "1em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 90%",
        end: "bottom 55%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word36, .about-text .word37", {
      x: "2em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 90%",
        end: "bottom 55%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word13", {
      x: "3.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word38", {
      x: "1em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 90%",
        end: "bottom 55%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word27", {
      x: "1em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 95%",
        end: "bottom 60%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word29", {
      x: "2.4em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 95%",
        end: "bottom 60%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word25", {
      x: "2em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 95%",
        end: "bottom 65%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word14", {
      x: "3.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word15", {
      x: "5.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word16", {
      x: "6.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word17, .about-text .word18, .about-text .word19", {
      x: "1.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word22", {
      x: "3.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 72%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word20", {
      x: "1.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 72%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word26", {
      x: "2.5em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 95%",
        end: "bottom 95%",
        scrub: true,
      },
    });
    gsap.to(" .about-text .word21", {
      x: "2.9em",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-text",
        start: "top 100%",
        end: "bottom 72%",
        scrub: true,
      },
    });

    // const allWordSpans = [...paragraph.querySelectorAll("span")];

    // gsap.fromTo(
    //   allWordSpans,
    //   { opacity: 0.12 },
    //   {
    //     opacity: 1,
    //     stagger: 0.05,
    //     ease: "none",
    //     scrollTrigger: {
    //       trigger: ".about-text",
    //       start: "top 75%",
    //       end: "bottom 30%",
    //       scrub: 1,
    //     },
    //   }
    // );
  }


  // ═══════════════════════════════════════════════════════
// WORK SECTION JS
// Paste inside DOMContentLoaded, after about text block
// ═══════════════════════════════════════════════════════

// ── 1. Header slide-in ──────────────────────────────────
// "WORK" slides from left, "'25" slides from right —
// both triggered when the section enters the viewport.
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

// ── 2. Card reveal on scroll ─────────────────────────────
// Each <li> fades up as it enters the viewport.
// Stagger gives a cascading left-to-right feel.
// const workItems = document.querySelectorAll(".work-item");

// workItems.forEach((item, i) => {
//     gsap.to(item, {
//         opacity: 1,
//         y: 0,
//         duration: 0.9,
//         ease: "power3.out",
//         delay: i * 0.1,
//         scrollTrigger: {
//             trigger: ".work-list",
//             start: "top 85%",
//             toggleActions: "play none none none",
//         },
//     });
// });

// ── 3. GSAP-driven tech carousel ─────────────────────────
// Matches Jason's approach: GSAP ticker drives translateX
// continuously on two identical rows.
// When row 1 has moved left by its full width, it jumps
// back — row 2 was already filling the gap, creating
// a seamless loop with no CSS animation.

// const workCards = document.querySelectorAll(".work-card");

// workCards.forEach(card => {
//     const wrap  = card.querySelector(".card-tech-wrap");
//     const rows  = card.querySelectorAll(".card-tech-row");
//     if (!wrap || rows.length < 2) return;

//     // Speed: pixels moved per second (negative = left)
//     // Matches roughly the speed visible in Jason's DevTools
//     const speed = 60;

//     let x = 0;
//     let paused = false;

//     // Pause on card hover
//     card.addEventListener("mouseenter", () => { paused = true; });
//     card.addEventListener("mouseleave", () => { paused = false; });

//     // Measure the width of one row AFTER it has rendered
//     // We use requestAnimationFrame to ensure layout is complete
//     requestAnimationFrame(() => {
//         const rowWidth = rows[0].getBoundingClientRect().width;

//         // Position row 2 immediately to the right of row 1
//         // so they appear seamlessly joined
//         gsap.set(rows[1], { x: rowWidth });

//         // Track each row's independent x position
//         let x0 = 0; // row 1 starts at 0
//         let x1 = rowWidth; // row 2 starts offset right

//         gsap.ticker.add((time, deltaTime) => {
//             if (paused) return;

//             // Move left by speed per second (deltaTime is in ms)
//             const delta = (speed * deltaTime) / 1000;

//             x0 -= delta;
//             x1 -= delta;

//             // When a row has moved left past its full width,
//             // jump it to the right of the other row —
//             // this is the seamless infinite loop mechanism
//             if (x0 <= -rowWidth) x0 = x1 + rowWidth;
//             if (x1 <= -rowWidth) x1 = x0 + rowWidth;

//             rows[0].style.transform = `translateY(-50%) translateX(${x0}px)`;
//             rows[1].style.transform = `translateY(-50%) translateX(${x1}px)`;
//         });
//     });
// });

// ── 4. Hover video play/pause ────────────────────────────
// workCards.forEach(card => {
//     const video = card.querySelector(".card-video");
//     if (!video) return;

//     card.addEventListener("mouseenter", () => {
//         video.play().catch(() => {}); // fail silently if no src yet
//     });

//     card.addEventListener("mouseleave", () => {
//         video.pause();
//         video.currentTime = 0;
//     });
// });

// ── 5. "See all" magnetic button ────────────────────────
// const seeAllBtn = document.querySelector(".see-all-btn");

// if (seeAllBtn) {
//     seeAllBtn.addEventListener("mousemove", (e) => {
//         const rect = seeAllBtn.getBoundingClientRect();
//         const cx = rect.left + rect.width  / 2;
//         const cy = rect.top  + rect.height / 2;

//         gsap.to(seeAllBtn, {
//             x: (e.clientX - cx) * 0.22,
//             y: (e.clientY - cy) * 0.22,
//             duration: 0.35,
//             ease: "power2.out",
//         });
//     });

//     seeAllBtn.addEventListener("mouseleave", () => {
//         gsap.to(seeAllBtn, {
//             x: 0,
//             y: 0,
//             duration: 0.6,
//             ease: "elastic.out(1, 0.5)",
//         });
//     });
// }
// ── Tech carousel — Jason's ticker technique ──────────
document.querySelectorAll('.card-tech-wrap').forEach(wrap => {
    const rows = wrap.querySelectorAll('.card-tech-row');
    if (rows.length < 2) return;

    // Wait for fonts to load BEFORE measuring scrollWidth
    // Inter loads async — measuring before it's ready gives wrong widths
    document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
            const rowW = rows[0].scrollWidth;

            gsap.set(rows[0], { x: 0,    yPercent: -50 });
            gsap.set(rows[1], { x: rowW, yPercent: -50 });

            let x0 = 0;
            let x1 = rowW;
            const speed = 0.6;

            gsap.ticker.add(() => {
                x0 -= speed;
                x1 -= speed;

                if (x0 <= -rowW) x0 = x1 + rowW;
                if (x1 <= -rowW) x1 = x0 + rowW;

                gsap.set(rows[0], { x: x0 });
                gsap.set(rows[1], { x: x1 });
            });
        });
    });
});

  }

  
});
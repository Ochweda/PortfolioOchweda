// import Lenis from "lenis";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

// Force scroll to top before anything runs
// history.scrollRestoration = "manual";
// window.scrollTo(0, 0);



gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);
gsap.registerPlugin(CustomEase);
/////////////////////////////////////////////////////////////////////////////////////////////////////////

ScrollTrigger.config({ ignoreMobileResize: true });

/* ── Scroll lock ──────────────────────────────────────
   Module scope so it exists before DOMContentLoaded. */
let lenis = null;

const ScrollLock = (() => {
    let locked = false;
    let failsafe = null;

    const opts = { passive: false, capture: true };

    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

    const keys = { 32:1, 33:1, 34:1, 35:1, 36:1, 38:1, 40:1 };
    const stopKeys = (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        if (keys[e.keyCode]) { e.preventDefault(); e.stopPropagation(); }
    };

    // Anything that slips through gets snapped back the same frame, so
    // offset can never accumulate — and there's nothing to reset later.
    const pin = () => { if (locked && window.scrollY !== 0) window.scrollTo(0, 0); };

    const api = {
        lock() {
            if (locked) return;
            locked = true;
            document.documentElement.classList.add("is-scroll-locked");
            window.addEventListener("wheel",     stop,     opts);
            window.addEventListener("touchmove", stop,     opts);
            window.addEventListener("keydown",   stopKeys, opts);
            window.addEventListener("scroll",    pin,      { passive: true });
            if (lenis) lenis.stop();
            failsafe = setTimeout(() => api.unlock(), 8000);
        },
        unlock() {
            clearTimeout(failsafe);
            document.documentElement.classList.remove("is-scroll-locked");
            if (!locked) return;
            locked = false;
            window.removeEventListener("wheel",     stop,     opts);
            window.removeEventListener("touchmove", stop,     opts);
            window.removeEventListener("keydown",   stopKeys, opts);
            window.removeEventListener("scroll",    pin,      { passive: true });
            if (lenis) lenis.start();       // ← no scrollTo, no jump
            ScrollTrigger.refresh();
        },
        get isLocked() { return locked; },
        attachLenis(instance) { if (locked) instance.stop(); },
    };
    return api;
})();

// Lock right now if this page has a preloader. index.js is loaded at the
// end of <body>, so the DOM is already queryable here.
if (document.querySelector(".pre-preloader") || document.querySelector(".preloader-progress")) {
    ScrollLock.lock();
}


document.addEventListener("DOMContentLoaded", () =>{

  // At the very top of DOMContentLoaded, BEFORE the if (window.innerWidth >= 900) check:
        // let lenis = null;
        let prePreloaderControlsBottomNav = false;



        // Put this near the top of DOMContentLoaded, alongside your other
// function declarations — NOT inside document.fonts.ready.then(...)

 // ── Lenis first, so ScrollLock has something to actually stop ──
    lenis = new Lenis();
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    ScrollLock.attachLenis(lenis);   // ← stops it immediately if locked

function initTextReveal() {
    if (typeof SplitText === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(SplitText, ScrollTrigger);

    const EASE = "expo.out";

    document.querySelectorAll(".title-block h1, .scard-content h3").forEach((heading) => {
        SplitText.create(heading, {
            type: "words",
            wordsClass: "reveal-word",
            mask: "words",
            autoSplit: true,
            onSplit(self) {
                return gsap.from(self.words, {
                    yPercent: 110,
                    opacity: 0,
                    duration: 1,
                    ease: EASE,
                    stagger: 0.05,
                    scrollTrigger: { trigger: heading, start: "top 85%", once: true },
                });
            },
        });
    });

    document.querySelectorAll(".summary-chip p, .scard-description p").forEach((para) => {
        SplitText.create(para, {
            type: "lines",
            linesClass: "reveal-line", 
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
                return gsap.from(self.lines, {
                    yPercent: 110,
                    opacity: 0,
                    duration: 0.9,
                    ease: EASE,
                    stagger: 0.09,
                    scrollTrigger: { trigger: para, start: "top 88%", once: true },
                });
            },
        });
    });

    ["title-meta", "stack-list", "scard-stack"].forEach((cls) => {
        document.querySelectorAll(`.${cls}`).forEach((group) => {
            const items = [...group.children];
            if (!items.length) return;
            gsap.set(items, { opacity: 0, y: 22 });
            ScrollTrigger.create({
                trigger: group,
                start: "top 88%",
                once: true,
                onEnter: () =>
                    gsap.to(items, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.07 }),
            });
        });
    });

    document.querySelectorAll(".year-value").forEach((el) => {
        gsap.set(el, { opacity: 0, y: 16 });
        ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            once: true,
            onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: EASE }),
        });
    });
}

// Call it independently, right after your existing document.fonts.ready.then(...) block:
document.fonts.ready.then(initTextReveal);
      
    CustomEase.create("hop", "0.8, 0, 0.2, 1");
    CustomEase.create("hop2", "0.9, 0, 0.1, 1");

    const splitText = (selector, type, className, mask = true) => {
      return SplitText.create(selector, {
        type: type,
        [`${type}Class`]: className,
        ...(mask && { mask: type }),
      });
    };

    function shouldPlayPreloader() {
    const navEntries = performance.getEntriesByType('navigation');
    const navType = navEntries.length ? navEntries[0].type : 'navigate';

    // Hard refresh (reload button / F5) always replays the preloader
    if (navType === 'reload') return true;

    // Otherwise: only play it if this tab hasn't played it yet this session
    return sessionStorage.getItem('evrimaPreloaderPlayed') !== '1';
}

function skipPreloader(splits) {
    // Instantly hide the preloader overlay — no animation
    gsap.set(".pre-preloader", { display: "none" });

    // Instantly set every element the timeline normally animates in,
    // straight to its final "revealed" state
    gsap.set(splits.preloaderHeaderSplit.chars, { visibility: "visible" });
    gsap.set(".image-container-desktop .image-preview", { scale: 1, opacity: 1 });
    gsap.set(".hero-bg-mobile img", { scale: 1 });   // ← add this line — was stuck at 1.35
    gsap.set(splits.headerSplit.chars, { y: "0%" });
    gsap.set(
        [splits.navSplit.words, splits.navLeftSplit.words, splits.navButtonsSplit.words],
        { y: "0%" }
    );
    gsap.set(splits.footerSplit.words, { y: "0%" });
    gsap.set(splits.heroLabelsSplit.words, { y: "0%" });
    gsap.set(splits.heroRoleSplit.words, { y: "0%" });

    if (document.querySelector(".bottom-nav-work")) {
        gsap.set(".bottom-nav-work", { opacity: 1, y: 0 });
    }

    if (typeof window.__revertHeroSplits === "function") {
        window.__revertHeroSplits();
    }

    ScrollLock.unlock();
}

    if (document.querySelector(".pre-preloader")) {

      const playPreloader = shouldPlayPreloader(); 
           
          const preloaderHeaderSplit = splitText(".pre-preloader-header h1", "chars", "char");
          const navSplit = splitText("nav a", "words", "word");
          const navLeftSplit = splitText(".nav-1 p", "words", "word");
          const navButtonsSplit = splitText(".btn-contact, .btn-menu", "words", "word");
          const headerSplit = splitText(".preheader h1", "chars", "char", false);
          const footerSplit = splitText(".hero-copy p", "words", "word");
          const heroLabelsSplit = splitText(".hero-labels-row span", "words", "word");
          const heroRoleSplit = splitText(".hero-role-row span", "words", "word");
          // ...gsap.set() calls, and the whole `tl` timeline...

          const heroSplits = [
              preloaderHeaderSplit, navSplit, navLeftSplit, navButtonsSplit,
              headerSplit, footerSplit, heroLabelsSplit, heroRoleSplit,
          ];

          let heroSplitsLive = true;

          function revertHeroSplits() {
              if (!heroSplitsLive) return;
              heroSplitsLive = false;
              heroSplits.forEach((s) => s && s.revert && s.revert());
              ScrollTrigger.refresh();
          }

          // Expose so the resize handler can reach it
          window.__revertHeroSplits = revertHeroSplits;
        
        // NEW — make it visible again now that the chars are split and hidden via transform
        gsap.set(preloaderHeaderSplit.chars, { visibility: "visible" });

        const preloaderImgInitRotations = [7.5, -2.5, -10, 12.5, -5, 5];
        gsap.set(".pre-preloader-img", {
          rotate: (i) => preloaderImgInitRotations[i],
        });
        gsap.set(".image-container-desktop .image-preview", { scale: 1.15, opacity: 0 });
        gsap.set(".hero-bg-mobile img", { scale: 1.35 }); 
        gsap.set(".bottom-nav-work", { opacity: 0, y: 20 });   // ← add this line
        
        prePreloaderControlsBottomNav = true;   

        if (playPreloader) { 
        const tl = gsap.timeline({ delay: 0.5, onComplete: revertHeroSplits });

        tl.to(".pre-preloader-img", {
          scale: 1,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 1,
          ease: "hop",
          stagger: 0.2,
        });

        tl.to(
          ".pre-preloader-header h1 .char",
          {
            y: "0%",
            duration: 1,
            ease: "hop2",
            stagger: { each: 0.125, from: "random" },
          },
          "0.35",
        );

        tl.to(
          ".pre-preloader-counter p",
          {
            y: "0%",
            duration: 1,
            ease: "hop2",
            onStart: () => {
              const counterEl = document.querySelector(".pre-preloader-counter p");
              const counter = { value: 0 };

              gsap.to(counter, {
                value: 100,
                duration: 2,
                delay: 0.5,
                ease: "power2.inOut",
                onUpdate: () => {
                  counterEl.textContent = String(Math.round(counter.value)).padStart(
                    3,
                    "0",
                  );
                },
              });
            },
          },
          "<",
        );

        tl.to(
          ".pre-preloader-counter p",
          {
            y: "-100%",
            duration: 0.75,
            ease: "hop2",
          },
          3.25,
        );

        tl.to(
          ".pre-preloader-header h1 .char",
          {
            y: "-100%",
            duration: 0.75,
            ease: "hop2",
            stagger: { each: 0.125, from: "random" },
          },
          3.25,
        );

        tl.to(
          ".pre-preloader-images .pre-preloader-img",
          {
            scale: 0,
            clipPath: "polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)",
            duration: 1,
            ease: "hop2",
            stagger: -0.075,
          },
          3.5,
        );

        tl.to(
          ".pre-preloader",
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
            duration: 1,
            ease: "hop2",
             onStart: () => ScrollLock.unlock(),
          },
          4.35,
        );

        tl.to(
          ".hero-bg-mobile img",
          {
            scale: 1,
            duration: 1.9,
            ease: "hop2",
          },
          4.35,
        );

        tl.to(
          ".preheader h1 .char",
          {
            y: "0%",
            duration: 1,
            ease: "hop",
            stagger: { each: 0.075, from: "random" },
          },
          4.95,
        );

        tl.to(
          ".image-container-desktop .image-preview",
          {
            scale: 1,
            opacity: 1,
            duration: 1.1,
            ease: "hop2",
          },
          4.5,
        );

        tl.to(
          "nav a .word, .nav-1 p .word, .btn-contact .word, .btn-menu .word",
          {
            y: "0%",
            duration: 1,
            ease: "hop",
            stagger: 0.075,
          },
          4.75,
        );

        tl.to(
          ".hero-copy p .word",
          {
            y: "0%",
            duration: 1,
            ease: "hop",
            stagger: 0.075,
          },
          5.75,
        );

        tl.to(
          ".hero-labels-row .word",
          {
            y: "0%",
            duration: 0.9,
            ease: "hop",
            stagger: 0.08,
          },
          4.85,
        );

        tl.to(
          ".hero-role-row .word",
          {
            y: "0%",
            duration: 0.9,
            ease: "hop",
            stagger: 0.1,
          },
          4.95,
        );
        // ← add this block
        tl.to(
            ".bottom-nav-work",
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power4.out",
            },
            6.4,
        );
        sessionStorage.setItem('evrimaPreloaderPlayed', '1');   // ← add this line

        } else {                                                 // ← add this block
            skipPreloader({
                preloaderHeaderSplit,
                navSplit,
                navLeftSplit,
                navButtonsSplit,
                headerSplit,
                footerSplit,
                heroLabelsSplit,
                heroRoleSplit,
            });
        }

  }






    const isDesktop = window.innerWidth >= 900;

    
        // lenis = new Lenis();
        const imageContainer = document.querySelector(".image-container-desktop");
        const imageTitleElements = document.querySelectorAll(".image-title p");

        // lenis.on("scroll", ScrollTrigger.update);

        // gsap.ticker.add((time) => {
        //     lenis.raf(time * 1000)
        // })

        // gsap.ticker.lagSmoothing(0);

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
      scale: 0.35,
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    requestAnimationFrame(animate);
    if (window.innerWidth < 900) return;
    if (!imageContainer) return;

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

    
  };

  animate();

  // ── About text animations ──────────────────────────────
  const paragraph = document.querySelector(".about-text p");

  if (paragraph) {
    const aboutMM = gsap.matchMedia();
    aboutMM.add("(min-width: 900px)", () => {

  // if (paragraph && isDesktop) {

    const rawHTML = paragraph.innerHTML.trim();
    const lineSegments = rawHTML.split(/<br[^>]*>/i);

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

    if (!paragraph.dataset.split) {
    paragraph.innerHTML = processedHTML;
    paragraph.dataset.split = "1";
}

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
  // }

    });
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

gsap.from(".services-title", {
    x: -80,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
        trigger: ".services-header",
        start: "top 88%",
        toggleActions: "play none none none",
    },
});


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


(function initServicesCards() {
    const mm = gsap.matchMedia();

    // ── Desktop: existing pin/fold stacking effect, unchanged ──
    mm.add("(min-width: 901px)", () => {
        const serviceTriggers = [];
        const scards = gsap.utils.toArray(".scard");
        if (!scards.length) return;

        const foldStep = 22; // vh

        scards.forEach((card, index) => {
            const isLastCard = index === scards.length - 1;
            const cardInner = card.querySelector(".scard-inner");
            if (isLastCard) return;

            const cardPin = ScrollTrigger.create({
                trigger: card,
                start: "top 25%",
                endTrigger: ".tech-stack",
                end: "top 55%",
                pin: true,
                pinSpacing: false,
            });
            serviceTriggers.push(cardPin);

            const cardTween = gsap.to(cardInner, {
                y: `-${(scards.length - index) * foldStep}vh`,
                ease: "none",
                scrollTrigger: {
                    trigger: card,
                    start: "top 25%",
                    endTrigger: ".tech-stack",
                    end: "top 65%",
                    scrub: true,
                    invalidateOnRefresh: true,
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                },
            });
            if (cardTween.scrollTrigger) serviceTriggers.push(cardTween.scrollTrigger);
        });

        // matchMedia cleanup — auto-runs if the breakpoint is crossed
        return () => serviceTriggers.forEach(t => t.kill && t.kill());
    });

    // ── Mobile: no pinning — cards just flow, with a gentle reveal ──
    mm.add("(max-width: 900px)", () => {
        const scards = gsap.utils.toArray(".scard");
        const tweens = scards.map(card =>
            gsap.from(card, {
                opacity: 0,
                y: 40,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                    toggleActions: "play none none none",
                },
            })
        );
        return () => tweens.forEach(tw => tw.scrollTrigger && tw.scrollTrigger.kill());
    });
})();

// Refresh once everything has actually loaded, so the pin/scrub trigger
// points above are measured against the final, fully-rendered page height.
window.addEventListener("load", () => {
    ScrollTrigger.refresh();
});

// Belt-and-suspenders: also refresh specifically once every image in the
// services/work sections has decoded, since 'load' can still race lazy
// or slow images on a slower connection.
const criticalImages = document.querySelectorAll(
    ".scard-img img, .card-media img, .image-preview img"
);
Promise.all(
    Array.from(criticalImages).map(img =>
        img.complete
            ? Promise.resolve()
            : new Promise(resolve => {
                  img.addEventListener("load", resolve, { once: true });
                  img.addEventListener("error", resolve, { once: true });
              })
    )
).then(() => ScrollTrigger.refresh());

  // ── Tech stack — direction-aware hover ───────────────
(function initTechGrid() {
    document.querySelectorAll('.tech-cell').forEach(cell => {
        const bg = cell.querySelector('.cell-bg');
        if (!bg) return;

        // Hide all overlays off-screen to start
        gsap.set(bg, { xPercent: 0, yPercent: -100 });

        // Returns the directional offset {xPercent, yPercent}
        // based on which side of the cell the cursor is nearest.
        // Used as "from" on enter and "to" on leave.
        function getDir(e) {
            const r = cell.getBoundingClientRect();
            const dx = (e.clientX - r.left) / r.width - 0.5;
            const dy = (e.clientY - r.top) / r.height - 0.5;

            return Math.abs(dx) > Math.abs(dy)
                ? { xPercent: dx > 0 ? 100 : -100, yPercent: 0 }
                : { xPercent: 0, yPercent: dy > 0 ? 100 : -100 };
        }

        cell.addEventListener('mouseenter', e => {
            const from = getDir(e);
            cell.classList.add('is-hovered');
            gsap.fromTo(bg, from, {
                xPercent: 0,
                yPercent: 0,
                duration: 0.45,
                ease: 'power3.out',
            });
        });

        cell.addEventListener('mouseleave', e => {
            const to = getDir(e);
            cell.classList.remove('is-hovered');
            gsap.to(bg, {
                xPercent: to.xPercent,
                yPercent: to.yPercent,
                duration: 0.45,
                ease: 'power3.in',
            });
        });
    });
})();


    const animateOnScroll = true;

    const config = {
        gravity: { x: 0, y: 1 },
        restitution: 0.5,
        friction: 0.15,
        frictionAir: 0.02,
        density: 0.002,
        wallThickness: 200,
        mouseStiffness: 0.6,
    };

    let engine,
        runner,
        mouseConstraint,
        bodies = [],
        topWall = null;

    // ── NEW: resize-accessible physics state ──
    let physicsContainer = null;
    let containerRect = null;
    const physicsWalls = {};   


    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function buildWalls(w, h, t) {
    return {
        ground: Matter.Bodies.rectangle(
            w / 2, h + t / 2, w + t * 2, t, { isStatic: true }
        ),
        left: Matter.Bodies.rectangle(
            -t / 2, h / 2, t, h + t * 2, { isStatic: true }
        ),
        right: Matter.Bodies.rectangle(
            w + t / 2, h / 2, t, h + t * 2, { isStatic: true }
        ),
    };
}

    function initPhysics(container) {
        engine = Matter.Engine.create();
        engine.gravity = config.gravity;
        engine.constraintIterations = 10;
        engine.positionIterations = 20;
        engine.velocityIterations = 16;
        engine.timing.timeScale = 1;

        physicsContainer = container;
        containerRect = container.getBoundingClientRect();
        const wallThickness = config.wallThickness;

        // const walls = [
        //     Matter.Bodies.rectangle(
        //         containerRect.width / 2,
        //         containerRect.height + wallThickness / 2,
        //         containerRect.width + wallThickness * 2,
        //         wallThickness,
        //         { isStatic: true }
        //     ),
        //     Matter.Bodies.rectangle(
        //         -wallThickness / 2,
        //         containerRect.height / 2,
        //         wallThickness,
        //         containerRect.height + wallThickness * 2,
        //         { isStatic: true }
        //     ),
        //     Matter.Bodies.rectangle(
        //         containerRect.width + wallThickness / 2,
        //         containerRect.height / 2,
        //         wallThickness,
        //         containerRect.height + wallThickness * 2,
        //         { isStatic: true }
        //     ),
        // ];
        // Matter.World.add(engine.world, walls);

        // physicsWalls.ground = Matter.Bodies.rectangle(
        //     containerRect.width / 2,
        //     containerRect.height + wallThickness / 2,
        //     containerRect.width + wallThickness * 2,
        //     wallThickness,
        //     { isStatic: true }
        // );
        // physicsWalls.left = Matter.Bodies.rectangle(
        //     -wallThickness / 2,
        //     containerRect.height / 2,
        //     wallThickness,
        //     containerRect.height + wallThickness * 2,
        //     { isStatic: true }
        // );
        // physicsWalls.right = Matter.Bodies.rectangle(
        //     containerRect.width + wallThickness / 2,
        //     containerRect.height / 2,
        //     wallThickness,
        //     containerRect.height + wallThickness * 2,
        //     { isStatic: true }
        // );

        // Matter.World.add(engine.world, [
        //     physicsWalls.ground,
        //     physicsWalls.left,
        //     physicsWalls.right,
        // ]);

        Object.assign(physicsWalls, buildWalls(containerRect.width, containerRect.height, wallThickness));
          Matter.World.add(engine.world, [
              physicsWalls.ground,
              physicsWalls.left,
              physicsWalls.right,
          ]);

        const objects = container.querySelectorAll(".object");
        objects.forEach((obj, index) => {
            const objRect = obj.getBoundingClientRect();

            const startX =
                Math.random() * (containerRect.width - objRect.width) +
                objRect.width / 2;
            const startY = -100 - index * 80;
            const startRotation = (Math.random() - 0.5) * Math.PI;

            const body = Matter.Bodies.rectangle(
                startX,
                startY,
                objRect.width,
                objRect.height,
                {
                    restitution: config.restitution,
                    friction: config.friction,
                    frictionAir: config.frictionAir,
                    density: config.density,
                }
            );

            Matter.Body.setAngle(body, startRotation);

            bodies.push({
                body: body,
                element: obj,
                width: objRect.width,
                height: objRect.height,
            });

            Matter.World.add(engine.world, body);
        });
        setTimeout(() => {
        topWall = Matter.Bodies.rectangle(
          containerRect.width / 2,
          -wallThickness / 2,
          containerRect.width + wallThickness * 2,
          wallThickness,
          { isStatic: true }
        );
        Matter.World.add(engine.world, topWall);
      }, 3000);


       // ── Drag interaction — desktop only ───────────────────
    // Matter.Mouse binds touchstart/touchmove with preventDefault(),
    // which is what was eating page scroll inside this section.
    // Skipping it leaves gravity + collisions fully intact.
    const canDrag = window.matchMedia(
        "(min-width: 901px) and (hover: hover) and (pointer: fine)"
    ).matches;

    if (canDrag) {

      const mouse = Matter.Mouse.create(container);
      mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

      mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: config.mouseStiffness,
          render: { visible: false },
        },
      });

      mouseConstraint.mouse.element.oncontextmenu = () => false;

      let dragging = null;
      let originalInertia = null;

      Matter.Events.on(mouseConstraint, "startdrag", function (event) {
        dragging = event.body;
        if (dragging) {
          originalInertia = dragging.inertia;
          Matter.Body.setInertia(dragging, Infinity);
          Matter.Body.setVelocity(dragging, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(dragging, 0);
        }
      });

      Matter.Events.on(mouseConstraint, "enddrag", function (event) {
        if (dragging) {
          Matter.Body.setInertia(dragging, originalInertia || 1);
          dragging = null;
          originalInertia = null;
        }
      });

      Matter.Events.on(engine, "beforeUpdate", function () {
        if (dragging) {
          const found = bodies.find((b) => b.body === dragging);
          if (found) {
            const minX = found.width / 2;
            const maxX = containerRect.width - found.width / 2;
            const minY = found.height / 2;
            const maxY = containerRect.height - found.height / 2;

            Matter.Body.setPosition(dragging, {
              x: clamp(dragging.position.x, minX, maxX),
              y: clamp(dragging.position.y, minY, maxY),
            });

            Matter.Body.setVelocity(dragging, {
              x: clamp(dragging.velocity.x, -20, 20),
              y: clamp(dragging.velocity.y, -20, 20),
            });
          }
      }
      });

      container.addEventListener("mouseleave", () => {
        mouseConstraint.constraint.bodyB = null;
      mouseConstraint.constraint.pointB = null;
      });

      document.addEventListener("mouseup", () => {
        mouseConstraint.constraint.bodyB = null;
        mouseConstraint.constraint.pointB = null;
      });

      Matter.World.add(engine.world, mouseConstraint);
    }

      runner = Matter.Runner.create();
      Matter.Runner.run(runner, engine);

      function updatePositions() {
        bodies.forEach(({ body, element, width, height }) => {
          const x = clamp(
            body.position.x - width / 2,
            0,
            containerRect.width - width
          );
          const y = clamp(
            body.position.y - height / 2,
          -height * 3,
            containerRect.height - height
          );

          element.style.transformOrigin = 'center center';
          element.style.left = x + "px";
          element.style.top = y + "px";
          element.style.transform = `rotate(${body.angle}rad)`;
        });

          requestAnimationFrame(updatePositions);
      }
        updatePositions();
      }

      function resizePhysics() {
    if (!engine || !physicsContainer) return;

    // clientWidth/Height instead of getBoundingClientRect — immune to any
    // CSS transform an ancestor might still be carrying mid-refresh
    const w = physicsContainer.clientWidth;
    const h = physicsContainer.clientHeight;
    const t = config.wallThickness;
    if (!w || !h) return;

    containerRect = { width: w, height: h };

    // Walls must be REBUILT, not repositioned — their dimensions were
    // baked in at creation and a moved-but-undersized floor lets bodies
    // fall through the uncovered edges.
    Matter.World.remove(engine.world, [
        physicsWalls.ground,
        physicsWalls.left,
        physicsWalls.right,
    ]);
    Object.assign(physicsWalls, buildWalls(w, h, t));
    Matter.World.add(engine.world, [
        physicsWalls.ground,
        physicsWalls.left,
        physicsWalls.right,
    ]);

    if (topWall) {
        Matter.World.remove(engine.world, topWall);
        topWall = Matter.Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, { isStatic: true });
        Matter.World.add(engine.world, topWall);
    }

    // Re-measure each capsule — CSS sizes them responsively, so the body
    // geometry drifts from the DOM element after a resize.
    bodies.forEach((entry) => {
        const r = entry.element.getBoundingClientRect();
        if (r.width && r.height) {
            const sx = r.width / entry.width;
            const sy = r.height / entry.height;
            if (Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01) {
                Matter.Body.scale(entry.body, sx, sy);
                entry.width = r.width;
                entry.height = r.height;
            }
        }

        // Anything now outside the new bounds gets pulled back in
        const b = entry.body;
        const x = clamp(b.position.x, entry.width / 2, Math.max(entry.width / 2, w - entry.width / 2));
        const y = Math.min(b.position.y, h - entry.height / 2);

        if (x !== b.position.x || y !== b.position.y) {
            Matter.Body.setPosition(b, { x, y });
            Matter.Body.setVelocity(b, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(b, 0);
        }
    });
}

      if (animateOnScroll) {
        document.querySelectorAll("section").forEach((section) => {
        if (section.querySelector(".object-container")) {
          ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
              once: true,
              onEnter: () => {
                const container = section.querySelector(".object-container");
                if (container && !engine) {
                  initPhysics(container);
                }
              },
          });
          }
        });
      } else {
        window.addEventListener("load", () => {
          const container = document.querySelector(".object-container");
        if (container) {
            initPhysics(container);      }
        });
      }
      
      // ── Bottom nav ticker ─────────────────────────────────
// REPLACE your existing initBnavTicker with this:
// (function initBnavTicker() {
//     const wraps = document.querySelectorAll('.bnav-ticker-wrap'); // ← querySelectorAll not querySelector
//     if (!wraps.length) return;

//     wraps.forEach(wrap => {
//         const rows = wrap.querySelectorAll('.bnav-ticker-row');
//         if (rows.length < 2) return;

//         requestAnimationFrame(() => {
//             const rowW = rows[0].scrollWidth;

//             gsap.set(rows[0], { x: 0, yPercent: -50 });
//             gsap.set(rows[1], { x: rowW, yPercent: -50 });

//             let x0 = 0, x1 = rowW;
//             const speed = 0.35;

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
// })();

// ── Tickers — shared, re-measurable ──────────────────
const tickerRemeasurers = [];

function initTicker(wrap, rowSelector, speed) {
    const rows = wrap.querySelectorAll(rowSelector);
    if (rows.length < 2) return;

    let rowW = 0, x0 = 0, x1 = 0;

    const measure = () => {
        const w = rows[0].scrollWidth;
        if (!w) return;                    // element hidden — skip, retry next resize
        rowW = w;
        x0 = 0;
        x1 = rowW;
        gsap.set(rows[0], { x: x0, yPercent: -50 });
        gsap.set(rows[1], { x: x1, yPercent: -50 });
    };

    const tick = () => {
        if (!rowW) return;                 // no-ops safely until measured
        x0 -= speed;
        x1 -= speed;
        if (x0 <= -rowW) x0 = x1 + rowW;
        if (x1 <= -rowW) x1 = x0 + rowW;
        gsap.set(rows[0], { x: x0 });
        gsap.set(rows[1], { x: x1 });
    };

    document.fonts.ready.then(() => requestAnimationFrame(() => {
        measure();
        gsap.ticker.add(tick);
    }));

    tickerRemeasurers.push(measure);
}

document.querySelectorAll('.card-tech-wrap')
    .forEach(w => initTicker(w, '.card-tech-row', 0.6));

document.querySelectorAll('.bnav-ticker-wrap')
    .forEach(w => initTicker(w, '.bnav-ticker-row', 0.35));

// ── Menu open / close ─────────────────────────────────
// ── Menu open / close ─────────────────────────────────
(function initMenu() {
    const wrapper = document.getElementById('bnav-wrapper');
    const menuBtn = document.getElementById('bnav-menu-btn');
    const popover = document.getElementById('bmenu-popover');
    if (!wrapper || !menuBtn || !popover) return;

    const navItems = popover.querySelectorAll('.bmenu-nav-item');
    let isOpen = false;

    gsap.set([...navItems], { opacity: 0, y: 12 });
    

    function openMenu() {
        isOpen = true;
        wrapper.classList.add('is-open');
        menuBtn.classList.add('is-open');
        menuBtn.setAttribute('aria-expanded', 'true');

        gsap.set([...navItems], { opacity: 0, y: 12 });

        // Stagger nav items in with GSAP
        gsap.to([...navItems],
            {
                opacity: 1,
                y: 0,
                duration: 0.38,
                ease: 'power3.out',
                stagger: 0.07,
                delay: 0.1,
            }
        );
    }

    function closeMenu() {
        isOpen = false;
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');

        gsap.to([...navItems].reverse(), {
            opacity: 0,
            y: 10,
            duration: 0.18,
            ease: 'power2.in',
            stagger: 0.03,
            onComplete: () => {
                wrapper.classList.remove('is-open');
                gsap.set([...navItems], { opacity: 0, y: 12 });
            }
        });
    }

    menuBtn.addEventListener('click', () => {
        isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen) closeMenu();
    });

    document.addEventListener('click', e => {
        if (isOpen && !wrapper.contains(e.target)) closeMenu();
    });

    navItems.forEach(item => item.addEventListener('click', closeMenu));
})();

// Live clock in footer
function updateFooterTime() {
    const el = document.getElementById('footer-time');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Nairobi'
    });
}
updateFooterTime();
setInterval(updateFooterTime, 10000); // updates every 10s

// ── Hide navs when footer is revealed ────────────────
(function initFooterNavHide() {
  if (window.innerWidth < 900) {
        // Mouse trail is desktop-only; nothing to do here on mobile.
        return;
    }
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

let trailActive = false;
const trails = document.querySelectorAll(".trail");
const smoothPointer = {
  x: window.innerWidth/2,
  y: window.innerHeight/2,
}
const totalPointsArray = [40, 35, 30, 25, 20, 15, 10];

if (window.innerWidth >= 900) {
    window.addEventListener("mousemove", (event) => {
        gsap.to(smoothPointer, {
            x:event.clientX,
            y:event.clientY,
            duration:0.5,
            ease: "power2.out",
        });
    });
}

function updatePath(){
  trails.forEach((path, index) => {
    if (!trailActive) {
      path.points = [];
      path.setAttribute("d", "");
      return;
    }
    let points = path.points || [];
    points.unshift({...smoothPointer});
    while (points.length > totalPointsArray[index]) {
      points.pop();
    }
    path.points = points;

    if (points.length > 1) {
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i=1; i < points.length; i++) {
        d+= `L ${points[i].x} ${points[i].y}`;
      }
      path.setAttribute("d", d);
    }
  });

  requestAnimationFrame(updatePath);
}

updatePath();

document.fonts.ready.then(() => {

    // Lab preloader (logo/progress-bar timeline) only exists on
    // work.html. On any other page — swork.html included — skip
    // straight to revealing bottom-nav-work on its own, so it
    // doesn't sit through a multi-second timeline built for
    // elements that aren't on this page.
    const hasLabPreloader = document.querySelector(".preloader-progress");

    if (!hasLabPreloader) {
        if (!prePreloaderControlsBottomNav && document.querySelector(".bottom-nav-work")) {
            gsap.set(".bottom-nav-work", { opacity: 0, y: 20 });
            gsap.to(".bottom-nav-work", {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.3,
                ease: "power3.out",   // matches the .work-title/.work-year ease
            });
        }
        return;
    }

    function createSplitTexts(elements) {
        const splits = {};

        elements.forEach(({ key, selector, type }) => {
            const config = { type, mask: type };

            // if (type === "lines") config.mask = "lines";
            if (type === "chars") config.charsClass = "char";
            if (type === "lines") config.linesClass = "line";
            splits[key] = SplitText.create(selector, config);
        });

        return splits;
    }

    const splitElements = [
        { key: "logoChars", selector: ".preloader-logo h1", type: "chars" },
        { key: "footerLines", selector: ".preloader-footer p", type: "lines" },
        { key: "headerChars", selector: ".header-work h1", type: "chars" },
        { key: "heroFooterH3", selector: ".hero-footer-work h3", type: "lines" },
        { key: "heroFooterP", selector: ".hero-footer-work p", type: "lines" },
        { key: "heroHeaderP", selector: ".contact-btn-work p", type: "lines" },
        // { key: "btnLabels", selector: ".btn-label span", type: "lines" },
    ];

    const splits = createSplitTexts(splitElements);
    console.log(splits)

    // Make visible again now that GSAP is ready to control position
gsap.set(splits.logoChars.chars, { visibility: "visible" });

    gsap.set([splits.logoChars.chars], { x: "100%", y: "0%" });
    gsap.set(
        [
            splits.footerLines.lines,
            splits.headerChars.chars,
            splits.heroFooterH3.lines,
            splits.heroFooterP.lines,
            splits.heroHeaderP.lines,
            // splits.btnLabels.lines,
        ],
        { y: "100%" }
    );
    // gsap.set(".btn-icon", { clipPath: "circle(0% at 50% 50%)" });
    // gsap.set(".btn", { scale: 0 });
    gsap.set(".bottom-nav-work", { opacity: 0, y: 20 });

    function animateProgress(duration = 4) {
        const tl = gsap.timeline();
        const counterSteps = 5;
        let currentProgress = 0;

        for (let i = 0; i < counterSteps; i++) {
            const finalStep = i === counterSteps - 1;
            const targetProgress = finalStep
                ? 1
                : Math.min(currentProgress + Math.random() * 0.3 + 0.1, 0.9);
            currentProgress = targetProgress;

            tl.to(".preloader-progress-bar", {
                scaleX: targetProgress,
                duration: duration / counterSteps,
                ease: "power2.out",
            });
        }

        return tl;
    }

    const tl = gsap.timeline({ delay: 0.5 });

    tl.to(splits.logoChars.chars, {
        x: "0%",
        stagger: 0.05,
        duration: 1,
        ease: "power4.inOut",
    }).to (
      splits.footerLines.lines, 
      {
        y: "0%",
        stagger: 0.1,
        duration: 1,
        ease: "power4.inOut",
      },
      "0.25"
    )
    .add(animateProgress(), "<")
        .set(".preloader-progress", { backgroundColor: "var(--base-300)" })
        .to(
            splits.logoChars.chars,
            {
                x: "-100%",
                stagger: 0.05,
                duration: 1,
                ease: "power4.inOut",
            },
            "-=0.5"
        )
        .to(
            splits.footerLines.lines,
            {
                y: "-100%",
                stagger: 0.1,
                duration: 1,
                ease: "power4.inOut",
            },
            "<"
        )
        .to(
          ".preloader-progress",
          {
            opacity:0,
            duration:0.5,
            ease: "power3.out",
          },
          "-=0.25"
        )
        .to(
          ".preloader-mask",
          {
            scale: 5,
            duration:2.5,
            ease: "power3.out",
            onStart: () => ScrollLock.unlock(),
          },
          "<"
        )
        .to (
          ".hero-img-work",
          {
            scale: 1,
            duration: 1.5,
            ease: "power3.out",
          },
          "<"
        )
        .to(splits.headerChars.chars, {
            y: 0,
            stagger: 0.05,
            duration: 1,
            ease: "power4.out",
            delay: -2,
        })
        .to(
            [splits.heroFooterH3.lines, splits.heroFooterP.lines, splits.heroHeaderP.lines],
            {
                y: 0,
                stagger: 0.1,
                duration: 1,
                ease: "power4.out",
            },
            "-=1.5"
        )
        .to(
            ".bottom-nav-work",
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power4.out",
            },
            "-=0.8"  // overlaps slightly with the footer text reveal
        );

        // ── About Work — Sharp Character Highlight ────────────
        // ── About Work — Sharp Character Highlight ────────────
const mm = gsap.matchMedia();

mm.add({
    isLarge: "(min-width: 1600px)",
    isSmall: "(min-width: 900px) and (max-width: 1599px)",
    isMobile: "(max-width: 899px)"
}, (context) => {
    const { isLarge, isSmall, isMobile } = context.conditions;

    const aboutHighlight = SplitText.create(".about-work p", {
        type: "words, chars",
        charsClass: "aw-char",
    });

    gsap.set(aboutHighlight.chars, {
        color: "rgba(255, 255, 255, 0.125)",
    });

    // Mobile: start earlier and give the scrub far more scroll
    // distance to finish, since the paragraph wraps to many more
    // lines and the viewport is shorter than on desktop.
    let start, end;
    if (isMobile) {
        start = "top 75%";
        end = "+=100%";
    } else if (isLarge) {
        start = "top 69%";
        end = "+=100%";
    } else {
        start = "top 50%";
        end = "+=130%";
    }

    gsap.to(aboutHighlight.chars, {
        color: "white",
        stagger: 0.1,
        ease: "none",
        scrollTrigger: {
            trigger: ".about-work",
            start: start,
            end: end,
            scrub: 0.5,
        },
    });

    return () => {
        aboutHighlight.revert(); // clean up SplitText on breakpoint change
    };
});
                
        });

        if (document.querySelector(".menu-overlay")) {
          const container = document.querySelector(".menu-container");
          const navToggle = document.querySelector(".btn-menu.nav-toggle");
          console.log("navToggle:", navToggle); // should NOT be null
          const menuOverlay = document.querySelector(".menu-overlay");
          const menuContent = document.querySelector(".menu-content");
          const menuImage = document.querySelector(".menu-img");
          const menuLinksWrapper = document.querySelector(".menu-links-wrapper");
          const linkHighlighter = document.querySelector(".link-highlighter");

          let currentX = 0;
          let targetX = 0;
          const lerpFactor = 0.05;

          let currentHighlighterX = 0;
          let targetHighlighterX = 0;
          let currentHighlighterWidth = 0;
          let targetHighlighterWidth = 0;

          let isMenuOpen = false;
          let isMenuAnimating = false;

          const menuLinks = document.querySelectorAll(".menu-link a");
          menuLinks.forEach((link) => {
            const chars = link.querySelectorAll("span");
            chars.forEach((char, charIndex) => {
              const split = new SplitText(char, { type: "chars" });
              split.chars.forEach((char) => {
                char.classList.add("char");
              });
              if (charIndex === 1) {
                gsap.set(split.chars, { y: "110%" });
              }
            });
          });

          gsap.set(menuContent, { y: "50%", opacity: 0.25 });
          gsap.set(menuImage, { scale: 0.5, opacity: 0.25 });
          gsap.set(menuLinks, { y: "150%" });
          gsap.set(linkHighlighter, { y: "150%" });

          const defaultLinkText = document.querySelector(
            ".menu-link:first-child a span"
          );
          if (defaultLinkText) {
            const linkWidth = defaultLinkText.offsetWidth;
            linkHighlighter.style.width = linkWidth + "px";
            currentHighlighterWidth = linkWidth;
            targetHighlighterWidth = linkWidth;

            const defaultLinkTextElement = document.querySelector(
              ".menu-link:first-child"
            );
            const linkRect = defaultLinkTextElement.getBoundingClientRect();
            const menuWrapperRect = menuLinksWrapper.getBoundingClientRect();
            const initialX = linkRect.left - menuWrapperRect.left;
            currentHighlighterX = initialX;
            targetHighlighterX = initialX;
          }

          function openMenu() {
            if (isMenuAnimating || isMenuOpen) return;
            isMenuAnimating = true;

            // Hide the top nav
            const topNav = document.querySelector('nav');
            if (topNav) topNav.classList.add('nav-hidden');

            // Disable scroll
            document.body.style.overflow = 'hidden';
            if (lenis) lenis.stop();

            gsap.to(container, {
                y: "-40%",
                opacity: 0.25,
                duration: 1.25,
                ease: "expo.out",
            });

            gsap.to(menuOverlay, {
                clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
                duration: 1.25,
                ease: "expo.out",
                onComplete: () => {
                    gsap.set(container, { y: "40%" });
                    gsap.set(".menu-link", { overflow: "visible" });
                    isMenuOpen = true;
                    isMenuAnimating = false;
                },
            });

            gsap.to(menuContent, {
                y: "0%",
                opacity: 1,
                duration: 1.5,
                ease: "expo.out",
            });

            gsap.to(menuImage, {
                scale: 1,
                opacity: 1,
                duration: 1.5,
                ease: "expo.out",
            });

            gsap.to(menuLinks, {
                y: "0%",
                duration: 1.25,
                stagger: 0.1,
                delay: 0.25,
                ease: "expo.out",
            });

            gsap.to(linkHighlighter, {
                y: "0%",
                duration: 1,
                delay: 1,
                ease: "expo.out",
            });
        }

        function closeMenu() {
            if (isMenuAnimating || !isMenuOpen) return;
            isMenuAnimating = true;

            // Restore the top nav
            const topNav = document.querySelector('nav');
            if (topNav) topNav.classList.remove('nav-hidden');

            // Re-enable scroll
            document.body.style.overflow = '';
            if (lenis) lenis.start();

            gsap.to(container, {
                y: "0%",
                opacity: 1,
                duration: 1.25,
                ease: "expo.out",
            });

            gsap.to(menuLinks, {
                y: "-200%",
                duration: 1.25,
                ease: "expo.out",
            });

            gsap.to(menuContent, {
                y: "-100%",
                opacity: 0.25,
                duration: 1.25,
                ease: "expo.out",
            });

            gsap.to(menuImage, {
                y: "-100%",
                opacity: 0.5,
                duration: 1.25,
                ease: "expo.out",
            });

            gsap.to(menuOverlay, {
                clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
                duration: 1.25,
                ease: "expo.out",
                onComplete: () => {
                    gsap.set(menuOverlay, {
                        clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
                    });
                    gsap.set(menuLinks, { y: "150%" });
                    gsap.set(linkHighlighter, { y: "150%" });
                    gsap.set(menuContent, { y: "50%", opacity: 0.25 });
                    gsap.set(menuImage, { y: "0%", scale: 0.5, opacity: 0.25 });
                    gsap.set(".menu-link", { overflow: "hidden" });
                    gsap.set(menuLinksWrapper, { x: 0 });
                    currentX = 0;
                    targetX = 0;
                    isMenuOpen = false;
                    isMenuAnimating = false;
                },
            });
        }

        // Wire up open to the nav Menu button only
        if (navToggle) {
            navToggle.addEventListener("click", openMenu);
        }

        // Wire up close to the overlay Close p tag only
        const menuCloseOverlay = document.getElementById('menu-close-overlay');
        if (menuCloseOverlay) {
            menuCloseOverlay.addEventListener("click", closeMenu);
        }

        // Escape key also closes
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && isMenuOpen) closeMenu();
        });


        const menuLinkContainers = document.querySelectorAll(".menu-link");
        menuLinkContainers.forEach((link) => {
            link.addEventListener("mouseenter", () => {
              if (window.innerWidth < 1000) return;

              const linkCopy = link.querySelectorAll("a span");
              const visibleCopy = linkCopy[0];
              const animatedCopy = linkCopy[1];

              const visibleChars = visibleCopy.querySelectorAll(".char");
              gsap.to(visibleChars, {
                y: "-110%",
                stagger: 0.03,
                duration: 0.5,
                ease: "expo.inOut",
              });

              const animatedChars = animatedCopy.querySelectorAll(".char");
              gsap.to(animatedChars, {
                y: "0%",
                stagger: 0.03,
                duration: 0.5,
                ease: "expo.inOut",
              });

              // NEW — color matches the highlighter bar
              gsap.to(link.querySelector("a"), {
                color: "#F25623",
                duration: 0.4,
                ease: "expo.inOut",
              });
              });
            link.addEventListener("mouseleave", () => {
            if (window.innerWidth < 1000) return;

            const linkCopy = link.querySelectorAll("a span");
            const visibleCopy = linkCopy[0];
            const animatedCopy = linkCopy[1];

            const animatedChars = animatedCopy.querySelectorAll(".char");
            gsap.to(animatedChars, {
              y: "110%",
              stagger: 0.03,
              duration: 0.5,
              ease: "expo.inOut",
            });

            const visibleChars = visibleCopy.querySelectorAll(".char");
            gsap.to(visibleChars, {
              y: "0%",
              stagger: 0.03,
              duration: 0.5,
              ease: "expo.inOut",
            });

            // NEW — revert color back to white
            gsap.to(link.querySelector("a"), {
              color: "#F5F5F5",
              duration: 0.4,
              ease: "expo.inOut",
            });
          });
      });


        menuOverlay.addEventListener("mousemove", (e) => {
          if (window.innerWidth < 1000) return;

          const mouseX = e.clientX;
          const viewportWidth = window.innerWidth;
          const menuLinksWrapperWidth = menuLinksWrapper.offsetWidth;

          const maxMoveLeft = 0;
          const maxMoveRight = viewportWidth - menuLinksWrapperWidth;

          const sensitivityRange = viewportWidth * 0.5;
          const startX = (viewportWidth - sensitivityRange) / 2;
          const endX = startX + sensitivityRange;

          let mousePercentage;
          if (mouseX <= startX) {
            mousePercentage = 0;
          } else if (mouseX >= endX) {
            mousePercentage = 1;
          } else {
            mousePercentage = (mouseX - startX) / sensitivityRange;
          }

          targetX = maxMoveLeft + mousePercentage * (maxMoveRight - maxMoveLeft);
          });

          menuLinkContainers.forEach((link) => {
            link.addEventListener("mouseenter", () => {
              if (window.innerWidth < 1000) return;

              const linkRect = link.getBoundingClientRect();
              const menuWrapperRect = menuLinksWrapper.getBoundingClientRect();

              targetHighlighterX = linkRect.left - menuWrapperRect.left;

              const linkCopyElement = link.querySelector("a span");
              targetHighlighterWidth = linkCopyElement
                ? linkCopyElement.offsetWidth
                : link.offsetWidth;
            });
          });

          menuLinksWrapper.addEventListener("mouseleave", () => {
            const defaultLinkText = document.querySelector(".menu-link:first-child");
            const defaultLinkTextSpan = defaultLinkText.querySelector("a span");

            const linkRect = defaultLinkText.getBoundingClientRect();
            const menuWrapperRect = menuLinksWrapper.getBoundingClientRect();

            targetHighlighterX = linkRect.left - menuWrapperRect.left;
            targetHighlighterWidth = defaultLinkTextSpan.offsetWidth;
          });

          function animateMenu() {
            currentX += (targetX - currentX) * lerpFactor;
            currentHighlighterX +=
              (targetHighlighterX - currentHighlighterX) * lerpFactor;
            currentHighlighterWidth +=
              (targetHighlighterWidth - currentHighlighterWidth) * lerpFactor;

            gsap.to(menuLinksWrapper, {
              x: currentX,
              duration: 0.3,
              ease: "power4.out",
            });

            gsap.to(linkHighlighter, {
              x: currentHighlighterX,
              width: currentHighlighterWidth,
              duration: 0.3,
              ease: "power4.out",
            });

            requestAnimationFrame(animateMenu);
          }

          animateMenu();
        }

        const cards = gsap.utils.toArray(".card-work");
        if (cards.length) {
        const introCard = cards[0];

        const titles = gsap.utils.toArray(".card-title-work h1");
        titles.forEach((title) => {
            const split = new SplitText(title, {
                type: "char",
                charsClass: "char",
                tag: "div",
            });
            split.chars.forEach((char) => {
                char.innerHTML = `<span>${char.textContent}</span>`;
            });
        });

        const cardImgWrapper = introCard.querySelector(".card-img-work");
        const cardImg = introCard.querySelector(".card-img-work img");
        gsap.set(cardImgWrapper, { scale: 0.5, borderRadius: "400px" });
        gsap.set(cardImg, { scale: 1.5 });

        function animateContentIn(titleChars, description) {
            gsap.to(titleChars, { x: "0%", duration: 0.75, ease: "power4.out" });
            gsap.to(description, {
                x: 0,
                opacity: 1,
                duration: 0.75,
                delay: 0.1,
                ease: "power4.out",
            });
        }

        function animateContentOut(titleChars, description) {
        gsap.to(titleChars, { x: "100%", duration: 0.5, ease: "power4.out" });
        gsap.to(description, {
            x: "40px",
            opacity: 0,
            duration: 0.5,
            ease: "power4.out",
        });
    }

        const marquee = introCard.querySelector(".card-marquee-work .marquee-work");
        const titleChars = introCard.querySelector(".char span");
        const description = introCard.querySelector(".card-description-work");

        ScrollTrigger.create({
            trigger: introCard,
            start: "top top",
            end: "+=300vh",
            onUpdate: (self) => {
                const progress = self.progress;
                const imgScale = 0.5 + progress * 0.5;
                const borderRadius = 400 - progress * 375;
                const innerImgScale = 1.5 - progress * 0.5;

                gsap.set(cardImgWrapper, {
                    scale: imgScale,
                    borderRadius: borderRadius + "px",
                });
                gsap.set(cardImg, { scale: innerImgScale });

                if (imgScale >= 0.5 && imgScale <= 0.75) {
                    const fadeProgress = (imgScale - 0.5) / (0.75 - 0.5);
                    gsap.set(marquee, { opacity: 1 - fadeProgress });
                } else if (imgScale < 0.5) {
                    gsap.set(marquee, { opacity: 1 });
                } else if (imgScale > 0.75) {
                    gsap.set(marquee, { opacity: 0 });
                }

                if (progress >= 1 && !introCard.contentRevealed) {
                    introCard.contentRevealed = true;
                    animateContentIn(titleChars, description);
                }
                if (progress < 1 && introCard.contentRevealed) {
                    introCard.contentRevealed = false;
                    animateContentOut(titleChars, description);
                }
            },
        });

        cards.forEach((card, index) => {
        const isLastCard = index === cards.length - 1;
        ScrollTrigger.create({
            trigger: card,
            start: "top top",
            end: isLastCard ? "+=100vh" : "top top",
            endTrigger: isLastCard ? null : cards[cards.length - 1],
            pin: true,
            pinSpacing: isLastCard,
        });
        });

        cards.forEach((card, index) => {
              if (index < cards.length - 1) {
                  const cardWrapper = card.querySelector(".card-wrapper-work");
                  ScrollTrigger.create({
                      trigger: cards[index + 1],
                      start: "top bottom",
                      end: "top top",
                      onUpdate: (self) => {
                          const progress = self.progress;
                          gsap.set(cardWrapper, {
                              scale: 1 - progress * 0.25,
                              opacity: 1 - progress,
                          });
                      },
                  });
              }
          });

          cards.forEach((card, index) => {
              if (index > 0) {
                  const cardImg = card.querySelector(".card-img-work img");
                  const imgContainer = card.querySelector(".card-img-work");
                  ScrollTrigger.create({
                      trigger: card,
                      start: "top bottom",
                      end: "top top",
                      onUpdate: (self) => {
                          const progress = self.progress;
                          gsap.set(cardImg, { scale: 2 - progress });
                          gsap.set(imgContainer, { borderRadius: 150 - progress * 125 + "px" });
                      },
                  });
              }
          });

          cards.forEach((card, index) => {
              if (index === 0) return;

              const cardDescription = card.querySelector(".card-description-work");
              const cardTitleChars = card.querySelectorAll(".char span");

              ScrollTrigger.create({
                  trigger: card,
                  start: "top top",
                  onEnter: () => animateContentIn(cardTitleChars, cardDescription),
                  onLeaveBack: () => animateContentOut(cardTitleChars, cardDescription),
              });
          });

          setupMarqueeAnimation();



          

        }



        // ── Work card thumbnail parallax ──────────────────────
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


// ── Smooth-scroll same-page anchor links through Lenis instead of
// letting the browser jump natively.
document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
        const [path, hash] = link.getAttribute('href').split('#');
        const samePage = !path || path === window.location.pathname.split('/').pop();
        const target = hash && document.getElementById(hash);

        if (samePage && target && window.lenis) {
            e.preventDefault();
            window.lenis.scrollTo(target);
        }
        // otherwise let it navigate normally — different page, Lenis
        // isn't loaded yet there
    });
});

const docsWrapper = document.querySelector('.docs-dropdown');
const docsTrigger = document.getElementById('docsTrigger');

if (docsWrapper && docsTrigger) {
    docsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        docsWrapper.classList.toggle('open');
        docsTrigger.setAttribute('aria-expanded', docsWrapper.classList.contains('open'));
    });

    document.addEventListener('click', (e) => {
        if (!docsWrapper.contains(e.target)) {
            docsWrapper.classList.remove('open');
            docsTrigger.setAttribute('aria-expanded', false);
        }
    });
}


// ── SERVICES title — sliced letter shutter effect ────────
// (function initServicesSlicedTitle() {
//     const el = document.querySelector(".services-title");
//     if (!el) return;

//     const mm = gsap.matchMedia();

//     mm.add("(min-width: 900px)", () => {
//         const text = el.textContent;
//         el.textContent = "";

//         const letterEls = [];

//         [...text].forEach((char) => {
//             const displayChar = char === " " ? "\u00A0" : char;

//             const letter = document.createElement("span");
//             letter.className = "sliced-letter";

//             const spacer = document.createElement("span");
//             spacer.className = "letter-spacer";
//             spacer.setAttribute("aria-hidden", "true");
//             spacer.textContent = displayChar;

//             const top = document.createElement("span");
//             top.className = "slice slice-top";
//             top.textContent = displayChar;

//             const bottom = document.createElement("span");
//             bottom.className = "slice slice-bottom";
//             bottom.textContent = displayChar;

//             letter.append(spacer, top, bottom);
//             el.appendChild(letter);
//             letterEls.push(letter);
//         });

//         el.classList.add("sliced-active");
//         el.setAttribute("aria-label", text);

//         letterEls.forEach((letter, i) => {
//             const top = letter.querySelector(".slice-top");
//             const bottom = letter.querySelector(".slice-bottom");
//             const dir = i % 2 === 0 ? 1 : -1;

//             gsap.timeline({
//                 scrollTrigger: {
//                     trigger: ".services-header",
//                     start: "top bottom",
//                     end: "top 30%",
//                     scrub: 1,
//                 },
//             })
//                 .fromTo(
//                     top,
//                     { xPercent: 55 * dir, opacity: 0.35 },
//                     { xPercent: 0, opacity: 1, ease: "hop" },
//                     0
//                 )
//                 .fromTo(
//                     bottom,
//                     { xPercent: -55 * dir, opacity: 0.35 },
//                     { xPercent: 0, opacity: 1, ease: "hop" },
//                     0
//                 );
//         });

//         // Cleanup when the breakpoint no longer matches
//         return () => {
//             el.classList.remove("sliced-active");
//             el.removeAttribute("aria-label");
//             el.textContent = text;
//         };
//     });
// })();


   function initTechStackLetters() {
    const lines = document.querySelectorAll('.tech-stack-line');
    if (!lines.length) return;

    lines.forEach(line => {
        const split = new SplitText(line, {
            type: "words, chars",
            charsClass: "tech-letter"
        });

        split.chars.forEach(char => {
            const text = char.textContent;
            char.innerHTML = `
                <span class="tech-letter-inner">${text}</span>
                <span class="tech-letter-dup" aria-hidden="true">${text}</span>
            `;
        });
    });

    const letters = gsap.utils.toArray('.tech-stack-heading .tech-letter');
    gsap.set(letters, { yPercent: 100 });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".tech-stack-inner",
            start: "top 60%",   // ← widened scroll range so the
            end: "top -20%",    //   longer timeline isn't rushed
            scrub: 1
        }
    });

    // Must be comfortably bigger than the longest possible duration,
    // or startAt has no room to vary (this was the bug above)
    const timelineLength = 6;

    letters.forEach(letter => {
        const duration = gsap.utils.random(2.35, 2.85);  // per-letter flip length
        const startAt  = gsap.utils.random(0, timelineLength - duration); // spread across the timeline

        tl.to(letter, {
            yPercent: 0,
            ease: "power2.out",
            duration
        }, startAt);
    });

    ScrollTrigger.refresh();
}

initTechStackLetters();

        

          let resizeTimer;
              window.addEventListener("resize", () => {
                  clearTimeout(resizeTimer);
                  resizeTimer = setTimeout(() => {
                     window.__revertHeroSplits?.(); 
                    lenis?.resize();
                    tickerRemeasurers.forEach(fn => fn());
                    ScrollTrigger.refresh();      // ← pins settle first
                    resizePhysics();              // ← then measure the container
                }, 200);
              });
  
  
});
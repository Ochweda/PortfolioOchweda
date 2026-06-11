# Its a Portfolio...my Portfolio

## Establishing Intent

A personal portfolio built as a single-page, scroll-driven experience. I built this with the intent of establishing myself not merely as just a Software Engineer but as a premium brand. The goal is to present Curtis Ochweda(the brand) as a Kenya-based, globally working Full Stack AI Engineer that believes in quality above all else. Many modern a poet has mused "Too big to fail", I personally prefer "Too good to fail".

## Design Process

The visual direction draws from swiss design that prioritizes function over form and is characterized by minimialism as the guiding axiom for engineering. Rather than thinking "what can we add?", lets think to ourselves "what can we remove?". Is everything on this page necessary? Swiss design borrows from 3 other crucial cultures that formed the direction that civilization would take in Europe in the 20th century namely: Russia, Germany and  

## Coding Process

The build is vanilla HTML, CSS, and JavaScript — no framework overhead. GSAP and Lenis are loaded from CDN so there is no bundler dependency for the animation runtime. `index.js` owns all animation and interaction logic. `style.css` owns all layout and visual tokens. The HTML is the single source of DOM truth. Each section was coded and animated in isolation before being integrated into the full scroll sequence.

---

## Components

### Navigation (`<nav>`)

<!-- Describe the sticky/fixed behaviour, the availability dot animation, and how the Case Studies / Get In Touch buttons behave on scroll and click -->

### Hero (`section.hero`)

<!-- Describe the entry animation sequence for the name, label row, role row, and scroll prompt. Cover the GSAP timeline, stagger values, and any scroll-linked pinning -->

### Intro / Image Window (`section.intro`)

<!-- Describe the clip-path or scale reveal on the portrait image, the desktop vs mobile container strategy, and any parallax applied to the image-wrapper -->

### About (`section.about`)

<!-- Describe the text reveal approach (line by line, word by word, or block), the about-image-slot placeholder plan, and the label animation -->

### Work (`section.work`)

<!-- Describe the work-list card layout, the hover state for card-media (image/video swap), the infinite-scroll tech ticker inside card-tech-wrap, and how the case study link routing works -->

### Services (`section.services`)

<!-- Describe the services grid or accordion, the items that will be listed, and any expand/collapse animation -->

### Outro (`section.outro`)

<!-- Describe the closing CTA, footer content, and any scroll-end pinning or looping animation -->

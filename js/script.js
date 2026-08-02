/**
 * M. Afiif Imanto — Portfolio interactions.
 *
 * Deliberately framework-free and served as a classic script rather than an ES
 * module: the page has to run from `file://` by opening index.html directly, and
 * module scripts are blocked by CORS on that protocol. Everything is scoped
 * inside one IIFE so nothing leaks to `window`.
 *
 * Contents
 *   01. Configuration & helpers
 *   02. Navigation (glass state, drawer, active link)
 *   03. Smooth scrolling
 *   04. Scroll reveal (IntersectionObserver)
 *   05. Hero video & role typewriter
 *   06. Statistic counters
 *   07. Skills accordion
 *   08. Hero parallax
 *   09. Button ripple
 *   10. Back to top
 *   11. Footer year
 */

(() => {
  "use strict";

  /* ======================================================================
     01. CONFIGURATION & HELPERS
     ====================================================================== */

  const SCROLL_THRESHOLD = 40; // px before the navbar turns to glass
  const TO_TOP_THRESHOLD = 600; // px before the back-to-top button appears
  const COUNTER_DURATION = 1400; // ms for the statistic count-up

  // Hero typewriter cadence, in ms
  const TYPE_SPEED = 62; // per character while typing
  const ERASE_SPEED = 32; // per character while erasing (deleting reads faster)
  const HOLD_AFTER_TYPE = 3000; // full role held on screen
  const HOLD_AFTER_ERASE = 420; // beat on the empty line before the next role

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /**
   * Query a single element.
   * @param {string} selector
   * @param {ParentNode} [scope]
   * @returns {Element|null}
   */
  const select = (selector, scope = document) => scope.querySelector(selector);

  /**
   * Query all matching elements as a real array.
   * @param {string} selector
   * @param {ParentNode} [scope]
   * @returns {Element[]}
   */
  const selectAll = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  /**
   * Run a callback at most once per animation frame — used for scroll handlers
   * so we never do layout work more often than the compositor can paint.
   * @param {Function} callback
   * @returns {Function}
   */
  const onNextFrame = (callback) => {
    let ticking = false;

    return (...args) => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        callback(...args);
        ticking = false;
      });
    };
  };

  /* ======================================================================
     02. NAVIGATION
     ====================================================================== */

  const nav = select("#nav");
  const navLinksWrap = select("#navLinks");
  const navBurger = select("#navBurger");
  const navLinks = selectAll(".nav__link");

  /** Toggle the frosted-glass navbar once the page has scrolled. */
  const updateNavState = () => {
    if (!nav) {
      return;
    }
    nav.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD);
  };

  /**
   * Open or close the mobile drawer.
   * @param {boolean} open
   */
  const setMenu = (open) => {
    if (!navLinksWrap || !navBurger) {
      return;
    }
    navLinksWrap.classList.toggle("is-open", open);
    navBurger.classList.toggle("is-open", open);
    navBurger.setAttribute("aria-expanded", String(open));
    navBurger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  if (navBurger) {
    navBurger.addEventListener("click", () => {
      setMenu(!navLinksWrap.classList.contains("is-open"));
    });
  }

  // Close the drawer after navigating, and on Escape.
  navLinks.forEach((link) =>
    link.addEventListener("click", () => setMenu(false)),
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
    }
  });

  /* Highlight the nav item for whichever section owns the viewport. */
  const sections = selectAll("main section[id]");

  if (sections.length > 0 && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${id}`,
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ======================================================================
     03. SMOOTH SCROLLING
     ====================================================================== */

  /*
   * `scroll-behavior: smooth` in CSS covers the animation; this handler only
   * exists to offset the landing position by the sticky navbar height and to
   * keep the URL hash tidy.
   */
  selectAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = select(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      const navHeight = nav ? nav.offsetHeight : 0;
      const top =
        target.getBoundingClientRect().top + window.scrollY - navHeight + 1;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      window.history.replaceState(null, "", targetId);
    });
  });

  /* ======================================================================
     04. SCROLL REVEAL
     ====================================================================== */

  const revealItems = selectAll(".reveal");

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    // No observer support (or motion is unwelcome): show everything immediately.
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // reveal once, then stop watching
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ======================================================================
     05. HERO VIDEO & ROLE TYPEWRITER
     ====================================================================== */

  /* A full-screen moving background is exactly what reduced-motion users are
     asking us not to play, so freeze it on its poster frame instead. */
  const heroVideo = select(".hero__video");

  if (heroVideo && prefersReducedMotion) {
    heroVideo.autoplay = false;
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  /*
   * Roles cycle one at a time: type in, hold, erase, next. The strings come from
   * the .roles__source list in the markup, which stays in the DOM for screen
   * readers — they get all three roles as plain text instead of a line that
   * rewrites itself every few seconds.
   */
  const rolesWrap = select(".roles");
  const typedSlot = select(".roles__typed");
  const caret = select(".roles__caret");
  const roles = selectAll(".roles__item").map((item) =>
    item.textContent.trim(),
  );

  /**
   * Resolve after a delay.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  /**
   * Type a string in, hold it, then erase it.
   * @param {string} role
   */
  const typeRole = async (role) => {
    caret.classList.remove("is-blinking");

    for (let i = 1; i <= role.length; i += 1) {
      typedSlot.textContent = role.slice(0, i);
      await wait(TYPE_SPEED);
    }

    // Hold the finished role, blinking the caret like an idle prompt.
    caret.classList.add("is-blinking");
    await wait(HOLD_AFTER_TYPE);
    caret.classList.remove("is-blinking");

    for (let i = role.length - 1; i >= 0; i -= 1) {
      typedSlot.textContent = role.slice(0, i);
      await wait(ERASE_SPEED);
    }

    await wait(HOLD_AFTER_ERASE);
  };

  /** Loop the roles forever, one full type/hold/erase cycle each. */
  const runTypewriter = async () => {
    let index = 0;

    while (true) {
      await typeRole(roles[index]);
      index = (index + 1) % roles.length;
    }
  };

  if (rolesWrap && typedSlot && caret && roles.length > 0) {
    if (prefersReducedMotion) {
      // No animation: show every role at once and drop the caret.
      rolesWrap.classList.add("roles--static");
      typedSlot.remove();
      caret.remove();
    } else {
      runTypewriter();
    }
  }

  /* ======================================================================
     06. STATISTIC COUNTERS
     ====================================================================== */

  /**
   * Count an element up to its target value.
   * @param {HTMLElement} element
   */
  const runCounter = (element) => {
    const target = Number(element.dataset.countTo);
    const suffix = element.dataset.suffix || "";

    if (Number.isNaN(target)) {
      return;
    }

    if (prefersReducedMotion) {
      element.textContent = `${target}${suffix}`;
      return;
    }

    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / COUNTER_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      element.textContent = `${Math.round(target * eased)}${suffix}`;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  const counters = selectAll("[data-count-to]");

  if (counters.length > 0 && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  /* ======================================================================
     07. SKILLS ACCORDION
     ====================================================================== */

  selectAll(".skill__head").forEach((head) => {
    head.addEventListener("click", () => {
      const panelId = head.getAttribute("aria-controls");
      const panel = panelId ? select(`#${panelId}`) : null;
      const card = head.closest(".skill");

      if (!panel) {
        return;
      }

      const isOpen = head.getAttribute("aria-expanded") === "true";

      head.setAttribute("aria-expanded", String(!isOpen));
      panel.classList.toggle("is-open", !isOpen);

      /* The grid locks every card to a shared height. `is-collapsed` releases
         this one from that stretch so the card itself shrinks to its header. */
      if (card) {
        card.classList.toggle("is-collapsed", isOpen);
      }
    });
  });

  /* ======================================================================
     08. HERO PARALLAX
     ====================================================================== */

  const parallaxItems = selectAll("[data-parallax]");
  const hero = select(".hero");
  const PARALLAX_MAX = 70; // px — never drift further than the hero's padding

  /**
   * Parallax only makes sense when the hero has slack around its content. On
   * narrow screens the stacked hero is taller than the viewport and every pixel
   * of drift pushes the copy into the hero's clipped bottom edge, so it is off.
   * @returns {boolean}
   */
  const heroHasRoomForParallax = () =>
    Boolean(hero) && hero.offsetHeight <= window.innerHeight + 1;

  let parallaxEnabled = heroHasRoomForParallax();

  /** Drift hero layers at slightly different rates while the hero is in view. */
  const updateParallax = () => {
    const offset = window.scrollY;

    if (!parallaxEnabled || offset > window.innerHeight) {
      return; // no slack to drift into, or the hero is off-screen
    }

    parallaxItems.forEach((item) => {
      const rate = Number(item.dataset.parallax) || 0;
      const shift = Math.max(
        -PARALLAX_MAX,
        Math.min(PARALLAX_MAX, offset * rate),
      );
      item.style.transform = `translate3d(0, ${shift}px, 0)`;
    });
  };

  /** Re-check on resize, and clear any transform left behind. */
  const resetParallax = () => {
    parallaxEnabled = heroHasRoomForParallax();

    if (!parallaxEnabled) {
      parallaxItems.forEach((item) => {
        item.style.transform = "";
      });
    }
  };

  window.addEventListener("resize", onNextFrame(resetParallax), {
    passive: true,
  });
  resetParallax();

  /* ======================================================================
     09. BUTTON RIPPLE
     ====================================================================== */

  selectAll("[data-ripple]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (prefersReducedMotion) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");

      ripple.className = "ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

      button.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });

  /* ======================================================================
     10. BACK TO TOP
     ====================================================================== */

  const toTop = select("#toTop");

  const updateToTop = () => {
    if (!toTop) {
      return;
    }
    toTop.classList.toggle("is-visible", window.scrollY > TO_TOP_THRESHOLD);
  };

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }

  /* ======================================================================
     SHARED SCROLL LISTENER
     One passive, frame-throttled handler drives every scroll-linked effect.
     ====================================================================== */

  const handleScroll = onNextFrame(() => {
    updateNavState();
    updateToTop();

    if (!prefersReducedMotion) {
      updateParallax();
    }
  });

  window.addEventListener("scroll", handleScroll, { passive: true });
  updateNavState();
  updateToTop();

  /* ======================================================================
     11. FOOTER YEAR
     ====================================================================== */

  const yearSlot = select("#year");

  if (yearSlot) {
    yearSlot.textContent = String(new Date().getFullYear());
  }
})();

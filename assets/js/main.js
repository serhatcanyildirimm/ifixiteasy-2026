const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const animatedElements = document.querySelectorAll(".reveal");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const observer = new IntersectionObserver(
  (entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        currentObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

animatedElements.forEach((element) => observer.observe(element));

const serviceSliderTrack = document.querySelector(".service-slider-track");

if (serviceSliderTrack) {
  const originalItems = Array.from(serviceSliderTrack.children);
  originalItems.forEach((item) => {
    serviceSliderTrack.appendChild(item.cloneNode(true));
  });

  let marqueePosition = 0;
  let marqueeRafId = 0;
  let marqueePaused = false;
  const marqueeSpeed = 0.26;

  const animateMarquee = () => {
    if (!marqueePaused) {
      marqueePosition += marqueeSpeed;
      const loopPoint = serviceSliderTrack.scrollWidth / 2;
      if (marqueePosition >= loopPoint) {
        marqueePosition = 0;
      }
      serviceSliderTrack.scrollLeft = marqueePosition;
    }
    marqueeRafId = window.requestAnimationFrame(animateMarquee);
  };

  serviceSliderTrack.addEventListener("mouseenter", () => {
    marqueePaused = true;
  });

  serviceSliderTrack.addEventListener("mouseleave", () => {
    marqueePaused = false;
  });

  serviceSliderTrack.addEventListener("touchstart", () => {
    marqueePaused = true;
  });

  serviceSliderTrack.addEventListener("touchend", () => {
    marqueePaused = false;
  });

  animateMarquee();
}

const premiumSlider = document.querySelector("#premium-slider");

if (premiumSlider) {
  const viewport = premiumSlider.querySelector(".slider-viewport");
  const track = premiumSlider.querySelector(".slider-track");
  const slides = Array.from(premiumSlider.querySelectorAll(".slider-slide"));
  const dotsWrap = premiumSlider.querySelector(".slider-dots");
  const prevButton = premiumSlider.querySelector(".slider-arrow-left");
  const nextButton = premiumSlider.querySelector(".slider-arrow-right");
  const heroMainTitle = document.querySelector("#hero-main-title");
  const heroLine1 = document.querySelector("#hero-line-1");
  const heroLine2 = document.querySelector("#hero-line-2");
  const heroLine3 = document.querySelector("#hero-line-3");
  const heroSubtext = document.querySelector("#hero-subtext");

  let slideSize = 0;
  let maxTranslate = 0;
  let currentTranslate = 0;
  let targetTranslate = 0;
  let pointerVelocity = 0;
  let isDragging = false;
  let lastX = 0;
  let activeIndex = 0;
  let rafId = 0;
  let settleTimeout = 0;
  let isTextAnimating = false;
  let queuedTextIndex = null;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider-dot";
    dot.setAttribute("aria-label", `Ga naar slide ${index + 1}`);
    dot.addEventListener("click", () => snapTo(index));
    dotsWrap?.appendChild(dot);
    return dot;
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const setTextByIndex = (index) => {
    const slide = slides[index];
    const line1 = slide.dataset.heroLineOne ?? "";
    const line2 = slide.dataset.heroLineTwo ?? "";
    const line3 = slide.dataset.heroLineThree ?? "";
    const subtext = slide.dataset.heroSubtext ?? "";

    if (heroMainTitle && heroLine1 && heroLine2 && heroLine3 && heroSubtext) {
      heroLine1.textContent = line1;
      heroLine2.textContent = line2;
      heroLine3.textContent = line3;
      heroSubtext.textContent = subtext;
    }
  };

  const transitionHeroText = async (index) => {
    if (!(heroMainTitle && heroSubtext)) {
      setTextByIndex(index);
      return;
    }

    queuedTextIndex = index;
    if (isTextAnimating) return;
    isTextAnimating = true;

    while (queuedTextIndex !== null) {
      const nextIndex = queuedTextIndex;
      queuedTextIndex = null;

      const outAnimations = [
        heroMainTitle.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-10px)" },
          ],
          { duration: 220, easing: "ease", fill: "forwards" }
        ),
        heroSubtext.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-10px)" },
          ],
          { duration: 220, easing: "ease", fill: "forwards" }
        ),
      ];

      await Promise.all(outAnimations.map((animation) => animation.finished));
      setTextByIndex(nextIndex);

      const inAnimations = [
        heroMainTitle.animate(
          [
            { opacity: 0, transform: "translateY(14px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 420, easing: "ease", fill: "forwards" }
        ),
        heroSubtext.animate(
          [
            { opacity: 0, transform: "translateY(14px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 420, easing: "ease", fill: "forwards" }
        ),
      ];

      await Promise.all(inAnimations.map((animation) => animation.finished));
    }

    isTextAnimating = false;
  };

  const updateMetrics = () => {
    if (!slides.length) return;
    slideSize = viewport.clientWidth;
    slides.forEach((slide) => {
      slide.style.width = `${slideSize}px`;
      slide.style.flexBasis = `${slideSize}px`;
    });
    const totalWidth = slideSize * slides.length;
    maxTranslate = Math.max(0, totalWidth - viewport.clientWidth);
    targetTranslate = clamp(targetTranslate, 0, maxTranslate);
    currentTranslate = clamp(currentTranslate, 0, maxTranslate);
  };

  const updateActiveSlide = () => {
    const center = currentTranslate + viewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = index * slideSize + slideSize / 2;
      const distance = Math.abs(slideCenter - center);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      activeIndex = closestIndex;
      transitionHeroText(activeIndex);
    }

    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeIndex);
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  const render = () => {
    currentTranslate += (targetTranslate - currentTranslate) * 0.075;
    if (Math.abs(targetTranslate - currentTranslate) < 0.18) {
      currentTranslate = targetTranslate;
    }
    track.style.transform = `translate3d(${-currentTranslate}px, 0, 0)`;
    updateActiveSlide();
    rafId = window.requestAnimationFrame(render);
  };

  const snapTo = (index) => {
    const centered = index * slideSize - (viewport.clientWidth - slideSize) / 2;
    targetTranslate = clamp(centered, 0, maxTranslate);
  };

  const scheduleSettleSnap = () => {
    window.clearTimeout(settleTimeout);
    settleTimeout = window.setTimeout(() => snapTo(activeIndex), 60);
  };

  const pointerDown = (clientX) => {
    isDragging = true;
    viewport.classList.add("is-dragging");
    lastX = clientX;
    pointerVelocity = 0;
    window.clearTimeout(settleTimeout);
  };

  const pointerMove = (clientX) => {
    if (!isDragging) return;
    const delta = clientX - lastX;
    lastX = clientX;
    pointerVelocity = delta;
    targetTranslate = clamp(targetTranslate - delta, 0, maxTranslate);
  };

  const pointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove("is-dragging");
    targetTranslate = clamp(targetTranslate - pointerVelocity * 1.8, 0, maxTranslate);
    scheduleSettleSnap();
  };

  viewport.addEventListener("mousedown", (event) => pointerDown(event.clientX));
  window.addEventListener("mousemove", (event) => pointerMove(event.clientX));
  window.addEventListener("mouseup", pointerUp);
  viewport.addEventListener("mouseleave", pointerUp);

  viewport.addEventListener("touchstart", (event) => {
    pointerDown(event.touches[0].clientX);
  });
  viewport.addEventListener("touchmove", (event) => {
    pointerMove(event.touches[0].clientX);
  });
  viewport.addEventListener("touchend", pointerUp);

  prevButton?.addEventListener("click", () => {
    snapTo(Math.max(0, activeIndex - 1));
  });

  nextButton?.addEventListener("click", () => {
    snapTo(Math.min(slides.length - 1, activeIndex + 1));
  });

  window.addEventListener("resize", () => {
    updateMetrics();
    snapTo(activeIndex);
  });

  updateMetrics();
  setTextByIndex(0);
  snapTo(0);
  render();
}

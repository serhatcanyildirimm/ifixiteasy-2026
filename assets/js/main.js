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

  navLinks.querySelectorAll("button.nav-text-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
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

const heroFadeSlider = document.querySelector("#hero-fade-slider");

if (heroFadeSlider) {
  const slides = Array.from(heroFadeSlider.querySelectorAll(".hero-fade-slide"));
  const dotsWrap = heroFadeSlider.querySelector(".hero-fade-dots");
  const heroMainTitle = document.querySelector("#hero-main-title");
  const heroLine1 = document.querySelector("#hero-line-1");
  const heroLine2 = document.querySelector("#hero-line-2");
  const heroLine3 = document.querySelector("#hero-line-3");
  const heroSubtext = document.querySelector("#hero-subtext");

  let activeIndex = 0;
  let autoplayPaused = false;
  let autoplayIntervalId = 0;
  const autoplayDelay = 4200;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-fade-dot";
    dot.setAttribute("aria-label", `Ga naar slide ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    dotsWrap?.appendChild(dot);
    return dot;
  });

  const setHeroTextByIndex = (index) => {
    const slide = slides[index];
    if (!slide) return;

    const line1 = slide.dataset.heroLineOne ?? "";
    const line2 = slide.dataset.heroLineTwo ?? "";
    const line3 = slide.dataset.heroLineThree ?? "";
    const subtext = slide.dataset.heroSubtext ?? "";

    if (heroMainTitle && heroLine1 && heroLine2 && heroLine3 && heroSubtext) {
      heroMainTitle.animate(
        [
          { opacity: 0.85, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 380, easing: "ease-out" }
      );
      heroSubtext.animate(
        [
          { opacity: 0.82, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 380, easing: "ease-out" }
      );

      heroLine1.textContent = line1;
      heroLine2.textContent = line2;
      heroLine3.textContent = line3;
      heroSubtext.textContent = subtext;
    }
  };

  function showSlide(index) {
    const normalizedIndex = (index + slides.length) % slides.length;
    activeIndex = normalizedIndex;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeIndex);
    });

    setHeroTextByIndex(activeIndex);
  }

  const startAutoplay = () => {
    if (slides.length < 2 || autoplayIntervalId) return;
    autoplayIntervalId = window.setInterval(() => {
      if (autoplayPaused) return;
      showSlide(activeIndex + 1);
    }, autoplayDelay);
  };

  const stopAutoplay = () => {
    if (!autoplayIntervalId) return;
    window.clearInterval(autoplayIntervalId);
    autoplayIntervalId = 0;
  };

  heroFadeSlider.addEventListener("mouseenter", () => {
    autoplayPaused = true;
  });

  heroFadeSlider.addEventListener("mouseleave", () => {
    autoplayPaused = false;
  });

  heroFadeSlider.addEventListener("touchstart", () => {
    autoplayPaused = true;
  });

  heroFadeSlider.addEventListener("touchend", () => {
    autoplayPaused = false;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
      return;
    }
    startAutoplay();
  });

  showSlide(0);
  startAutoplay();
}

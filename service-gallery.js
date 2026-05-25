(function () {
  const BASE = "assets/portfolio/";
  const INTERVAL_MS = 3000;

  const GALLERIES = {
    "service-architectural": [
      "img-16.png",
      "img-01.png",
      "img-12.png",
      "img-13.png",
      "img-14.png",
      "img-20.png",
      "img-24.png",
      "img-25.png",
      "img-28.png",
    ],
    "service-interior": ["img-05.png", "img-04.png", "img-27.png", "img-01.png"],
    "service-structural-drawings": ["img-02.png", "img-26.png", "img-23.png", "img-08.png"],
    "service-structural-reports": ["img-15.png", "img-22.png", "img-07.png", "img-23.png"],
    "service-bill-quantities": ["img-16.png", "img-02.png", "img-26.png"],
    "service-material-schedules": ["img-06.png", "img-08.png", "img-21.png", "img-07.png"],
    "service-construction": [
      "img-02.png",
      "img-26.png",
      "img-09.png",
      "img-10.png",
      "img-11.png",
      "img-15.png",
      "img-28.png",
    ],
    "service-electrical": ["img-18.png", "img-19.png", "img-17.png", "img-27.png", "img-05.png"],
    "service-plumbing": ["img-16.png", "img-04.png", "img-06.png", "img-13.png"],
    "service-compound": ["img-03.png", "img-04.png", "img-01.png", "img-08.png"],
  };

  const CARD_THUMBNAILS = {
    "service-architectural.html": "img-16.png",
    "service-interior.html": "img-05.png",
    "service-structural-drawings.html": "img-02.png",
    "service-structural-reports.html": "img-15.png",
    "service-bill-quantities.html": "img-16.png",
    "service-material-schedules.html": "img-06.png",
    "service-construction.html": "img-02.png",
    "service-electrical.html": "img-18.png",
    "service-plumbing.html": "img-04.png",
    "service-compound.html": "img-03.png",
  };

  function preloadImages(files) {
    files.forEach((file) => {
      const img = new Image();
      img.src = BASE + file;
    });
  }

  function initSlider(section) {
    const slides = section.querySelectorAll(".service-gallery-slide");
    const dots = section.querySelectorAll(".service-gallery-dot");
    let index = 0;
    let timer = null;

    function goTo(next) {
      if (!slides.length) return;

      slides[index]?.classList.remove("is-active");
      dots[index]?.classList.remove("is-active");

      index = (next + slides.length) % slides.length;

      slides[index]?.classList.add("is-active");
      dots[index]?.classList.add("is-active");
    }

    function next() {
      goTo(index + 1);
    }

    function startAutoplay() {
      if (slides.length < 2) return;
      stopAutoplay();
      timer = window.setInterval(next, INTERVAL_MS);
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    startAutoplay();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });
  }

  function buildOverlay() {
    const contentBlock = document.querySelector(".content-block");
    if (!contentBlock) return null;

    const overlay = document.createElement("div");
    overlay.className = "service-gallery-overlay";
    overlay.appendChild(contentBlock);
    return overlay;
  }

  function renderGallery(page) {
    const images = GALLERIES[page];
    if (!images?.length) return;

    const main = document.querySelector("main");
    if (!main) return;

    preloadImages(images);
    const overlay = buildOverlay();
    const hero = document.querySelector(".page-hero");

    const slides = images
      .map(
        (file, i) =>
          `<figure class="service-gallery-slide${i === 0 ? " is-active" : ""}"><img src="${BASE}${file}" alt="" loading="${i < 2 ? "eager" : "lazy"}" decoding="async"></figure>`
      )
      .join("");

    const dots = images
      .map(
        (_, i) =>
          `<span class="service-gallery-dot${i === 0 ? " is-active" : ""}" aria-hidden="true"></span>`
      )
      .join("");

    const section = document.createElement("section");
    section.className = "service-gallery service-gallery--fullscreen";
    section.setAttribute("aria-label", "Project slideshow");
    section.innerHTML = `
      <div class="service-gallery-slider" aria-roledescription="carousel" aria-live="off">
        <div class="service-gallery-viewport">
          <div class="service-gallery-track">${slides}</div>
          <div class="service-gallery-scrim" aria-hidden="true"></div>
        </div>
        <div class="service-gallery-dots">${dots}</div>
      </div>`;

    const viewport = section.querySelector(".service-gallery-viewport");
    if (overlay) viewport.appendChild(overlay);

    if (hero) {
      hero.insertAdjacentElement("afterend", section);
    } else {
      main.insertBefore(section, main.firstChild);
    }
    document.body.classList.add("has-service-showcase");

    initSlider(section);
  }

  function renderServiceCards() {
    document.querySelectorAll(".feature-card[href]").forEach((card) => {
      const href = card.getAttribute("href");
      const thumb = CARD_THUMBNAILS[href];
      if (!thumb || card.querySelector(".feature-card-media")) return;
      const media = document.createElement("div");
      media.className = "feature-card-media";
      media.innerHTML = `<img src="${BASE}${thumb}" alt="" loading="lazy">`;
      card.insertBefore(media, card.firstChild);
    });
  }

  const page = document.body.dataset.page || "";
  if (page === "services") {
    renderServiceCards();
    return;
  }
  renderGallery(page);
})();

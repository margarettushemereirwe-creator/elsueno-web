(function () {
  const MOBILE_BREAKPOINT = 768;
  const hoverMedia = window.matchMedia("(hover: hover) and (pointer: fine)");

  function isMobileNav() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function supportsHover() {
    return hoverMedia.matches && !isMobileNav();
  }

  function initNav() {
    const navToggle = document.querySelector(".nav-toggle");
    const siteNav = document.querySelector(".site-nav");
    const dropdowns = document.querySelectorAll(".nav-dropdown");
    const triggers = document.querySelectorAll(".nav-trigger");
    const navLinks = document.querySelectorAll(".nav-dropdown-menu a, .nav-cta");
    const form = document.getElementById("contact-form");
    const formNote = document.getElementById("form-note");
    const yearEl = document.getElementById("year");

    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    function closeAllDropdowns() {
      dropdowns.forEach((item) => {
        item.classList.remove("is-open");
        item.querySelector(".nav-trigger")?.setAttribute("aria-expanded", "false");
      });
    }

    function openDropdown(item) {
      closeAllDropdowns();
      item.classList.add("is-open");
      item.querySelector(".nav-trigger")?.setAttribute("aria-expanded", "true");
    }

    function closeNav() {
      navToggle?.classList.remove("is-active");
      siteNav?.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
      navToggle?.setAttribute("aria-label", "Open menu");
      closeAllDropdowns();
    }

    triggers.forEach((trigger) => {
      const item = trigger.closest(".nav-dropdown");

      trigger.addEventListener("click", (e) => {
        if (!isMobileNav()) return;
        e.preventDefault();
        e.stopPropagation();
        const isOpen = item.classList.contains("is-open");
        closeAllDropdowns();
        if (!isOpen) openDropdown(item);
      });
    });

    if (supportsHover()) {
      dropdowns.forEach((item) => {
        const trigger = item.querySelector(".nav-trigger");

        item.addEventListener("mouseenter", () => {
          trigger?.setAttribute("aria-expanded", "true");
        });

        item.addEventListener("mouseleave", () => {
          trigger?.setAttribute("aria-expanded", "false");
        });
      });
    }

    document.addEventListener("click", (e) => {
      if (isMobileNav() && !e.target.closest(".nav-dropdown")) {
        closeAllDropdowns();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllDropdowns();
        if (siteNav?.classList.contains("is-open")) closeNav();
      }
    });

    navToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = siteNav?.classList.toggle("is-open");
      navToggle.classList.toggle("is-active", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      if (!isOpen) closeAllDropdowns();
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeAllDropdowns();
        closeNav();
      });
    });

    window.addEventListener("resize", () => {
      if (!isMobileNav()) closeAllDropdowns();
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      formNote.className = "form-note";
      formNote.textContent = "";

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const data = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        projectType: form["project-type"].value,
        message: form.message.value,
      };

      try {
        if (window.QuoteAPI) {
          await QuoteAPI.submitQuote(data);
        } else {
          throw new Error("Quote form is not ready. Please refresh and try again.");
        }
        formNote.classList.add("success");
        formNote.textContent =
          "Thank you — your quote request was sent. We will contact you soon.";
        form.reset();
      } catch (err) {
        formNote.classList.add("error");
        formNote.textContent = err.message;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  initNav();
})();

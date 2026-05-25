(function () {
  const page = document.body.dataset.page || "";
  const isHome = page === "home";
  const BRAND = "El Sueño CSLT";

  const SERVICES = [
    { id: "service-architectural", file: "service-architectural.html", title: "Architectural Drawings" },
    { id: "service-interior", file: "service-interior.html", title: "Interior Design" },
    { id: "service-structural-drawings", file: "service-structural-drawings.html", title: "Structural Drawings" },
    { id: "service-structural-reports", file: "service-structural-reports.html", title: "Structural Reports" },
    { id: "service-bill-quantities", file: "service-bill-quantities.html", title: "Bill of Quantities" },
    { id: "service-material-schedules", file: "service-material-schedules.html", title: "Material Schedules" },
    { id: "service-construction", file: "service-construction.html", title: "Construction of House" },
    { id: "service-electrical", file: "service-electrical.html", title: "Electrical Works" },
    { id: "service-plumbing", file: "service-plumbing.html", title: "Plumbing Works" },
    { id: "service-compound", file: "service-compound.html", title: "Compound Design" },
  ];

  function navLink(href, label, pageId) {
    const active = page === pageId ? ' class="is-active"' : "";
    return `<li><a href="${href}"${active}>${label}</a></li>`;
  }

  function contactNavLink(sectionId, label) {
    const current = window.location.hash.slice(1) || "overview";
    const active = page === "contact" && current === sectionId ? ' class="is-active"' : "";
    const href = sectionId === "overview" ? "contact.html" : `contact.html#${sectionId}`;
    return `<li><a href="${href}"${active}>${label}</a></li>`;
  }

  function homeNavLink(sectionId, label) {
    const current = window.location.hash.slice(1) || "overview";
    const active = page === "home" && current === sectionId ? ' class="is-active"' : "";
    const href = sectionId === "overview" ? "index.html" : `index.html#${sectionId}`;
    return `<li><a href="${href}"${active}>${label}</a></li>`;
  }

  const serviceLinks = SERVICES.map((s) => navLink(s.file, s.title, s.id)).join("\n              ");

  const headerHtml = `
  <header class="site-header" id="top">
    <div class="container header-inner">
      <a href="index.html" class="logo">
        <img src="assets/logo.png" alt="El Sueño Consultants" class="logo-img" width="120" height="120">
      </a>
      <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">
        <span></span><span></span><span></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Main">
        <ul class="nav-list">
          <li class="nav-item nav-dropdown">
            <button type="button" class="nav-trigger" aria-expanded="false" aria-controls="dropdown-home">
              Home
              <svg class="nav-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
            <ul class="nav-dropdown-menu" id="dropdown-home">
              ${homeNavLink("overview", "Home Overview")}
              ${homeNavLink("welcome", "Welcome")}
              ${homeNavLink("services-preview", "Our Services")}
              ${homeNavLink("about", "About Us")}
              ${homeNavLink("contact-preview", "Get in Touch")}
            </ul>
          </li>
          <li class="nav-item nav-dropdown">
            <button type="button" class="nav-trigger" aria-expanded="false" aria-controls="dropdown-services">
              Services
              <svg class="nav-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
            <ul class="nav-dropdown-menu" id="dropdown-services">
              ${navLink("services.html", "All Services", "services")}
              ${serviceLinks}
            </ul>
          </li>
          <li class="nav-item nav-dropdown">
            <button type="button" class="nav-trigger" aria-expanded="false" aria-controls="dropdown-contact">
              Contact
              <svg class="nav-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
            <ul class="nav-dropdown-menu" id="dropdown-contact">
              ${contactNavLink("overview", "Get in Touch")}
              ${contactNavLink("location", "Location")}
              ${contactNavLink("reach", "Phone &amp; Email")}
            </ul>
          </li>
          <li class="nav-item">
            <a href="portal.html" class="nav-portal${page === "portal" ? " is-active" : ""}">Portal</a>
          </li>
          <li class="nav-item nav-item-cta">
            <a href="consultation.html" class="nav-cta${page === "consultation" ? " is-active" : ""}">Request a Quote</a>
          </li>
        </ul>
      </nav>
    </div>
  </header>`;

  const footerHtml = `
  <footer class="site-footer">
    <div class="container footer-inner">
      <a href="index.html" class="logo logo-footer">
        <img src="assets/logo.png" alt="El Sueño Consultants" class="logo-img" width="120" height="120">
      </a>
      <p class="footer-tagline">Architectural design, construction &amp; building services in Wakiso.</p>
      <p class="footer-contact">
        <a href="tel:+256771383933">+256 771 383933</a> ·
        <a href="mailto:elsuenocslt@gmail.com">elsuenocslt@gmail.com</a>
      </p>
      <p class="footer-copy">&copy; <span id="year"></span> ${BRAND}. All rights reserved. · <a href="admin.html" class="footer-admin-link">Admin</a></p>
    </div>
  </footer>`;

  const headerEl = document.getElementById("site-header");
  const footerEl = document.getElementById("site-footer");
  if (headerEl) headerEl.outerHTML = headerHtml;
  if (footerEl) footerEl.outerHTML = footerHtml;
  if (isHome) document.body.classList.add("page-home");
})();

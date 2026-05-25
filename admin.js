(function () {
  const TOKEN_KEY = "elsueno_admin_token";
  const loginEl = document.getElementById("admin-login");
  const appEl = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const quotesList = document.getElementById("quotes-list");
  const quotesEmpty = document.getElementById("quotes-empty");
  const quoteCount = document.getElementById("quote-count");
  const refreshBtn = document.getElementById("refresh-btn");
  const logoutBtn = document.getElementById("logout-btn");

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function showApp(loggedIn) {
    loginEl.hidden = loggedIn;
    appEl.hidden = !loggedIn;
  }

  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(path, { ...options, headers });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setToken(null);
      showApp(false);
      throw new Error("Session expired. Please sign in again.");
    }
    if (!res.ok) throw new Error(body.error || "Request failed.");
    return body;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString("en-UG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderQuotes(quotes) {
    quoteCount.textContent = `${quotes.length} request${quotes.length === 1 ? "" : "s"}`;
    quotesEmpty.hidden = quotes.length > 0;
    quotesList.innerHTML = "";

    quotes.forEach((q) => {
      const card = document.createElement("article");
      card.className = `quote-card${q.status === "new" ? " is-new" : ""}`;
      card.innerHTML = `
        <div class="quote-card-header">
          <div>
            <h2>${escapeHtml(q.name)}</h2>
            <p class="quote-meta">${formatDate(q.createdAt)}</p>
          </div>
          <span class="quote-badge ${q.status === "new" ? "" : "read"}">${q.status === "new" ? "New" : "Reviewed"}</span>
        </div>
        <p class="quote-detail"><strong>Email:</strong> <a href="mailto:${escapeHtml(q.email)}">${escapeHtml(q.email)}</a></p>
        ${q.phone ? `<p class="quote-detail"><strong>Phone:</strong> <a href="tel:${escapeHtml(q.phone.replace(/\s/g, ""))}">${escapeHtml(q.phone)}</a></p>` : ""}
        <p class="quote-detail"><strong>Service:</strong> ${escapeHtml(q.projectType)}</p>
        <div class="quote-message">${escapeHtml(q.message)}</div>
        <div class="quote-actions">
          ${q.status === "new" ? `<button type="button" class="btn btn-ghost-dark btn-sm" data-mark="${q.id}">Mark reviewed</button>` : ""}
          <button type="button" class="btn btn-ghost-dark btn-sm" data-delete="${q.id}">Delete</button>
        </div>
      `;
      quotesList.appendChild(card);
    });

    quotesList.querySelectorAll("[data-mark]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await api(`/api/quotes/${btn.dataset.mark}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "reviewed" }),
        });
        loadQuotes();
      });
    });

    quotesList.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this quote request?")) return;
        await api(`/api/quotes/${btn.dataset.delete}`, { method: "DELETE" });
        loadQuotes();
      });
    });
  }

  async function loadQuotes() {
    try {
      const quotes = await api("/api/quotes");
      renderQuotes(quotes);
    } catch (err) {
      alert(err.message);
    }
  }

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const password = document.getElementById("admin-password").value;

    try {
      const result = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      setToken(result.token);
      showApp(true);
      loadQuotes();
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  logoutBtn?.addEventListener("click", () => {
    setToken(null);
    showApp(false);
  });

  refreshBtn?.addEventListener("click", loadQuotes);

  if (getToken()) {
    showApp(true);
    loadQuotes();
  } else {
    showApp(false);
  }
})();

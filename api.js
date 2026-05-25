(function (global) {
  const API_BASE = "";

  function connectionHint() {
    if (global.location.protocol === "file:") {
      return "Open the site through the server: run npm start, then go to http://localhost:3000/consultation.html (do not open the HTML file directly).";
    }
    if (global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1") {
      return "Cannot reach the server. In the project folder run: npm start — then use http://localhost:3000/consultation.html";
    }
    return "Cannot reach the server. Check that the site is deployed and running (e.g. on Render).";
  }

  async function submitQuote(data) {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (_networkErr) {
      throw new Error(connectionHint());
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || "Could not send your request.");
    }
    return body;
  }

  global.QuoteAPI = { submitQuote };
})(window);

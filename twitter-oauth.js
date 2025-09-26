(function (global) {
  const DEFAULT_POPUP_FEATURES = "width=600,height=700,resizable=yes,scrollbars=yes";
  const DEFAULT_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes

  function assertRequired(value, name) {
    if (!value) {
      throw new Error(`${name} is required for Twitter OAuth start`);
    }
  }

  function buildStartUrl(baseUrl, username, botName, redirectUrl) {
    const params = new URLSearchParams({
      username,
      bot_name: botName,
    });
    if (redirectUrl) {
      params.set("redirect_url", redirectUrl);
    }
    return `${baseUrl}/auth/twitter/start?${params.toString()}`;
  }

  async function fetchAuthorizationUrl(url, fetchImpl) {
    const res = await (fetchImpl || fetch)(url, { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.detail || data?.error || res.statusText || "Unknown error";
      throw new Error(`Failed to start Twitter OAuth: ${detail}`);
    }
    if (!data.authorization_url) {
      throw new Error("Backend response missing authorization_url");
    }
    return data.authorization_url;
  }

  function openPopup(url, features, onBlocked) {
    const popup = window.open(url, "twitter-oauth", features || DEFAULT_POPUP_FEATURES);
    if (!popup || popup.closed) {
      if (typeof onBlocked === "function") {
        onBlocked();
      }
      throw new Error("Twitter authorization popup was blocked");
    }
    popup.focus?.();
    return popup;
  }

  function startMessageListener({ popup, timeoutMs, onSuccess, onError }) {
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      window.removeEventListener("message", handleMessage);
      poller && clearInterval(poller);
      popup && !popup.closed && popup.close();
      onError?.(new Error("Timed out waiting for Twitter OAuth to finish"));
    }, timeoutMs || DEFAULT_TIMEOUT_MS);

    function cleanup() {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
      poller && clearInterval(poller);
      if (popup && !popup.closed) {
        try { popup.close(); } catch (_) {}
      }
    }

    function handleMessage(event) {
      const data = event?.data || {};
      if (data.source !== "twitter-oauth") return;
      cleanup();
      onSuccess?.(data, event);
    }

    window.addEventListener("message", handleMessage);

    // Detect user closing the popup manually before completion
    const poller = setInterval(() => {
      if (!popup || popup.closed) {
        if (!finished) {
          cleanup();
          onError?.(new Error("Twitter OAuth window was closed before completion"));
        }
      }
    }, 750);

    return cleanup;
  }

  async function startTwitterOAuth(options) {
    const {
      apiBaseUrl,
      username,
      botName,
      redirectUrl,
      ensureUser,
      fetchImpl,
      popupFeatures,
      onPopupBlocked,
      timeoutMs,
    } = options || {};

    assertRequired(apiBaseUrl, "apiBaseUrl");
    assertRequired(username, "username");
    assertRequired(botName, "botName");

    if (typeof ensureUser === "function") {
      await ensureUser(username);
    }

    const startUrl = buildStartUrl(apiBaseUrl, username, botName, redirectUrl);
    const authorizationUrl = await fetchAuthorizationUrl(startUrl, fetchImpl);
    const popup = openPopup(authorizationUrl, popupFeatures, onPopupBlocked);

    return new Promise((resolve, reject) => {
      startMessageListener({
        popup,
        timeoutMs,
        onSuccess: (payload, event) => resolve({ payload, event }),
        onError: (err) => reject(err),
      });
    });
  }

  global.TwitterOAuth = {
    start: startTwitterOAuth,
  };
})(window);

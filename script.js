// ===== Drawer + Language (no HTML changes) =====
const menuBtn   = document.querySelector(".menu-btn");
const drawer    = document.querySelector(".drawer");
const backdrop  = document.querySelector(".drawer-backdrop");
const langHead  = document.getElementById("lang"); // header language select

let langDrawer;             
let closeBtn;               
let lastFocusedElement = null;

// Helper: create drawer header items if not present
function ensureDrawerControls() {
  if (!drawer) return;

  // 1) Close button (X)
  if (!drawer.querySelector(".drawer-close")) {
    closeBtn = document.createElement("button");
    closeBtn.className = "drawer-close";
    closeBtn.setAttribute("aria-label", "Close navigation");
    closeBtn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">close</span>';
    closeBtn.style.alignSelf = "flex-end";
    closeBtn.style.background = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.margin = "8px 8px 6px 8px";
    drawer.prepend(closeBtn);
    closeBtn.addEventListener("click", closeDrawer);
  }

  // 2) Language select inside drawer
  if (!drawer.querySelector("#lang-drawer")) {
    const wrapper = document.createElement("div");
    wrapper.className = "lang-switch";
    wrapper.style.padding = "8px";
    wrapper.style.borderTop = "1px solid #e5e7eb";
    wrapper.style.borderBottom = "1px solid #e5e7eb";
    wrapper.style.margin = "6px 0 8px";

    const label = document.createElement("label");
    label.textContent = "Language";
    label.setAttribute("for", "lang-drawer");
    label.style.display = "block";
    label.style.fontSize = "0.9rem";
    label.style.color = "#334155";
    label.style.marginBottom = "6px";

    langDrawer = document.createElement("select");
    langDrawer.id = "lang-drawer";
    langDrawer.innerHTML = `
      <option value="en">🇬🇧 EN</option>
      <option value="fr">🇫🇷 FR</option>
    `;
    langDrawer.style.width = "100%";

    wrapper.appendChild(label);
    wrapper.appendChild(langDrawer);

    const afterEl = drawer.querySelector(".drawer-close");
    if (afterEl && afterEl.nextSibling) {
      drawer.insertBefore(wrapper, afterEl.nextSibling);
    } else {
      drawer.prepend(wrapper);
    }

    if (langHead) langDrawer.value = langHead.value || "en";

    langDrawer.addEventListener("change", (e) => {
      const v = e.target.value;
      if (langHead) langHead.value = v;
      applyLanguage(v);
    });
  }
}

// Open/Close with accessibility + scroll lock
function openDrawer() {
  if (!drawer || !backdrop) return;
  ensureDrawerControls();

  lastFocusedElement = document.activeElement;
  drawer.classList.add("open");
  backdrop.classList.add("show");
  document.body.style.overflow = "hidden";

  const focusable = drawer.querySelector("button, select, a, [tabindex]:not([tabindex='-1'])");
  if (focusable) focusable.focus();
}

function closeDrawer() {
  if (!drawer || !backdrop) return;
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
  document.body.style.overflow = "";

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

// ✅ Toggle on menuBtn click
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    if (drawer.classList.contains("open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });
}
if (backdrop) backdrop.addEventListener("click", closeDrawer);

// Close on drawer link click
if (drawer) {
  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });
}

// Close on Escape + focus trap
document.addEventListener("keydown", (e) => {
  if (!drawer || !drawer.classList.contains("open")) return;

  if (e.key === "Escape") {
    e.preventDefault();
    closeDrawer();
  } else if (e.key === "Tab") {
    const focusables = drawer.querySelectorAll("button, select, a, [tabindex]:not([tabindex='-1'])");
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Close drawer when switching to desktop width
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeDrawer();
});
// ===== Language (header select) =====
async function applyLanguage(lang) {
  try {
    // Load JSON file dynamically (e.g. assets/i18n/en.json)
    const response = await fetch(`assets/i18n/${lang}.json`);
    const translations = await response.json();

    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = key.split('.').reduce((o, i) => (o ? o[i] : null), translations);
      if (value) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = value;
        } else {
          el.innerHTML = value;
        }
      }
    });

    // Keep header + drawer selects in sync
    if (langHead && langHead.value !== lang) langHead.value = lang;
    if (langDrawer && langDrawer.value !== lang) langDrawer.value = lang;

    // Save preference
    localStorage.setItem("lang", lang);
  } catch (err) {
    console.error(`Error loading language "${lang}"`, err);
  }
}

// Initialize language from localStorage or default
const savedLang = localStorage.getItem("lang") || "en";
applyLanguage(savedLang);

// Change on header select
if (langHead) {
  langHead.addEventListener("change", e => {
    applyLanguage(e.target.value);
  });
}

// Change on drawer select (if it exists)
if (langDrawer) {
  langDrawer.addEventListener("change", e => {
    applyLanguage(e.target.value);
  });
}
/* === Demo Modal === */
(function () {
  const modal = document.getElementById("demoModal");
  const backdrop = document.getElementById("demoModalBackdrop");
  const closeBtn = modal?.querySelector(".modal-close");
  const cancelBtn = document.getElementById("demoCancel");
  const form = document.getElementById("demoForm");
  const tabKyc = document.getElementById("tab-kyc");
  const tabKyb = document.getElementById("tab-kyb");
  const switcher = modal?.querySelector(".mode-switch");

  let lastFocus = null;
  let mode = "kyc";

  // Helper: translation getter
  function t(path, fallback = "") {
    const dict = window.__i18n || {};
    return path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), dict) ?? fallback;
  }

  // Openers: catch ANY element pointing to "#demo"
  document.querySelectorAll('a[href="#demo"], [data-open="demo"]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  function openModal() {
    if (!modal || !backdrop) return;
    lastFocus = document.activeElement;

    setMode(mode);

    backdrop.hidden = false;
    backdrop.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const firstField = modal.querySelector("input, textarea, button");
    if (firstField) firstField.focus();

    document.body.style.overflow = "hidden";
    backdrop.addEventListener("click", closeModal, { once: true });
  }

  function closeModal() {
    if (!modal || !backdrop) return;
    modal.setAttribute("aria-hidden", "true");
    backdrop.classList.remove("show");
    setTimeout(() => { backdrop.hidden = true; }, 200);
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function setMode(nextMode) {
    mode = nextMode;
    if (!switcher) return;
    switcher.dataset.mode = mode;

    tabKyc.classList.toggle("is-active", mode === "kyc");
    tabKyb.classList.toggle("is-active", mode === "kyb");
    tabKyc.setAttribute("aria-selected", String(mode === "kyc"));
    tabKyb.setAttribute("aria-selected", String(mode === "kyb"));

    modal.querySelectorAll(".form-group").forEach(g => {
      const isTarget = g.getAttribute("data-group") === mode;
      g.hidden = !isTarget;
      g.querySelectorAll("[name]").forEach(input => {
        if (mode === "kyc") {
          if (input.name === "firstName" || input.name === "lastName") input.required = true;
          if (input.name === "company") input.required = false;
        } else {
          if (input.name === "company") input.required = true;
          if (input.name === "firstName" || input.name === "lastName") input.required = false;
        }
      });
    });
  }

  tabKyc?.addEventListener("click", () => setMode("kyc"));
  tabKyb?.addEventListener("click", () => setMode("kyb"));
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    const isOpen = modal?.getAttribute("aria-hidden") === "false";
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
    } else if (e.key === "Tab") {
      const focusables = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Validation with i18n
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    modal.querySelectorAll(".field-msg").forEach(p => p.textContent = "");

    const err = (id, msgKey) => {
      const p = modal.querySelector(`.field-msg[data-for="${id}"]`);
      if (p) p.textContent = t(`modal.errors.${msgKey}`);
    };

    let valid = true;
    const email = form.email;
    if (!email.value || !/^\S+@\S+\.\S+$/.test(email.value)) {
      err("demoEmail", "emailInvalid");
      valid = false;
    }

    if (mode === "kyc") {
      if (!form.firstName.value.trim()) { err("firstName", "firstNameRequired"); valid = false; }
      if (!form.lastName.value.trim())  { err("lastName",  "lastNameRequired");  valid = false; }
    } else {
      if (!form.company.value.trim())   { err("company",   "companyRequired");   valid = false; }
    }

    if (!valid) return;

    const payload = mode === "kyc"
      ? { type: "KYC", data: {
          email: form.email.value.trim(),
          firstName: form.firstName.value.trim(),
          lastName: form.lastName.value.trim(),
          country: form.country.value.trim(),
        } }
      : { type: "KYB", data: {
          email: form.email.value.trim(),
          company: form.company.value.trim(),
          description: form.desc.value.trim(),
        } };

    const btn = form.querySelector(".btn-primary");
    const submitLabel = t("modal.buttons.submit");
    btn.textContent = t("modal.buttons.submitting", "Submitting…");
    btn.disabled = true;

    try {
      const res = await fetch("https://devel.ravenkyc.com/api/identity/book-demo/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      btn.textContent = t("modal.buttons.success", "Submitted ✓");
      setTimeout(closeModal, 700);
    } catch (err) {
      alert(t("modal.errors.submitFailed", "There was an error sending your request. Please try again."));
      btn.textContent = submitLabel;
      btn.disabled = false;
    }
  });
})();

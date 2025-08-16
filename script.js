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
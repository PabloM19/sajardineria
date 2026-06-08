(function () {
  "use strict";

  var PAUSE_MS = 6500;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $all(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function initLucide() {
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons();
    }
  }
  initLucide();

  /* Header: sombra al scroll + logo claro/oscuro sobre hero */
  var header = document.querySelector("[data-header]");
  var logoImg = header ? header.querySelector(".header__logo-img") : null;
  var logoSwap = header && header.hasAttribute("data-logo-swap");
  var logoSwapMode = header ? header.getAttribute("data-logo-swap-mode") : null;
  var LOGO_DARK = "logo.png";
  var LOGO_LIGHT = "logo-blanco.png";
  var gardenLogoMq = window.matchMedia("(min-width: 900px)");

  function resolveLogoSrc(scrolled) {
    if (logoSwapMode === "garden") {
      if (gardenLogoMq.matches) return LOGO_DARK;
      return scrolled ? LOGO_DARK : LOGO_LIGHT;
    }
    if (logoSwap) return scrolled ? LOGO_DARK : LOGO_LIGHT;
    return null;
  }

  function onScrollHeader() {
    if (!header) return;
    var scrolled = window.scrollY > 24;
    header.classList.toggle("is-scrolled", scrolled);
    if (logoSwap && logoImg) {
      var nextLogo = resolveLogoSrc(scrolled);
      if (nextLogo) logoImg.src = nextLogo;
    }
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  if (logoSwapMode === "garden" && gardenLogoMq.addEventListener) {
    gardenLogoMq.addEventListener("change", onScrollHeader);
  }

  /* Menú móvil (panel + foco + Escape) */
  var toggle = document.getElementById("nav-toggle");
  var panel = document.getElementById("mobile-panel");
  var backdrop = document.getElementById("mobile-backdrop");
  var closeBtn = document.getElementById("mobile-close");

  function setMenuOpen(open) {
    if (!panel || !toggle) return;
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
    document.body.classList.toggle("menu-open", open);
    if (open) {
      var first = panel.querySelector("a");
      if (first) window.setTimeout(function () { first.focus(); }, 320);
    } else {
      toggle.focus();
    }
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      setMenuOpen(!panel.classList.contains("is-open"));
    });
    if (backdrop) {
      backdrop.addEventListener("click", function () { setMenuOpen(false); });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () { setMenuOpen(false); });
    }
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenuOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        setMenuOpen(false);
      }
    });
  }

  /* Carrusel hero + barra de progreso sincronizada */
  var carousel = document.querySelector("[data-carousel]");
  var slides = $all(".hero__slide", carousel);
  var prevBtn = $(".hero__arrow--prev", carousel);
  var nextBtn = $(".hero__arrow--next", carousel);
  var dotsWrap = $(".hero__dots", carousel);
  var progressBar = $(".hero__progress-bar", carousel);
  var index = 0;
  var timerId = null;
  var progressTimer = null;

  function clearTimers() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    if (progressTimer !== null) {
      window.clearTimeout(progressTimer);
      progressTimer = null;
    }
  }

  function runProgress() {
    if (!progressBar || reduceMotion) {
      if (progressBar) progressBar.style.width = "100%";
      return;
    }
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    progressTimer = window.setTimeout(function () {
      progressBar.style.transition = "width " + PAUSE_MS + "ms linear";
      progressBar.getBoundingClientRect();
      progressBar.style.width = "100%";
    }, 40);
  }

  function show(i, runBar) {
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    slides.forEach(function (slide, j) {
      slide.classList.toggle("is-active", j === index);
    });
    if (dotsWrap) {
      $all(".hero__dot", dotsWrap).forEach(function (dot, j) {
        dot.setAttribute("aria-selected", j === index ? "true" : "false");
      });
    }
    if (runBar !== false) {
      runProgress();
    }
  }

  function next() {
    show(index + 1);
  }

  function prev() {
    show(index - 1);
  }

  function startAuto() {
    clearTimers();
    if (!slides.length) return;
    runProgress();
    timerId = window.setInterval(function () {
      next();
    }, PAUSE_MS);
  }

  function stopAuto() {
    clearTimers();
    if (progressBar && !reduceMotion) {
      progressBar.style.transition = "none";
      var w = progressBar.getBoundingClientRect().width;
      var parentW = progressBar.parentElement.getBoundingClientRect().width;
      progressBar.style.width = parentW ? (w / parentW * 100) + "%" : "0%";
    }
  }

  if (carousel && slides.length) {
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Diapositiva " + (i + 1) + " de " + slides.length);
        dot.addEventListener("click", function () {
          show(i);
          startAuto();
        });
        dotsWrap.appendChild(dot);
      });
    }
    show(0, false);
    startAuto();

    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); startAuto(); });

    carousel.addEventListener("mouseenter", stopAuto);
    carousel.addEventListener("mouseleave", startAuto);
    carousel.addEventListener("focusin", stopAuto);
    carousel.addEventListener("focusout", function (e) {
      if (!carousel.contains(e.relatedTarget)) startAuto();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto();
      else startAuto();
    });
  }

  /* Scroll reveal */
  var revealEls = $all("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window) {
    var revObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revObs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) { revObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Garden: cierre al elegir enlace + táctil sin hover */
  var navDd = document.querySelector("[data-nav-dropdown]");
  var navDdBtn = document.querySelector("[data-nav-garden-trigger]");
  var mqHoverFine = window.matchMedia("(hover: hover) and (min-width: 1100px)");
  var mqHoverNoneWide = window.matchMedia("(hover: none) and (min-width: 1100px)");

  function closeGardenDd() {
    if (!navDd || !navDdBtn) return;
    navDd.classList.remove("is-open");
    navDdBtn.setAttribute("aria-expanded", "false");
  }

  function openGardenDd() {
    if (!navDd || !navDdBtn) return;
    navDd.classList.add("is-open");
    navDdBtn.setAttribute("aria-expanded", "true");
  }

  if (navDd && navDdBtn) {
    navDdBtn.addEventListener("click", function (e) {
      if (!mqHoverNoneWide.matches) return;
      e.preventDefault();
      e.stopPropagation();
      if (navDd.classList.contains("is-open")) {
        closeGardenDd();
      } else {
        openGardenDd();
      }
    });
    $all(".nav-dd__panel a", navDd).forEach(function (a) {
      a.addEventListener("click", function () {
        closeGardenDd();
      });
    });
    document.addEventListener("click", function (e) {
      if (!navDd || navDd.contains(e.target)) return;
      closeGardenDd();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeGardenDd();
    });
  }

  /* Navegación activa por sección */
  var navLinks = $all("[data-nav-link]");
  var gardenDdEl = document.querySelector("[data-nav-dropdown]");
  var isGardenPage =
    document.body.classList.contains("page-garden") ||
    document.body.classList.contains("page-category") ||
    /garden\.html$/i.test(window.location.pathname) ||
    /cactuario\.html$/i.test(window.location.pathname);
  var sectionIds = [
    "experiencia",
    "quienes-somos",
    "garden",
    "garden-intro",
    "garden-temporada",
    "garden-autoctonas",
    "garden-cactuario",
    "garden-bonsais",
    "garden-orquideario",
    "garden-interior",
    "garden-macetas",
    "garden-antiguedades",
    "tienda",
    "eventos"
  ];
  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  function clearNavCurrent() {
    navLinks.forEach(function (a) {
      a.removeAttribute("aria-current");
    });
    if (gardenDdEl) gardenDdEl.classList.remove("is-nav-active");
    var contactCtaClear = document.querySelector("[data-nav-contact]");
    if (contactCtaClear) contactCtaClear.removeAttribute("aria-current");
  }

  function setGardenNavActive() {
    clearNavCurrent();
    if (gardenDdEl) gardenDdEl.classList.add("is-nav-active");
  }

  function hrefMatchesSection(href, id) {
    if (!href || !id) return false;
    if (href === "#" + id) return true;
    var hashIdx = href.indexOf("#");
    if (hashIdx === -1) return false;
    return href.slice(hashIdx + 1) === id;
  }

  var isEventPage =
    document.body.classList.contains("page-event") ||
    /evento-/.test(window.location.pathname);

  if (isEventPage) {
    clearNavCurrent();
    navLinks.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (/#eventos$/i.test(href) || href.indexOf("#eventos") !== -1) {
        a.setAttribute("aria-current", "page");
      }
    });
  }

  var isShopPage =
    document.body.classList.contains("page-shop") ||
    /tienda\.html$/i.test(window.location.pathname);

  if (isShopPage) {
    clearNavCurrent();
    navLinks.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (/tienda\.html$/i.test(href)) {
        a.setAttribute("aria-current", "page");
      }
    });
  }

  if (isGardenPage && gardenDdEl) {
    setGardenNavActive();
  }

  if ((navLinks.length || gardenDdEl) && sections.length && "IntersectionObserver" in window) {
    var navObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          clearNavCurrent();
          if (id === "garden" || id.indexOf("garden-") === 0) {
            setGardenNavActive();
          } else {
            navLinks.forEach(function (a) {
              if (hrefMatchesSection(a.getAttribute("href"), id)) {
                a.setAttribute("aria-current", "page");
              }
            });
          }
        });
      },
      { rootMargin: "-38% 0px -48% 0px", threshold: 0 }
    );
    sections.forEach(function (sec) {
      navObs.observe(sec);
    });
  }

  /* Galería Instantes: arrastre horizontal; listeners en document para no perder el gesto fuera del rail */
  var rail = document.querySelector("[data-rail]");
  if (rail) {
    var activePid = null;
    var suppressClick = false;

    function snapRailEnd() {
      var items = rail.querySelectorAll(".gallery-rail__item");
      if (!items.length) return;
      var step;
      if (items.length > 1) {
        step = items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
      } else {
        step = items[0].getBoundingClientRect().width;
      }
      if (step <= 0) return;
      var maxScroll = rail.scrollWidth - rail.clientWidth;
      var i = Math.round(rail.scrollLeft / step);
      var target = Math.min(Math.max(0, i * step), Math.max(0, maxScroll));
      if (reduceMotion) {
        rail.scrollLeft = target;
      } else {
        rail.scrollTo({ left: target, behavior: "smooth" });
      }
    }

    rail.addEventListener(
      "pointerdown",
      function (e) {
        if (activePid !== null) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        activePid = e.pointerId;
        var startX = e.clientX;
        var startScroll = rail.scrollLeft;
        var moved = false;

        rail.classList.add("is-dragging");

        function onMove(ev) {
          if (ev.pointerId !== activePid) return;
          var dx = ev.clientX - startX;
          if (Math.abs(dx) > 2) moved = true;
          rail.scrollLeft = startScroll - dx;
          ev.preventDefault();
        }

        function onUp(ev) {
          if (ev.pointerId !== activePid) return;
          document.removeEventListener("pointermove", onMove, true);
          document.removeEventListener("pointerup", onUp, true);
          document.removeEventListener("pointercancel", onUp, true);
          rail.classList.remove("is-dragging");
          activePid = null;
          if (moved) {
            suppressClick = true;
            snapRailEnd();
          }
        }

        document.addEventListener("pointermove", onMove, { passive: false, capture: true });
        document.addEventListener("pointerup", onUp, true);
        document.addEventListener("pointercancel", onUp, true);
      },
      { passive: true }
    );

    rail.addEventListener(
      "click",
      function (e) {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      },
      true
    );
  }

  /* ——— Página Contacto (simplificada) ——— */
  var contactTopicRoot = document.querySelector("[data-contact-topic]");
  if (contactTopicRoot) {
    var contactCfg = {
      phone: document.body.dataset.contactPhone || "",
      whatsapp: document.body.dataset.contactWhatsapp || "",
      email: document.body.dataset.contactEmail || "",
      schedule: document.body.dataset.contactSchedule || "",
      maps: document.body.dataset.contactMaps || ""
    };
    var MAPS_FALLBACK =
      "https://www.google.com/maps/place/Sa+Jardiner%C3%ADa+-+Mallorca+Garden+Center/@39.6492027,2.6424925,17z";

    function isContactPlaceholder(val) {
      return !val || /^\[[A-ZÁÉÍÓÚ_]+\]$/i.test(String(val).trim());
    }

    var mapsUrl = isContactPlaceholder(contactCfg.maps) ? MAPS_FALLBACK : contactCfg.maps;
    $all("[data-contact-maps-btn]").forEach(function (a) {
      a.href = mapsUrl;
    });

    if (!isContactPlaceholder(contactCfg.whatsapp)) {
      var waCard = document.querySelector("[data-contact-whatsapp-card]");
      var waBtn = document.querySelector("[data-contact-whatsapp-btn]");
      if (waCard) waCard.hidden = false;
      if (waBtn) waBtn.href = contactCfg.whatsapp;
    }

    if (!isContactPlaceholder(contactCfg.phone)) {
      var phoneCard = document.querySelector("[data-contact-phone-card]");
      var phoneBtn = document.querySelector("[data-contact-phone-btn]");
      if (phoneCard) phoneCard.hidden = false;
      if (phoneBtn) phoneBtn.href = "tel:" + contactCfg.phone.replace(/\s/g, "");
    }

    var sendBtn = contactTopicRoot.querySelector("[data-contact-send-btn]");
    var callBtn = contactTopicRoot.querySelector("[data-contact-call-btn]");
    var canWhatsApp = !isContactPlaceholder(contactCfg.whatsapp);
    var canEmail = !isContactPlaceholder(contactCfg.email);
    var canPhone = !isContactPlaceholder(contactCfg.phone);

    if (sendBtn && (canWhatsApp || canEmail)) {
      sendBtn.hidden = false;
      sendBtn.textContent = canWhatsApp ? "Enviar consulta" : "Enviar email";
    }

    if (callBtn && canPhone) {
      callBtn.hidden = false;
      callBtn.href = "tel:" + contactCfg.phone.replace(/\s/g, "");
    }

    if (!isContactPlaceholder(contactCfg.schedule)) {
      var schedWrap = document.querySelector("[data-contact-schedule-wrap]");
      var schedDisplay = document.querySelector("[data-contact-schedule-display]");
      if (schedWrap) schedWrap.hidden = false;
      if (schedDisplay) schedDisplay.textContent = contactCfg.schedule;
    }

    var topicLabels = {
      planta: "Una planta",
      terraza: "Mi terraza o jardín",
      interior: "Plantas de interior",
      macetas: "Macetas",
      eventos: "Eventos",
      otra: "Otra consulta"
    };

    var topicForms = {
      planta: {
        title: "Trae o envía fotos claras",
        text: "Ayuda mucho ver la planta entera, un detalle de las hojas y saber cada cuánto la riegas.",
        tips: [
          "Foto clara con luz natural",
          "Indica si está en interior o exterior",
          "Cuéntanos desde cuándo la tienes"
        ],
        fields: [
          {
            type: "radio",
            name: "motivo",
            legend: "¿Qué necesitas?",
            options: [
              { value: "identificar", label: "Identificar la planta" },
              { value: "cuidado", label: "Consejo de cuidado" },
              { value: "problema", label: "Problema (hojas, riego…)" },
              { value: "similar", label: "Buscar planta similar" }
            ]
          },
          {
            type: "checkbox",
            name: "compartir",
            legend: "¿Qué puedes compartir?",
            options: [
              { value: "foto-general", label: "Foto de la planta entera" },
              { value: "detalle-hojas", label: "Detalle de hojas o tallo" },
              { value: "maceta", label: "Maceta y sustrato" },
              { value: "riego", label: "Cuánto riego (aprox.)" }
            ]
          },
          {
            type: "textarea",
            name: "notas",
            legend: "Algo más",
            placeholder: "Ubicación, desde cuándo la tienes, qué te preocupa…"
          }
        ]
      },
      terraza: {
        title: "La luz manda",
        text: "Una foto del espacio, orientación de sol y medidas aproximadas nos ayudan a recomendar mejor.",
        tips: [
          "Foto del espacio desde donde se ve bien la luz",
          "Orientación aproximada del sol",
          "Medidas si tienes un hueco concreto"
        ],
        fields: [
          {
            type: "radio",
            name: "espacio",
            legend: "¿Qué espacio es?",
            options: [
              { value: "terraza", label: "Terraza" },
              { value: "jardin", label: "Jardín" },
              { value: "patio", label: "Patio" },
              { value: "balcon", label: "Balcón" }
            ]
          },
          {
            type: "radio",
            name: "luz",
            legend: "¿Cuánta luz recibe?",
            options: [
              { value: "sol", label: "Sol directo" },
              { value: "media", label: "Luz media" },
              { value: "sombra", label: "Sombra" }
            ]
          },
          {
            type: "checkbox",
            name: "busco",
            legend: "¿Qué buscas?",
            options: [
              { value: "nuevas", label: "Plantas nuevas" },
              { value: "sustituir", label: "Sustituir las actuales" },
              { value: "macetas", label: "Composición en macetas" },
              { value: "consejo", label: "Consejo general" }
            ]
          },
          {
            type: "textarea",
            name: "notas",
            legend: "Detalles del espacio",
            placeholder: "Medidas, orientación, plantas actuales…"
          }
        ]
      },
      interior: {
        title: "Enséñanos el rincón",
        text: "Para interior, lo más importante es saber cuánta luz natural recibe el espacio durante el día.",
        tips: [
          "Foto del rincón donde irá la planta",
          "Ventana cercana y horas de sol",
          "Si hay calefacción o aire cerca"
        ],
        fields: [
          {
            type: "radio",
            name: "estancia",
            legend: "¿En qué estancia?",
            options: [
              { value: "salon", label: "Salón" },
              { value: "dormitorio", label: "Dormitorio" },
              { value: "bano", label: "Baño" },
              { value: "oficina", label: "Oficina" },
              { value: "otra", label: "Otra" }
            ]
          },
          {
            type: "radio",
            name: "luz",
            legend: "¿Cuánta luz natural hay?",
            options: [
              { value: "mucha", label: "Mucha luz" },
              { value: "media", label: "Luz media" },
              { value: "poca", label: "Poca luz" }
            ]
          },
          {
            type: "checkbox",
            name: "prioridad",
            legend: "¿Qué te importa?",
            options: [
              { value: "facil", label: "Fácil mantenimiento" },
              { value: "decorativa", label: "Toque decorativo" },
              { value: "pet", label: "Mascotas en casa" },
              { value: "varias", label: "Varias plantas" }
            ]
          },
          {
            type: "textarea",
            name: "notas",
            legend: "Describe el rincón",
            placeholder: "Tamaño, estilo, plantas que ya tienes…"
          }
        ]
      },
      macetas: {
        title: "Medida y drenaje",
        text: "Si buscas maceta, trae la medida aproximada de la planta o del hueco donde irá colocada.",
        tips: [
          "Diámetro aproximado de la planta o del hueco",
          "Si necesitas plato o buen drenaje",
          "Estilo o material que te gusta"
        ],
        fields: [
          {
            type: "radio",
            name: "para",
            legend: "¿Para qué la necesitas?",
            options: [
              { value: "planta", label: "Una planta concreta" },
              { value: "hueco", label: "Hueco decorativo" },
              { value: "composicion", label: "Composición" },
              { value: "regalo", label: "Regalo" }
            ]
          },
          {
            type: "radio",
            name: "tamano",
            legend: "¿Qué tamaño buscas?",
            options: [
              { value: "pequena", label: "Pequeña" },
              { value: "mediana", label: "Mediana" },
              { value: "grande", label: "Grande" },
              { value: "nsnc", label: "No lo sé" }
            ]
          },
          {
            type: "checkbox",
            name: "interes",
            legend: "¿Qué te interesa?",
            options: [
              { value: "ceramica", label: "Cerámica" },
              { value: "barro", label: "Barro" },
              { value: "diseno", label: "Diseño" },
              { value: "drenaje", label: "Drenaje y plato" }
            ]
          },
          {
            type: "textarea",
            name: "notas",
            legend: "Medidas o detalles",
            placeholder: "Centímetros aproximados, color, estilo…"
          }
        ]
      },
      eventos: {
        title: "Pregunta por próximas actividades",
        text: "Puedes consultar talleres, encuentros o actividades del Garden si están disponibles.",
        tips: [
          "Indica si vienes solo o en grupo",
          "Pregunta por fechas próximas",
          "Cuéntanos qué tipo de actividad te interesa"
        ],
        fields: [
          {
            type: "checkbox",
            name: "tipo",
            legend: "¿Qué te interesa?",
            options: [
              { value: "taller", label: "Taller" },
              { value: "encuentro", label: "Encuentro" },
              { value: "familiar", label: "Actividad familiar" },
              { value: "visita", label: "Visita guiada" }
            ]
          },
          {
            type: "radio",
            name: "cuando",
            legend: "¿Cuándo te gustaría?",
            options: [
              { value: "proximas", label: "Próximas fechas" },
              { value: "mes", label: "Este mes" },
              { value: "info", label: "Solo información" }
            ]
          },
          {
            type: "textarea",
            name: "notas",
            legend: "Tu pregunta",
            placeholder: "Personas, fechas, tipo de actividad…"
          }
        ]
      },
      otra: {
        title: "Cuéntanos lo que necesitas",
        text: "Si no encaja en ninguna categoría, escríbenos o ven directamente al Garden.",
        tips: [
          "Sé breve pero concreto",
          "Si puedes, adjunta una foto",
          "También puedes venir sin tenerlo todo claro"
        ],
        fields: [
          {
            type: "radio",
            name: "preferencia",
            legend: "¿Cómo prefieres continuar?",
            options: [
              { value: "escribir", label: "Escribir consulta" },
              { value: "llamar", label: "Llamar" },
              { value: "visitar", label: "Vendré al Garden" }
            ]
          },
          {
            type: "textarea",
            name: "consulta",
            legend: "Tu consulta",
            placeholder: "Cuéntanos qué necesitas…"
          }
        ]
      }
    };

    var topicChips = $all(".contact-topic__chip", contactTopicRoot);
    var topicForm = contactTopicRoot.querySelector("[data-topic-form]");
    var topicTitle = contactTopicRoot.querySelector("[data-topic-title]");
    var topicText = contactTopicRoot.querySelector("[data-topic-text]");
    var topicFields = contactTopicRoot.querySelector("[data-topic-fields]");
    var topicTips = contactTopicRoot.querySelector("[data-topic-tips]");
    var topicTipsList = contactTopicRoot.querySelector("[data-topic-tips-list]");
    var topicPanel = contactTopicRoot.querySelector("[data-topic-panel]");
    var activeTopicKey = "planta";

    function fieldId(topicKey, fieldName, suffix) {
      return "topic-" + topicKey + "-" + fieldName + (suffix ? "-" + suffix : "");
    }

    function renderTopicFields(topicKey) {
      var config = topicForms[topicKey];
      if (!config || !topicFields) return;
      var html = "";

      config.fields.forEach(function (field) {
        if (field.type === "textarea") {
          html +=
            '<div class="contact-topic__field contact-topic__field--textarea">' +
            '<label class="contact-topic__label" for="' +
            fieldId(topicKey, field.name) +
            '">' +
            field.legend +
            "</label>" +
            '<textarea class="contact-topic__textarea" id="' +
            fieldId(topicKey, field.name) +
            '" name="' +
            field.name +
            '" rows="3" placeholder="' +
            field.placeholder +
            '"></textarea></div>';
          return;
        }

        var inputType = field.type === "checkbox" ? "checkbox" : "radio";
        var groupName = field.name + "-" + topicKey;
        html += '<fieldset class="contact-topic__field"><legend>' + field.legend + "</legend>";
        html += '<div class="contact-topic__options">';
        field.options.forEach(function (opt, idx) {
          var id = fieldId(topicKey, field.name, String(idx));
          html +=
            '<label class="contact-topic__option" for="' +
            id +
            '"><input type="' +
            inputType +
            '" id="' +
            id +
            '" name="' +
            groupName +
            '" value="' +
            opt.value +
            '"><span>' +
            opt.label +
            "</span></label>";
        });
        html += "</div></fieldset>";
      });

      topicFields.innerHTML = html;
    }

    function readFieldLabel(topicKey, field, value) {
      if (field.type === "textarea") return value.trim();
      var match = field.options.filter(function (opt) {
        return opt.value === value;
      });
      return match.length ? match[0].label : value;
    }

    function buildTopicMessage(topicKey) {
      var config = topicForms[topicKey];
      if (!config || !topicForm) return "";
      var lines = ["Hola, me gustaría consultar sobre: " + (topicLabels[topicKey] || topicKey) + ".", ""];

      config.fields.forEach(function (field) {
        if (field.type === "textarea") {
          var note = topicForm.elements[field.name];
          if (note && note.value.trim()) {
            lines.push(field.legend + ":");
            lines.push(note.value.trim());
            lines.push("");
          }
          return;
        }

        var groupName = field.name + "-" + topicKey;
        if (field.type === "radio") {
          var selected = topicForm.querySelector('input[name="' + groupName + '"]:checked');
          if (selected) {
            lines.push(field.legend + ": " + readFieldLabel(topicKey, field, selected.value));
          }
          return;
        }

        var checked = $all('input[name="' + groupName + '"]:checked', topicForm);
        if (checked.length) {
          lines.push(field.legend + ":");
          checked.forEach(function (input) {
            lines.push("· " + readFieldLabel(topicKey, field, input.value));
          });
          lines.push("");
        }
      });

      lines.push("—");
      lines.push("Enviado desde la web de SA Jardinería");
      return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    }

    function openTopicMessage(topicKey) {
      var msg = buildTopicMessage(topicKey);
      if (canWhatsApp) {
        var waBase = contactCfg.whatsapp.split("?")[0];
        window.open(waBase + "?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
        return;
      }
      if (canEmail) {
        var subject = "Consulta — " + (topicLabels[topicKey] || "SA Jardinería");
        window.location.href =
          "mailto:" + contactCfg.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(msg);
      }
    }

    function showTopic(key, tabEl) {
      var data = topicForms[key];
      if (!data) return;
      activeTopicKey = key;
      if (topicTitle) topicTitle.textContent = data.title;
      if (topicText) topicText.textContent = data.text;
      renderTopicFields(key);

      if (topicTips && topicTipsList) {
        if (data.tips && data.tips.length) {
          topicTips.hidden = false;
          topicTipsList.innerHTML = data.tips.map(function (tip) {
            return "<li>" + tip + "</li>";
          }).join("");
        } else {
          topicTips.hidden = true;
          topicTipsList.innerHTML = "";
        }
      }

      topicChips.forEach(function (chip) {
        var on = chip.getAttribute("data-topic") === key;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (topicPanel && tabEl) {
        topicPanel.setAttribute("aria-labelledby", tabEl.id);
      }
      if (topicPanel && !reduceMotion) {
        topicPanel.classList.add("is-changing");
        window.setTimeout(function () {
          topicPanel.classList.remove("is-changing");
        }, 280);
      }
    }

    topicChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        showTopic(chip.getAttribute("data-topic"), chip);
      });
    });

    if (topicForm) {
      topicForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!canWhatsApp && !canEmail) return;
        openTopicMessage(activeTopicKey);
      });
    }

    showTopic("planta", document.getElementById("topic-tab-planta"));

    var faqRoot = document.querySelector("[data-contact-faq]");
    if (faqRoot) {
      var faqBtns = $all(".contact-faq__button", faqRoot);
      faqBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var expanded = btn.getAttribute("aria-expanded") === "true";
          var panelId = btn.getAttribute("aria-controls");
          var faqPanel = panelId ? document.getElementById(panelId) : null;
          faqBtns.forEach(function (other) {
            if (other === btn) return;
            other.setAttribute("aria-expanded", "false");
            var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
            if (otherPanel) otherPanel.hidden = true;
          });
          btn.setAttribute("aria-expanded", expanded ? "false" : "true");
          if (faqPanel) faqPanel.hidden = expanded;
        });
      });
    }
  }

  var isContactPage =
    document.body.classList.contains("page-contact") ||
    /contacto\.html$/i.test(window.location.pathname);
  var contactNavCta = document.querySelector("[data-nav-contact]");
  if (isContactPage && contactNavCta) {
    clearNavCurrent();
    contactNavCta.setAttribute("aria-current", "page");
  }

  /* Tienda: catálogo consultable (sin ecommerce) */
  var shopPage = document.querySelector("[data-shop-page]");
  if (shopPage) {
    var shopGrid = document.querySelector("[data-shop-grid]");
    var shopEmpty = document.querySelector("[data-shop-empty]");
    var shopSearch = document.querySelector("[data-shop-search]");
    var shopSort = document.querySelector("[data-shop-sort]");
    var shopCount = document.querySelector("[data-shop-count]");
    var categoryRoot = document.querySelector("[data-shop-categories]");
    var tagRoot = document.querySelector("[data-shop-tags]");
    var clearBtns = $all("[data-shop-clear]");

    var shopProducts = [
      {
        sortOrder: 1,
        title: "Macetas de cerámica",
        category: "Macetas",
        image: "assets/interior-plantas-maceta.jpg",
        imageAlt: "Macetas de cerámica con plantas de interior",
        description: "Piezas para interior y exterior, con acabados que acompañan la planta sin robarle protagonismo.",
        priceLabel: "Desde 12 €",
        priceValue: 12,
        tags: ["Interior", "Exterior", "Cerámica"],
        badge: "Macetas"
      },
      {
        sortOrder: 2,
        title: "Macetas decorativas",
        category: "Decoración",
        image: "assets/interior.jpg",
        imageAlt: "Macetas decorativas en un espacio de interior",
        description: "Formatos pensados para integrar plantas en salones, entradas, terrazas y rincones con carácter.",
        priceLabel: "Según formato",
        priceValue: 0,
        tags: ["Interior", "Decoración", "Regalo"],
        badge: "Ambiente"
      },
      {
        sortOrder: 3,
        title: "Sustratos y mezclas",
        category: "Sustratos",
        image: "assets/semillero.jpg",
        imageAlt: "Sustratos y materiales de cultivo",
        description: "Bases de cultivo para trasplantes, mantenimiento y necesidades concretas de cada planta.",
        priceLabel: "Desde 6 €",
        priceValue: 6,
        tags: ["Trasplante", "Cuidado", "Asesoramiento"],
        badge: "Cuidado"
      },
      {
        sortOrder: 4,
        title: "Herramientas de jardín",
        category: "Herramientas",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&h=675&q=85",
        imageAlt: "Herramientas de jardinería y materiales de trabajo",
        description: "Útiles para poda, trasplante, preparación de sustrato y cuidado diario.",
        priceLabel: "Desde 14 €",
        priceValue: 14,
        tags: ["Exterior", "Cuidado", "Jardín"],
        badge: "Herramientas"
      },
      {
        sortOrder: 5,
        title: "Riego & humedad",
        category: "Riego",
        image: "assets/riego-humedad.jpg",
        imageAlt: "Regaderas y materiales de riego",
        description: "Regaderas, pulverizadores y soluciones para ajustar mejor las rutinas de agua.",
        priceLabel: "Desde 9 €",
        priceValue: 9,
        tags: ["Interior", "Exterior", "Fácil cuidado"],
        badge: "Riego"
      },
      {
        sortOrder: 6,
        title: "Fitosanitarios",
        category: "Fitosanitarios",
        image: "assets/fitosanitarios.jpg",
        imageAlt: "Plantas sanas y follaje vigoroso",
        description: "Soluciones de protección con orientación clara, responsable y adaptada a cada caso.",
        priceLabel: "Según producto",
        priceValue: 0,
        tags: ["Asesoramiento", "Exterior", "Cuidado"],
        badge: "Protección"
      },
      {
        sortOrder: 7,
        title: "Decoración para interior",
        category: "Decoración",
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&h=675&q=85",
        imageAlt: "Decoración y objetos para el hogar junto a plantas",
        description: "Piezas y detalles que dialogan con la luz, las plantas y el estilo de cada espacio.",
        priceLabel: "Desde 14 €",
        priceValue: 14,
        tags: ["Interior", "Regalo", "Texturas"],
        badge: "Decoración"
      },
      {
        sortOrder: 8,
        title: "Regalo & detalle",
        category: "Regalo",
        image: "assets/regalo-detalle.jpg",
        imageAlt: "Detalle de regalo con plantas y texturas naturales",
        description: "Pequeños objetos, plantas y piezas para regalar verde, textura o un gesto cuidado.",
        priceLabel: "Desde 8 €",
        priceValue: 8,
        tags: ["Regalo", "Decoración", "Temporada"],
        badge: "Regalo"
      },
      {
        sortOrder: 9,
        title: "Selección de temporada",
        category: "Temporada",
        image: "assets/semillero.jpg",
        imageAlt: "Plantas y detalles de temporada en el Garden",
        description: "Básicos, floraciones y detalles que cambian con el calendario y la disponibilidad.",
        priceLabel: "Variable",
        priceValue: 0,
        tags: ["Temporada", "Color", "Exterior"],
        badge: "Temporada"
      },
      {
        sortOrder: 10,
        title: "Complementos para cactus y suculentas",
        category: "Sustratos",
        image: "assets/cactuario.jpg",
        imageAlt: "Cactus y suculentas en composición de bajo riego",
        description: "Sustratos, áridos y recipientes para composiciones de bajo consumo hídrico.",
        priceLabel: "Según formato",
        priceValue: 0,
        tags: ["Bajo riego", "Cactuario", "Macetas"],
        badge: "Bajo riego"
      },
      {
        sortOrder: 11,
        title: "Soportes y piezas especiales",
        category: "Decoración",
        image: "assets/antiguedades.jpg",
        imageAlt: "Piezas decorativas y soportes para plantas",
        description: "Elementos decorativos para elevar plantas, ordenar rincones o añadir carácter.",
        priceLabel: "Según pieza",
        priceValue: 0,
        tags: ["Decoración", "Interior", "Exterior"],
        badge: "Piezas"
      },
      {
        sortOrder: 12,
        title: "Cuidado de orquídeas",
        category: "Herramientas",
        image: "assets/orquideario.jpg",
        imageAlt: "Orquídeas en ambiente de interior con luz suave",
        description: "Complementos y orientación para luz, humedad, raíces y mantenimiento de orquídeas.",
        priceLabel: "Desde 16 €",
        priceValue: 16,
        tags: ["Interior", "Asesoramiento", "Cuidado"],
        badge: "Orquídeas"
      }
    ];

    var shopState = {
      query: "",
      category: "Todo",
      tags: [],
      sort: "recommended"
    };

    function escHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    }

    function normalize(str) {
      return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function productHaystack(product) {
      return normalize(
        [product.title, product.description, product.category, product.badge]
          .concat(product.tags || [])
          .join(" ")
      );
    }

    function matchesFilters(product) {
      if (shopState.category !== "Todo" && product.category !== shopState.category) {
        return false;
      }
      if (shopState.tags.length) {
        var hasTag = shopState.tags.some(function (tag) {
          return (product.tags || []).indexOf(tag) !== -1;
        });
        if (!hasTag) return false;
      }
      if (shopState.query) {
        var q = normalize(shopState.query);
        if (productHaystack(product).indexOf(q) === -1) return false;
      }
      return true;
    }

    function sortProducts(list) {
      var sorted = list.slice();
      if (shopState.sort === "price-asc") {
        sorted.sort(function (a, b) {
          var av = a.priceValue || 999999;
          var bv = b.priceValue || 999999;
          if (a.priceValue === 0 && b.priceValue === 0) return a.sortOrder - b.sortOrder;
          if (a.priceValue === 0) return 1;
          if (b.priceValue === 0) return -1;
          return av - bv || a.sortOrder - b.sortOrder;
        });
      } else if (shopState.sort === "price-desc") {
        sorted.sort(function (a, b) {
          if (a.priceValue === 0 && b.priceValue === 0) return a.sortOrder - b.sortOrder;
          if (a.priceValue === 0) return 1;
          if (b.priceValue === 0) return -1;
          return b.priceValue - a.priceValue || a.sortOrder - b.sortOrder;
        });
      } else if (shopState.sort === "name") {
        sorted.sort(function (a, b) {
          return a.title.localeCompare(b.title, "es");
        });
      } else {
        sorted.sort(function (a, b) {
          return a.sortOrder - b.sortOrder;
        });
      }
      return sorted;
    }

    function renderProductCard(product) {
      var tagsHtml = (product.tags || [])
        .map(function (tag) {
          return '<li><span class="shop-product-card__tag">' + escHtml(tag) + "</span></li>";
        })
        .join("");

      return (
        '<article class="shop-product-card" role="listitem">' +
        '<div class="shop-product-card__media">' +
        '<img src="' +
        escHtml(product.image) +
        '" alt="' +
        escHtml(product.imageAlt || product.title) +
        '" width="480" height="360" loading="lazy" decoding="async" />' +
        "</div>" +
        '<div class="shop-product-card__body">' +
        '<div class="shop-product-card__top">' +
        '<span class="shop-product-card__badge">' +
        escHtml(product.badge) +
        "</span>" +
        "</div>" +
        "<h3 class=\"shop-product-card__title\">" +
        escHtml(product.title) +
        "</h3>" +
        '<p class="shop-product-card__text">' +
        escHtml(product.description) +
        "</p>" +
        '<p class="shop-product-card__price">' +
        escHtml(product.priceLabel) +
        "</p>" +
        '<ul class="shop-product-card__tags" aria-label="Etiquetas">' +
        tagsHtml +
        "</ul>" +
        '<div class="shop-product-card__actions">' +
        '<a class="btn btn--secondary" href="contacto.html">Consultar en tienda</a>' +
        '<a class="shop-product-card__link" href="contacto.html#como-llegar">Cómo llegar</a>' +
        "</div>" +
        "</div>" +
        "</article>"
      );
    }

    function setCategoryChip(category) {
      if (!categoryRoot) return;
      $all(".shop-filter-chip[data-category]", categoryRoot).forEach(function (chip) {
        var on = chip.getAttribute("data-category") === category;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function setTagChips() {
      if (!tagRoot) return;
      $all(".shop-filter-chip[data-tag]", tagRoot).forEach(function (chip) {
        var tag = chip.getAttribute("data-tag");
        var on = shopState.tags.indexOf(tag) !== -1;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function updateShopCatalog() {
      if (!shopGrid) return;
      var filtered = sortProducts(shopProducts.filter(matchesFilters));
      if (filtered.length) {
        shopGrid.innerHTML = filtered.map(renderProductCard).join("");
        shopGrid.hidden = false;
        if (shopEmpty) shopEmpty.hidden = true;
      } else {
        shopGrid.innerHTML = "";
        shopGrid.hidden = true;
        if (shopEmpty) shopEmpty.hidden = false;
      }
      if (shopCount) {
        var n = filtered.length;
        shopCount.textContent =
          n === 1 ? "Mostrando 1 selección" : "Mostrando " + n + " selecciones";
      }
      initLucide();
    }

    function clearShopFilters() {
      shopState.query = "";
      shopState.category = "Todo";
      shopState.tags = [];
      shopState.sort = "recommended";
      if (shopSearch) shopSearch.value = "";
      if (shopSort) shopSort.value = "recommended";
      setCategoryChip("Todo");
      setTagChips();
      updateShopCatalog();
    }

    if (categoryRoot) {
      categoryRoot.addEventListener("click", function (e) {
        var chip = e.target.closest(".shop-filter-chip[data-category]");
        if (!chip) return;
        shopState.category = chip.getAttribute("data-category") || "Todo";
        setCategoryChip(shopState.category);
        updateShopCatalog();
      });
    }

    if (tagRoot) {
      tagRoot.addEventListener("click", function (e) {
        var chip = e.target.closest(".shop-filter-chip[data-tag]");
        if (!chip) return;
        var tag = chip.getAttribute("data-tag");
        var idx = shopState.tags.indexOf(tag);
        if (idx === -1) {
          shopState.tags.push(tag);
        } else {
          shopState.tags.splice(idx, 1);
        }
        setTagChips();
        updateShopCatalog();
      });
    }

    if (shopSearch) {
      shopSearch.addEventListener("input", function () {
        shopState.query = shopSearch.value.trim();
        updateShopCatalog();
      });
    }

    if (shopSort) {
      shopSort.addEventListener("change", function () {
        shopState.sort = shopSort.value;
        updateShopCatalog();
      });
    }

    clearBtns.forEach(function (btn) {
      btn.addEventListener("click", clearShopFilters);
    });

    var urlCategory = new URLSearchParams(window.location.search).get("categoria");
    if (urlCategory) {
      var matchCat = shopProducts.some(function (p) {
        return p.category === urlCategory;
      });
      if (matchCat) {
        shopState.category = urlCategory;
        setCategoryChip(urlCategory);
      }
    }

    updateShopCatalog();
  }
})();

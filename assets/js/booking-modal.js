(() => {
  const CATEGORY_LABELS = {
    smartphone: "Smartphone",
    laptop: "Laptop",
    tablet: "Tablet",
    console: "Console",
    computer: "Computer",
    watch: "Smartwatch",
  };

  const CATEGORY_TILES = [
    { id: "smartphone", label: "Smartphone reparatie", icon: "bi-phone" },
    { id: "laptop", label: "Laptop reparatie", icon: "bi-laptop" },
    { id: "tablet", label: "Tablet reparatie", icon: "bi-tablet" },
    { id: "computer", label: "Computer reparatie", icon: "bi-display" },
    { id: "watch", label: "Smartwatch reparatie", icon: "bi-smartwatch" },
    { id: "console", label: "Console reparatie", icon: "bi-controller" },
  ];

  const FALLBACK_IMG = "https://placehold.co/80x80?text=Toestel";

  const dialog = document.getElementById("booking-modal");
  if (!dialog) return;

  const els = {
    close: document.getElementById("booking-modal-close"),
    body: document.getElementById("booking-modal-body"),
    stepCategory: document.getElementById("booking-step-category"),
    stepBrand: document.getElementById("booking-step-brand"),
    stepModel: document.getElementById("booking-step-model"),
    stepBooking: document.getElementById("booking-step-booking"),
    categoryTiles: document.getElementById("booking-category-tiles"),
    inlineMsg: document.getElementById("booking-inline-msg"),
    globalSearch: document.getElementById("booking-global-search-input"),
    globalResults: document.getElementById("booking-global-search-results"),
    brandTiles: document.getElementById("booking-brand-tiles"),
    modelSearch: document.getElementById("booking-model-search"),
    modelList: document.getElementById("booking-model-list"),
    modelNext: document.getElementById("booking-model-next"),
    selectedPhoneLabel: document.getElementById("booking-selected-phone-label"),
    issueSelect: document.getElementById("booking-issue-type"),
    dateInput: document.getElementById("booking-appointment-date"),
    slotsWrap: document.getElementById("booking-time-slots"),
    form: document.getElementById("booking-form"),
    feedback: document.getElementById("booking-feedback"),
    backBtn: document.getElementById("booking-back-btn"),
  };

  let phonesCatalog = [];
  let currentStep = "category";
  let backStack = [];
  let selectedCategory = null;
  let selectedBrandGroup = null;
  let phonesSubset = [];
  let selectedPhoneId = null;
  let selectedSlotId = null;
  let modelListActiveIndex = -1;

  const phoneCategory = (p) => p.device_category || "smartphone";

  const formatDateForInput = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayDateString = formatDateForInput(new Date());

  const toAbsoluteImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${window.location.origin}${value}`;
  };

  const apiFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Er ging iets mis.");
    return data;
  };

  const isAppleBrand = (brand) => /^apple$/i.test(String(brand || "").trim());
  const isSamsungBrand = (brand) => /^samsung$/i.test(String(brand || "").trim());

  const phonesInCategory = (cat) =>
    phonesCatalog.filter((p) => phoneCategory(p) === cat);

  const setFeedback = (message, type = "") => {
    if (!els.feedback) return;
    els.feedback.textContent = message;
    els.feedback.className = `booking-feedback ${type === "error" ? "is-error" : type === "success" ? "is-success" : ""}`.trim();
  };

  const showPanel = (step) => {
    const map = {
      category: els.stepCategory,
      brand: els.stepBrand,
      model: els.stepModel,
      booking: els.stepBooking,
    };
    Object.entries(map).forEach(([k, el]) => {
      if (el) el.hidden = k !== step;
    });
    if (els.backBtn) els.backBtn.hidden = step === "category" && backStack.length === 0;
  };

  const resetWizard = () => {
    currentStep = "category";
    backStack = [];
    selectedCategory = null;
    selectedBrandGroup = null;
    phonesSubset = [];
    selectedPhoneId = null;
    selectedSlotId = null;
    modelListActiveIndex = -1;
    if (els.inlineMsg) {
      els.inlineMsg.textContent = "";
      els.inlineMsg.hidden = true;
    }
    if (els.globalSearch) els.globalSearch.value = "";
    if (els.globalResults) {
      els.globalResults.innerHTML = "";
      els.globalResults.hidden = true;
    }
    if (els.form) els.form.reset();
    if (els.slotsWrap) els.slotsWrap.innerHTML = "";
    setFeedback("");
    showPanel("category");
    renderCategoryTiles();
  };

  const renderCategoryTiles = () => {
    if (!els.categoryTiles) return;
    els.categoryTiles.innerHTML = "";
    CATEGORY_TILES.forEach((tile) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-tile";
      btn.dataset.category = tile.id;
      btn.innerHTML = `<i class="bi ${tile.icon}" aria-hidden="true"></i><span>${tile.label}</span>`;
      btn.addEventListener("click", () => handleCategoryChoice(tile.id));
      els.categoryTiles.appendChild(btn);
    });
  };

  const handleCategoryChoice = (cat) => {
    if (els.inlineMsg) els.inlineMsg.hidden = true;
    selectedCategory = cat;
    const list = phonesInCategory(cat);
    if (!list.length) {
      if (els.inlineMsg) {
        els.inlineMsg.hidden = false;
        els.inlineMsg.innerHTML = `Voor <strong>${CATEGORY_LABELS[cat] || cat}</strong> zijn er nog geen toestellen om online te boeken. Bel ons op <a href="tel:+31655820353">+31 6 55 82 03 53</a> voor de mogelijkheden.`;
      }
      return;
    }
    if (cat === "smartphone") {
      void goForward("brand");
      renderBrandTiles();
    } else {
      selectedBrandGroup = null;
      phonesSubset = list.slice().sort((a, b) => `${a.brand} ${a.model_name}`.localeCompare(`${b.brand} ${b.model_name}`));
      void goForward("model");
      setupModelStep();
    }
  };

  const renderBrandTiles = () => {
    if (!els.brandTiles) return;
    const sm = phonesInCategory("smartphone");
    const hasIphone = sm.some((p) => isAppleBrand(p.brand));
    const hasSamsung = sm.some((p) => isSamsungBrand(p.brand));
    const hasOther = sm.some((p) => !isAppleBrand(p.brand) && !isSamsungBrand(p.brand));

    els.brandTiles.innerHTML = "";
    const add = (id, label, icon) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-tile";
      btn.dataset.brandGroup = id;
      btn.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span>${label}</span>`;
      btn.addEventListener("click", () => {
        selectedBrandGroup = id;
        phonesSubset = sm
          .filter((p) => {
            if (id === "iphone") return isAppleBrand(p.brand);
            if (id === "samsung") return isSamsungBrand(p.brand);
            return !isAppleBrand(p.brand) && !isSamsungBrand(p.brand);
          })
          .sort((a, b) => `${a.brand} ${a.model_name}`.localeCompare(`${b.brand} ${b.model_name}`));
        goForward("model");
        setupModelStep();
      });
      els.brandTiles.appendChild(btn);
    };

    if (hasIphone) add("iphone", "iPhone", "bi-apple");
    if (hasSamsung) add("samsung", "Samsung", "bi-android2");
    if (hasOther) add("other", "Overig merk", "bi-three-dots");
  };

  const getFilteredModels = (query) => {
    const q = String(query || "")
      .toLowerCase()
      .trim();
    if (!q) return phonesSubset.slice();
    return phonesSubset.filter((p) => {
      const hay = `${p.brand} ${p.model_name}`.toLowerCase();
      return hay.includes(q);
    });
  };

  const renderModelOptions = (query) => {
    if (!els.modelList) return;
    const items = getFilteredModels(query);
    els.modelList.innerHTML = "";
    modelListActiveIndex = items.length ? 0 : -1;

    items.forEach((phone, idx) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-combobox__option";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", idx === 0 && selectedPhoneId === phone.id ? "true" : "false");
      if (selectedPhoneId === phone.id || (idx === 0 && !selectedPhoneId)) {
        btn.classList.add("is-active");
      }
      const img = document.createElement("img");
      img.src = toAbsoluteImageUrl(phone.image_url) || FALLBACK_IMG;
      img.alt = "";
      const span = document.createElement("span");
      span.textContent = `${phone.brand} ${phone.model_name}`;
      btn.appendChild(img);
      btn.appendChild(span);
      btn.addEventListener("click", () => {
        selectedPhoneId = phone.id;
        renderModelOptions(els.modelSearch?.value || "");
        if (els.modelNext) els.modelNext.disabled = false;
      });
      btn.addEventListener("mouseenter", () => {
        els.modelList.querySelectorAll(".booking-combobox__option").forEach((n) => n.classList.remove("is-active"));
        btn.classList.add("is-active");
        modelListActiveIndex = idx;
      });
      li.appendChild(btn);
      els.modelList.appendChild(li);
    });

    if (!items.length) {
      const li = document.createElement("li");
      li.className = "booking-hint";
      li.style.listStyle = "none";
      li.style.padding = "0.75rem";
      li.textContent = "Geen resultaten. Pas je zoekterm aan.";
      els.modelList.appendChild(li);
    }
  };

  const setupModelStep = () => {
    selectedPhoneId = null;
    if (els.modelSearch) els.modelSearch.value = "";
    if (els.modelNext) els.modelNext.disabled = true;
    renderModelOptions("");
  };

  const goForward = async (next) => {
    backStack.push(currentStep);
    currentStep = next;
    showPanel(currentStep);
    if (next === "booking") await prepareBookingStep();
  };

  const goToBookingFromGlobalSearch = async (phone) => {
    backStack = ["category"];
    currentStep = "booking";
    selectedPhoneId = phone.id;
    selectedCategory = phoneCategory(phone);
    showPanel("booking");
    await prepareBookingStep();
  };

  const prepareBookingStep = async () => {
    const phone = phonesCatalog.find((p) => p.id === selectedPhoneId);
    if (els.selectedPhoneLabel) {
      els.selectedPhoneLabel.textContent = phone ? `${phone.brand} ${phone.model_name}` : "—";
    }
    try {
      const issues = await apiFetch("/api/public/issues");
      if (els.issueSelect) {
        els.issueSelect.innerHTML = '<option value="">Kies een probleem</option>';
        issues.forEach((it) => {
          const opt = document.createElement("option");
          opt.value = String(it.id);
          opt.textContent = it.label;
          els.issueSelect.appendChild(opt);
        });
      }
    } catch (e) {
      setFeedback(e.message, "error");
    }

    if (els.dateInput) {
      els.dateInput.min = todayDateString;
      els.dateInput.value = todayDateString;
    }
    selectedSlotId = null;
    if (els.slotsWrap) els.slotsWrap.innerHTML = "";
    if (els.dateInput?.value) {
      try {
        const slots = await apiFetch(`/api/public/availability?date=${els.dateInput.value}`);
        renderTimeSlots(slots);
      } catch {
        /* feedback bij submit */
      }
    }
  };

  const renderTimeSlots = (slots) => {
    if (!els.slotsWrap) return;
    selectedSlotId = null;
    els.slotsWrap.innerHTML = "";
    if (!slots.length) {
      els.slotsWrap.innerHTML = "<p class=\"booking-hint\">Geen beschikbare slots op deze datum.</p>";
      return;
    }
    slots.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-slot";
      btn.textContent = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;
      btn.addEventListener("click", () => {
        selectedSlotId = slot.id;
        els.slotsWrap.querySelectorAll(".booking-slot").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
      els.slotsWrap.appendChild(btn);
    });
  };

  const goBack = () => {
    if (currentStep === "category" && backStack.length === 0) {
      dialog.close();
      return;
    }
    if (backStack.length === 0) return;
    currentStep = backStack.pop();
    if (currentStep === "model") setupModelStep();
    if (currentStep === "brand") renderBrandTiles();
    showPanel(currentStep);
  };

  const onGlobalSearch = () => {
    if (!els.globalSearch || !els.globalResults) return;
    const q = els.globalSearch.value.toLowerCase().trim();
    if (!q) {
      els.globalResults.innerHTML = "";
      els.globalResults.hidden = true;
      return;
    }
    const matches = phonesCatalog
      .filter((p) => {
        const cat = CATEGORY_LABELS[phoneCategory(p)] || phoneCategory(p);
        const hay = `${p.brand} ${p.model_name} ${cat}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 20);

    els.globalResults.innerHTML = "";
    matches.forEach((phone) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-search-result";
      const img = document.createElement("img");
      img.src = toAbsoluteImageUrl(phone.image_url) || FALLBACK_IMG;
      img.alt = "";
      const wrap = document.createElement("span");
      wrap.innerHTML = `<span>${phone.brand} ${phone.model_name}</span><small>${CATEGORY_LABELS[phoneCategory(phone)] || phoneCategory(phone)}</small>`;
      btn.appendChild(img);
      btn.appendChild(wrap);
      btn.addEventListener("click", async () => {
        await goToBookingFromGlobalSearch(phone);
        els.globalResults.hidden = true;
      });
      els.globalResults.appendChild(btn);
    });
    els.globalResults.hidden = matches.length === 0;
    if (matches.length === 0) {
      els.globalResults.innerHTML = "<p class=\"booking-hint\" style=\"margin:0;padding:0.65rem;\">Geen treffers.</p>";
      els.globalResults.hidden = false;
    }
  };

  const loadPhones = async () => {
    phonesCatalog = await apiFetch("/api/public/phones");
  };

  const openBookingModal = async (presetCategory) => {
    try {
      await loadPhones();
    } catch (e) {
      setFeedback(e.message, "error");
    }
    resetWizard();
    if (presetCategory && phonesInCategory(presetCategory).length) {
      handleCategoryChoice(presetCategory);
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
  };

  els.close?.addEventListener("click", () => dialog.close());
  els.backBtn?.addEventListener("click", goBack);

  els.globalSearch?.addEventListener("input", onGlobalSearch);

  els.modelSearch?.addEventListener("input", () => {
    selectedPhoneId = null;
    if (els.modelNext) els.modelNext.disabled = true;
    renderModelOptions(els.modelSearch.value);
  });

  els.modelSearch?.addEventListener("keydown", (e) => {
    const options = els.modelList?.querySelectorAll(".booking-combobox__option");
    if (!options?.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      modelListActiveIndex = Math.min(modelListActiveIndex + 1, options.length - 1);
      options.forEach((n, i) => n.classList.toggle("is-active", i === modelListActiveIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      modelListActiveIndex = Math.max(modelListActiveIndex - 1, 0);
      options.forEach((n, i) => n.classList.toggle("is-active", i === modelListActiveIndex));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const btn = options[modelListActiveIndex];
      btn?.click();
    }
  });

  els.modelNext?.addEventListener("click", async () => {
    if (!selectedPhoneId) return;
    await goForward("booking");
  });

  els.dateInput?.addEventListener("change", async () => {
    if (!els.dateInput.value) return;
    if (els.dateInput.value < todayDateString) {
      els.dateInput.value = todayDateString;
      setFeedback("Je kunt geen datum in het verleden kiezen.", "error");
      return;
    }
    try {
      const slots = await apiFetch(`/api/public/availability?date=${els.dateInput.value}`);
      renderTimeSlots(slots);
    } catch (e) {
      setFeedback(e.message, "error");
    }
  });

  els.form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedPhoneId) {
      setFeedback("Kies een toestel.", "error");
      return;
    }
    if (!selectedSlotId) {
      setFeedback("Kies eerst een tijdslot.", "error");
      return;
    }
    const fd = new FormData(els.form);
    const payload = {
      customerName: fd.get("customerName")?.toString().trim(),
      customerPhone: fd.get("customerPhone")?.toString().trim(),
      customerEmail: fd.get("customerEmail")?.toString().trim(),
      phoneId: Number(selectedPhoneId),
      issueTypeId: Number(fd.get("issueTypeId")),
      notes: fd.get("notes")?.toString().trim(),
      slotId: selectedSlotId,
    };
    try {
      const result = await apiFetch("/api/public/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFeedback(`${result.message} Referentie: #${result.appointmentId}`, "success");
      els.form.reset();
      selectedSlotId = null;
      if (els.slotsWrap) els.slotsWrap.innerHTML = "";
      if (els.dateInput) {
        els.dateInput.value = todayDateString;
        const slots = await apiFetch(`/api/public/availability?date=${els.dateInput.value}`);
        renderTimeSlots(slots);
      }
    } catch (err) {
      setFeedback(err.message, "error");
    }
  });

  document.querySelectorAll("[data-open-booking]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openBookingModal();
    });
  });

  const serviceTrack = document.querySelector(".service-slider-track");
  serviceTrack?.addEventListener("click", (e) => {
    const chip = e.target.closest("a.service-chip[data-booking-category]");
    if (!chip || !serviceTrack.contains(chip)) return;
    e.preventDefault();
    openBookingModal(chip.dataset.bookingCategory);
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("boek") === "1") {
    openBookingModal();
    const url = new URL(window.location.href);
    url.searchParams.delete("boek");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
})();

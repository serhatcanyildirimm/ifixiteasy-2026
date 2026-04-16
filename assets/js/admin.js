const loginPanel = document.querySelector("#admin-login-panel");
const loginForm = document.querySelector("#admin-login-form");
const loginFeedback = document.querySelector("#admin-login-feedback");
const dashboard = document.querySelector("#admin-dashboard");
const logoutButton = document.querySelector("#admin-logout-btn");

const phoneCreateForm = document.querySelector("#phone-create-form");
const phonesList = document.querySelector("#phones-list");
const phoneEditIdInput = document.querySelector("#phoneEditId");
const phoneEditIsActiveInput = document.querySelector("#phoneEditIsActive");
const phoneFormResetButton = document.querySelector("#phone-form-reset-btn");
const phoneImagePreview = document.querySelector("#phone-image-preview");
const slotCreateForm = document.querySelector("#slot-create-form");
const availabilityList = document.querySelector("#availability-list");
const appointmentsList = document.querySelector("#appointments-list");
const appointmentsFilterForm = document.querySelector("#appointments-filter-form");
const passwordForm = document.querySelector("#admin-password-form");
const passwordFeedback = document.querySelector("#password-feedback");
const statusBreakdownList = document.querySelector("#status-breakdown-list");
const upcomingAppointmentsList = document.querySelector("#upcoming-appointments-list");
const dashboardCalendarRoot = document.querySelector("#dashboard-calendar-root");
const dashboardCalLabel = document.querySelector("#dashboard-cal-label");
const dashboardCalDialog = document.querySelector("#dashboard-cal-dialog");
const dashboardCalDialogTitle = document.querySelector("#dashboard-cal-dialog-title");
const dashboardCalDialogBody = document.querySelector("#dashboard-cal-dialog-body");
const dashboardCalFeedback = document.querySelector("#dashboard-calendar-feedback");

const widgetTotalAppointments = document.querySelector("#widget-total-appointments");
const widgetOpenAppointments = document.querySelector("#widget-open-appointments");
const widgetActiveSlots = document.querySelector("#widget-active-slots");
const widgetActivePhones = document.querySelector("#widget-active-phones");

const storageKey = "ifixiteasy_admin_token";
const fallbackImage = "https://placehold.co/96x96?text=No+Image";
const defaultAppointmentFilters = {
  q: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

let appointmentFilters = { ...defaultAppointmentFilters };

const buildAfsprakenPageUrl = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") p.set(key, String(value).trim());
  });
  const s = p.toString();
  return s ? `./afspraken.html?${s}` : "./afspraken.html";
};

const hydrateAppointmentFiltersFromUrl = () => {
  if (!appointmentsList) return;
  const params = new URLSearchParams(window.location.search);
  appointmentFilters = {
    q: params.get("q") || "",
    status: params.get("status") || "",
    dateFrom: params.get("dateFrom") || "",
    dateTo: params.get("dateTo") || "",
  };
  const elQ = document.querySelector("#filterSearch");
  const elS = document.querySelector("#filterStatus");
  const elDf = document.querySelector("#filterDateFrom");
  const elDt = document.querySelector("#filterDateTo");
  if (elQ) elQ.value = appointmentFilters.q;
  if (elS) elS.value = appointmentFilters.status;
  if (elDf) elDf.value = appointmentFilters.dateFrom;
  if (elDt) elDt.value = appointmentFilters.dateTo;
};

const DASH_CAL_WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

let dashboardCalYear = new Date().getFullYear();
let dashboardCalMonth = new Date().getMonth();
let dashboardCalByDay = {};
let dashboardCalNavBound = false;
let dashboardCalDialogBound = false;

const getToken = () => localStorage.getItem(storageKey);
const setToken = (token) => localStorage.setItem(storageKey, token);
const clearToken = () => localStorage.removeItem(storageKey);

const toAbsoluteImageUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${window.location.origin}${value}`;
};

const setFeedback = (target, message, type = "") => {
  if (!target) return;
  target.textContent = message;
  target.className = `admin-feedback ${type}`.trim();
};

const getStatusBadgeClass = (status) => `status-badge ${status || "pending"}`;

const normalizeDateString = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    if (value.includes("T")) return value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
};

const timeShort = (t) => (t == null ? "" : String(t).slice(0, 5));

const formatAppointmentSlot = (slotDateRaw, startTime, endTime) => {
  const ymd = normalizeDateString(slotDateRaw);
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  const dayPart = local.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${dayPart} · ${timeShort(startTime)}–${timeShort(endTime)}`;
};

const formatCreatedAt = (value) => {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
};

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const normalizeWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("31")) return digits;
  if (digits.startsWith("0")) return `31${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("6")) return `31${digits}`;
  return digits;
};

const buildWhatsAppConfirmUrl = (appointment) => {
  const wa = normalizeWhatsAppNumber(appointment.customer_phone);
  if (!wa) return "";
  const slotLine = formatAppointmentSlot(appointment.slot_date, appointment.start_time, appointment.end_time);
  const text = [
    `Hoi ${appointment.customer_name},`,
    "",
    `Bevestiging iFixItEasy afspraak #${appointment.id}.`,
    `Wanneer: ${slotLine}`,
    `Toestel: ${appointment.brand} ${appointment.model_name}`,
    `Probleem: ${appointment.issue_label}`,
    "",
    "Tot dan!",
  ].join("\n");
  return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
};

const apiFetch = async (url, options = {}, autoLogoutOn401 = true) => {
  const token = getToken();
  const hasFormDataBody = options.body instanceof FormData;
  const mergedHeaders = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  if (!hasFormDataBody && !mergedHeaders["Content-Type"]) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && autoLogoutOn401) {
    clearToken();
    setAuthUi(false);
  }
  if (!response.ok) {
    throw new Error(data.message || "Actie mislukt.");
  }

  return data;
};

const renderDashboardWidgets = (summary) => {
  if (!widgetTotalAppointments || !widgetOpenAppointments || !widgetActiveSlots || !widgetActivePhones || !statusBreakdownList || !upcomingAppointmentsList) {
    return;
  }
  const counts = summary?.counts || {};
  widgetTotalAppointments.textContent = counts.totalAppointments || 0;
  widgetOpenAppointments.textContent = counts.openAppointments || 0;
  widgetActiveSlots.textContent = counts.activeSlots || 0;
  widgetActivePhones.textContent = counts.activePhones || 0;

  statusBreakdownList.innerHTML = "";
  (summary?.statusBreakdown || []).forEach((item) => {
    const row = document.createElement("a");
    row.className = "admin-row admin-row--link";
    row.href = buildAfsprakenPageUrl({ status: item.status });
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${escapeHtml(item.status)}</strong>
        <span class="${getStatusBadgeClass(item.status)}">${item.total}</span>
      </div>
    `;
    statusBreakdownList.appendChild(row);
  });

  if (!summary?.statusBreakdown?.length) {
    statusBreakdownList.innerHTML = "<p>Nog geen data.</p>";
  }

  upcomingAppointmentsList.innerHTML = "";
  (summary?.upcomingAppointments || []).forEach((item) => {
    const row = document.createElement("a");
    row.className = "admin-row admin-row--link";
    const day = normalizeDateString(item.slot_date);
    row.href = buildAfsprakenPageUrl({
      dateFrom: day,
      dateTo: day,
      q: item.customer_name || "",
    });
    const slotLine = formatAppointmentSlot(item.slot_date, item.start_time, item.end_time);
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${escapeHtml(item.customer_name)}</strong>
        <span class="${getStatusBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p>${escapeHtml(slotLine)} | ${escapeHtml(item.brand)} ${escapeHtml(item.model_name)}</p>
    `;
    upcomingAppointmentsList.appendChild(row);
  });

  if (!summary?.upcomingAppointments?.length) {
    upcomingAppointmentsList.innerHTML = "<p>Geen aankomende afspraken.</p>";
  }
};

const formatYmd = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const monthDateRange = (year, month0) => {
  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);
  return { from: formatYmd(first), to: formatYmd(last) };
};

const groupAppointmentsByDay = (rows) => {
  const byDay = {};
  (rows || []).forEach((a) => {
    const d = normalizeDateString(a.slot_date);
    if (!d) return;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(a);
  });
  Object.keys(byDay).forEach((k) => {
    byDay[k].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  });
  return byDay;
};

const bindDashboardCalDialog = () => {
  if (dashboardCalDialogBound) return;
  const closeBtn = document.getElementById("dashboard-cal-dialog-close");
  if (!dashboardCalDialog || !closeBtn) return;
  dashboardCalDialogBound = true;
  closeBtn.addEventListener("click", () => dashboardCalDialog.close());
};

const bindDashboardCalNav = () => {
  if (dashboardCalNavBound) return;
  const prev = document.getElementById("dashboard-cal-prev");
  const next = document.getElementById("dashboard-cal-next");
  if (!prev || !next) return;
  dashboardCalNavBound = true;
  bindDashboardCalDialog();
  prev.addEventListener("click", () => {
    dashboardCalMonth -= 1;
    if (dashboardCalMonth < 0) {
      dashboardCalMonth = 11;
      dashboardCalYear -= 1;
    }
    refreshDashboardCalendar();
  });
  next.addEventListener("click", () => {
    dashboardCalMonth += 1;
    if (dashboardCalMonth > 11) {
      dashboardCalMonth = 0;
      dashboardCalYear += 1;
    }
    refreshDashboardCalendar();
  });
};

const updateDashboardCalLabel = () => {
  if (!dashboardCalLabel) return;
  const label = new Date(dashboardCalYear, dashboardCalMonth, 1).toLocaleDateString("nl-NL", {
    month: "long",
    year: "numeric",
  });
  dashboardCalLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
};

const showDashboardCalDayDetail = (ymd) => {
  if (!dashboardCalDialog || !dashboardCalDialogTitle || !dashboardCalDialogBody) return;
  bindDashboardCalDialog();
  const list = dashboardCalByDay[ymd] || [];
  const title = new Date(`${ymd}T12:00:00`).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  dashboardCalDialogTitle.textContent = title.charAt(0).toUpperCase() + title.slice(1);

  const dayListUrl = buildAfsprakenPageUrl({ dateFrom: ymd, dateTo: ymd });
  const footer = `<div class="admin-cal-dialog__footer"><a class="btn btn--primary" href="${escapeHtml(dayListUrl)}">Open op afsprakenpagina</a></div>`;

  if (!list.length) {
    dashboardCalDialogBody.innerHTML = `<p class="admin-cal-dialog__empty">Geen afspraken op deze dag.</p>${footer}`;
  } else {
    const items = list
      .map((a) => {
        const slotLine = `${timeShort(a.start_time)}–${timeShort(a.end_time)}`;
        const wa = buildWhatsAppConfirmUrl(a);
        const waLink = wa
          ? `<a class="admin-cal-dialog__wa" href="${escapeHtml(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`
          : "";
        const itemHref = escapeHtml(
          buildAfsprakenPageUrl({
            dateFrom: ymd,
            dateTo: ymd,
            q: a.customer_name || "",
          })
        );
        return `<li class="admin-cal-dialog__item">
        <a class="admin-cal-dialog__item-link" href="${itemHref}">
          <div class="admin-cal-dialog__row">
            <span class="admin-cal-dialog__time">${escapeHtml(slotLine)}</span>
            <span class="admin-cal-dialog__name">${escapeHtml(a.customer_name)}</span>
            <span class="${getStatusBadgeClass(a.status)}">${escapeHtml(a.status)}</span>
          </div>
          <div class="admin-cal-dialog__meta">${escapeHtml(a.brand)} ${escapeHtml(a.model_name)} · ${escapeHtml(a.issue_label || "")}</div>
        </a>
        ${waLink}
      </li>`;
      })
      .join("");
    dashboardCalDialogBody.innerHTML = `<ul class="admin-cal-dialog__list">${items}</ul>${footer}`;
  }

  if (typeof dashboardCalDialog.showModal === "function") {
    dashboardCalDialog.showModal();
  }
};

const renderDashboardCalendarGrid = () => {
  if (!dashboardCalendarRoot) return;
  updateDashboardCalLabel();

  const weekdayRow = document.createElement("div");
  weekdayRow.className = "dashboard-cal-weekdays";
  DASH_CAL_WEEKDAYS.forEach((wd) => {
    const h = document.createElement("div");
    h.className = "dashboard-cal-weekday";
    h.textContent = wd;
    weekdayRow.appendChild(h);
  });

  const daysGrid = document.createElement("div");
  daysGrid.className = "dashboard-cal-days";

  const firstOfMonth = new Date(dashboardCalYear, dashboardCalMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(dashboardCalYear, dashboardCalMonth, 1 - startOffset);
  const todayYmd = formatYmd(new Date());

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const ymd = formatYmd(cellDate);
    const inMonth = cellDate.getMonth() === dashboardCalMonth;
    const dayNum = cellDate.getDate();
    const appts = dashboardCalByDay[ymd] || [];

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "dashboard-cal-day";
    if (!inMonth) cell.classList.add("dashboard-cal-day--muted");
    if (ymd === todayYmd) cell.classList.add("dashboard-cal-day--today");
    cell.dataset.ymd = ymd;

    const num = document.createElement("span");
    num.className = "dashboard-cal-day__num";
    num.textContent = String(dayNum);
    cell.appendChild(num);

    const list = document.createElement("div");
    list.className = "dashboard-cal-day__appts";
    const maxShow = 3;
    appts.slice(0, maxShow).forEach((a) => {
      const chip = document.createElement("span");
      chip.className = `dashboard-cal-chip ${getStatusBadgeClass(a.status)}`;
      chip.textContent = `${timeShort(a.start_time)} ${a.customer_name?.split(" ")[0] || ""}`.trim();
      chip.title = `${a.customer_name} · ${a.brand} ${a.model_name}`;
      list.appendChild(chip);
    });
    if (appts.length > maxShow) {
      const more = document.createElement("span");
      more.className = "dashboard-cal-more";
      more.textContent = `+${appts.length - maxShow}`;
      list.appendChild(more);
    }
    cell.appendChild(list);

    cell.addEventListener("click", () => showDashboardCalDayDetail(ymd));
    daysGrid.appendChild(cell);
  }

  dashboardCalendarRoot.innerHTML = "";
  dashboardCalendarRoot.appendChild(weekdayRow);
  dashboardCalendarRoot.appendChild(daysGrid);
};

const applyDashboardCalendarData = (rows) => {
  dashboardCalByDay = groupAppointmentsByDay(rows);
  renderDashboardCalendarGrid();
};

const refreshDashboardCalendar = async () => {
  if (!dashboardCalendarRoot) return;
  bindDashboardCalNav();
  if (dashboardCalFeedback) setFeedback(dashboardCalFeedback, "", "");
  if (dashboardCalDialog?.open) dashboardCalDialog.close();
  try {
    const { from, to } = monthDateRange(dashboardCalYear, dashboardCalMonth);
    const rows = await apiFetch(
      `/api/admin/appointments?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`
    );
    applyDashboardCalendarData(rows);
  } catch (error) {
    if (dashboardCalFeedback) setFeedback(dashboardCalFeedback, error.message, "error");
  }
};

const resetPhoneForm = () => {
  if (!phoneCreateForm || !phoneEditIdInput || !phoneEditIsActiveInput || !phoneImagePreview) return;
  phoneCreateForm.reset();
  const cat = document.querySelector("#phoneDeviceCategory");
  if (cat) cat.value = "smartphone";
  phoneEditIdInput.value = "";
  phoneEditIsActiveInput.value = "true";
  phoneImagePreview.classList.add("hidden");
  phoneImagePreview.innerHTML = "";
};

const showPhoneImagePreview = (imageUrl) => {
  if (!phoneImagePreview) return;
  if (!imageUrl) {
    phoneImagePreview.classList.add("hidden");
    phoneImagePreview.innerHTML = "";
    return;
  }

  phoneImagePreview.classList.remove("hidden");
  phoneImagePreview.innerHTML = `
    <img src="${toAbsoluteImageUrl(imageUrl)}" alt="Toestel voorbeeld" />
    <p>Voorbeeldafbeelding geselecteerd.</p>
  `;
};

const uploadPhoneImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const result = await apiFetch(
    "/api/admin/phones/upload",
    {
      method: "POST",
      body: formData,
    },
    true
  );
  return result.imageUrl;
};

const renderPhones = (phones) => {
  if (!phonesList) return;
  phonesList.innerHTML = "";
  phones.forEach((phone) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    const imageSrc = toAbsoluteImageUrl(phone.image_url) || fallbackImage;
    const catLabel =
      {
        smartphone: "Smartphone",
        laptop: "Laptop",
        tablet: "Tablet",
        console: "Console",
        computer: "Computer",
        watch: "Smartwatch",
      }[phone.device_category] || phone.device_category;
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${phone.brand} ${phone.model_name}</strong>
        <span>${catLabel} · ${phone.is_active ? "Actief" : "Inactief"}</span>
      </div>
      <img class="admin-row-media" src="${imageSrc}" alt="${phone.brand} ${phone.model_name}" />
      <div class="admin-row-actions">
        <button class="btn btn--secondary" data-action="edit">Bewerken</button>
        <button class="btn btn--secondary" data-action="toggle">
          ${phone.is_active ? "Deactiveren" : "Activeren"}
        </button>
      </div>
    `;

    row.querySelector("[data-action='edit']").addEventListener("click", () => {
      phoneEditIdInput.value = String(phone.id);
      phoneEditIsActiveInput.value = String(Boolean(phone.is_active));
      document.querySelector("#phoneBrand").value = phone.brand;
      document.querySelector("#phoneModel").value = phone.model_name;
      document.querySelector("#phoneImageUrl").value = phone.image_url || "";
      const catEl = document.querySelector("#phoneDeviceCategory");
      if (catEl) catEl.value = phone.device_category || "smartphone";
      showPhoneImagePreview(phone.image_url || "");
    });

    row.querySelector("[data-action='toggle']").addEventListener("click", async () => {
      await apiFetch(`/api/admin/phones/${phone.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          brand: phone.brand,
          modelName: phone.model_name,
          imageUrl: phone.image_url || "",
          deviceCategory: phone.device_category || "smartphone",
          isActive: !phone.is_active,
        }),
      });
      await loadDashboardData();
    });

    phonesList.appendChild(row);
  });
};

const renderAvailability = (slots) => {
  if (!availabilityList) return;
  availabilityList.innerHTML = "";
  slots.forEach((slot) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${slot.slot_date} | ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}</strong>
        <span>Capaciteit: ${slot.capacity}</span>
      </div>
      <div class="admin-row-actions">
        <button class="btn btn--secondary" data-action="toggle">
          ${slot.is_active ? "Uitzetten" : "Aanzetten"}
        </button>
      </div>
    `;

    row.querySelector("[data-action='toggle']").addEventListener("click", async () => {
      await apiFetch(`/api/admin/availability/${slot.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          slotDate: slot.slot_date,
          startTime: slot.start_time,
          endTime: slot.end_time,
          capacity: slot.capacity,
          isActive: !slot.is_active,
        }),
      });
      await loadDashboardData();
    });

    availabilityList.appendChild(row);
  });
};

const renderAppointments = (appointments) => {
  if (!appointmentsList) return;
  appointmentsList.innerHTML = "";
  if (!appointments.length) {
    appointmentsList.innerHTML = "<p>Geen afspraken gevonden voor deze filter.</p>";
    return;
  }

  appointments.forEach((appointment) => {
    const slotLine = formatAppointmentSlot(appointment.slot_date, appointment.start_time, appointment.end_time);
    const createdLine = formatCreatedAt(appointment.created_at);
    const waUrl = buildWhatsAppConfirmUrl(appointment);
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${escapeHtml(appointment.customer_name)} | ${escapeHtml(appointment.brand)} ${escapeHtml(appointment.model_name)}</strong>
        <span class="${getStatusBadgeClass(appointment.status)}">${appointment.status}</span>
      </div>
      <p class="admin-row-slot"><strong>Afspraak:</strong> ${escapeHtml(slotLine)}</p>
      <p class="admin-row-meta"><strong>Aangemaakt:</strong> ${escapeHtml(createdLine)}</p>
      <p><strong>Tel:</strong> ${escapeHtml(appointment.customer_phone || "—")}</p>
      <p><strong>Probleem:</strong> ${escapeHtml(appointment.issue_label)}</p>
      <div class="admin-row-actions">
        ${waUrl ? `<a class="btn btn--whatsapp" href="${waUrl}" target="_blank" rel="noopener noreferrer">WhatsApp bevestiging</a>` : ""}
        <button class="btn btn--secondary" data-status="confirmed">Bevestigen</button>
        <button class="btn btn--secondary" data-status="done">Afgerond</button>
        <button class="btn btn--secondary" data-status="cancelled">Annuleren</button>
        <button class="btn btn--danger" data-action="delete" type="button">Verwijderen</button>
      </div>
    `;

    row.querySelectorAll("[data-status]").forEach((button) => {
      button.addEventListener("click", async () => {
        await apiFetch(`/api/admin/appointments/${appointment.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: button.dataset.status }),
        });
        await loadDashboardData();
      });
    });

    row.querySelector("[data-action='delete']")?.addEventListener("click", async () => {
      if (!window.confirm(`Afspraak #${appointment.id} van ${appointment.customer_name} permanent verwijderen?`)) {
        return;
      }
      try {
        await apiFetch(`/api/admin/appointments/${appointment.id}`, { method: "DELETE" });
        await loadDashboardData();
      } catch {
        /* apiFetch toont al fout via throw */
      }
    });

    appointmentsList.appendChild(row);
  });
};

const buildAppointmentQueryString = () => {
  const params = new URLSearchParams();
  Object.entries(appointmentFilters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
};

const loadDashboardData = async () => {
  const queryString = buildAppointmentQueryString();
  const requests = [];
  if (widgetTotalAppointments) requests.push(apiFetch("/api/admin/dashboard/summary"));
  if (dashboardCalendarRoot) {
    bindDashboardCalNav();
    const { from, to } = monthDateRange(dashboardCalYear, dashboardCalMonth);
    requests.push(
      apiFetch(`/api/admin/appointments?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`)
    );
  }
  if (phonesList) requests.push(apiFetch("/api/admin/phones"));
  if (availabilityList) requests.push(apiFetch("/api/admin/availability"));
  if (appointmentsList) requests.push(apiFetch(`/api/admin/appointments${queryString ? `?${queryString}` : ""}`));

  const results = await Promise.all(requests);
  let index = 0;

  if (widgetTotalAppointments) {
    renderDashboardWidgets(results[index]);
    index += 1;
  }
  if (dashboardCalendarRoot) {
    applyDashboardCalendarData(results[index]);
    index += 1;
  }
  if (phonesList) {
    renderPhones(results[index]);
    index += 1;
  }
  if (availabilityList) {
    renderAvailability(results[index]);
    index += 1;
  }
  if (appointmentsList) {
    renderAppointments(results[index]);
  }
};

const setAuthUi = (isLoggedIn) => {
  if (!loginPanel || !dashboard) return;
  loginPanel.classList.toggle("hidden", isLoggedIn);
  dashboard.classList.toggle("hidden", !isLoggedIn);
};

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.querySelector("#adminEmail").value.trim();
  const password = document.querySelector("#adminPassword").value;

  try {
    const { token } = await apiFetch("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false);
    setToken(token);
    setAuthUi(true);
    hydrateAppointmentFiltersFromUrl();
    await loadDashboardData();
    setFeedback(loginFeedback, "", "");
  } catch (error) {
    setFeedback(loginFeedback, error.message, "error");
  }
});

logoutButton?.addEventListener("click", () => {
  clearToken();
  setAuthUi(false);
});

phoneCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const brand = document.querySelector("#phoneBrand").value.trim();
  const modelName = document.querySelector("#phoneModel").value.trim();
  const deviceCategory = document.querySelector("#phoneDeviceCategory")?.value || "smartphone";
  const imageUrlInput = document.querySelector("#phoneImageUrl").value.trim();
  const imageFile = document.querySelector("#phoneImageFile").files[0];
  const editId = phoneEditIdInput.value;
  const editIsActive = phoneEditIsActiveInput.value === "true";
  let finalImageUrl = imageUrlInput;

  if (imageFile) {
    finalImageUrl = await uploadPhoneImage(imageFile);
  }

  if (editId) {
    await apiFetch(`/api/admin/phones/${editId}`, {
      method: "PATCH",
      body: JSON.stringify({
        brand,
        modelName,
        imageUrl: finalImageUrl,
        deviceCategory,
        isActive: editIsActive,
      }),
    });
  } else {
    await apiFetch("/api/admin/phones", {
      method: "POST",
      body: JSON.stringify({ brand, modelName, imageUrl: finalImageUrl, deviceCategory }),
    });
  }
  resetPhoneForm();
  await loadDashboardData();
});

phoneFormResetButton?.addEventListener("click", () => {
  resetPhoneForm();
});

document.querySelector("#phoneImageUrl")?.addEventListener("input", (event) => {
  showPhoneImagePreview(event.target.value.trim());
});

document.querySelector("#phoneImageFile")?.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const localPreview = URL.createObjectURL(file);
  showPhoneImagePreview(localPreview);
});

slotCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const slotDate = document.querySelector("#slotDate").value;
  const startTime = document.querySelector("#slotStart").value;
  const endTime = document.querySelector("#slotEnd").value;
  const capacity = Number(document.querySelector("#slotCapacity").value);

  await apiFetch("/api/admin/availability", {
    method: "POST",
    body: JSON.stringify({ slotDate, startTime, endTime, capacity }),
  });
  slotCreateForm.reset();
  await loadDashboardData();
});

appointmentsFilterForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  appointmentFilters = {
    q: document.querySelector("#filterSearch").value.trim(),
    status: document.querySelector("#filterStatus").value,
    dateFrom: document.querySelector("#filterDateFrom").value,
    dateTo: document.querySelector("#filterDateTo").value,
  };
  await loadDashboardData();
});

passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentPassword = document.querySelector("#currentPassword").value;
  const newPassword = document.querySelector("#newPassword").value;
  const confirmPassword = document.querySelector("#confirmPassword").value;

  if (newPassword !== confirmPassword) {
    setFeedback(passwordFeedback, "Nieuw wachtwoord en bevestiging komen niet overeen.", "error");
    return;
  }

  try {
    await apiFetch("/api/admin/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    passwordForm.reset();
    setFeedback(passwordFeedback, "Wachtwoord succesvol gewijzigd.", "success");
  } catch (error) {
    setFeedback(passwordFeedback, error.message, "error");
  }
});

if (getToken()) {
  setAuthUi(true);
  hydrateAppointmentFiltersFromUrl();
  loadDashboardData().catch(() => {
    clearToken();
    setAuthUi(false);
  });
} else {
  setAuthUi(false);
}

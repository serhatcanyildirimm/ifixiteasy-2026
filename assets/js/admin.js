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
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${item.status}</strong>
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
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${item.customer_name}</strong>
        <span class="${getStatusBadgeClass(item.status)}">${item.status}</span>
      </div>
      <p>${item.slot_date} ${item.start_time.slice(0, 5)} | ${item.brand} ${item.model_name}</p>
    `;
    upcomingAppointmentsList.appendChild(row);
  });

  if (!summary?.upcomingAppointments?.length) {
    upcomingAppointmentsList.innerHTML = "<p>Geen aankomende afspraken.</p>";
  }
};

const resetPhoneForm = () => {
  if (!phoneCreateForm || !phoneEditIdInput || !phoneEditIsActiveInput || !phoneImagePreview) return;
  phoneCreateForm.reset();
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
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${phone.brand} ${phone.model_name}</strong>
        <span>${phone.is_active ? "Actief" : "Inactief"}</span>
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
      showPhoneImagePreview(phone.image_url || "");
    });

    row.querySelector("[data-action='toggle']").addEventListener("click", async () => {
      await apiFetch(`/api/admin/phones/${phone.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          brand: phone.brand,
          modelName: phone.model_name,
          imageUrl: phone.image_url || "",
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
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-head">
        <strong>${appointment.customer_name} | ${appointment.brand} ${appointment.model_name}</strong>
        <span class="${getStatusBadgeClass(appointment.status)}">${appointment.status}</span>
      </div>
      <p>${appointment.slot_date} ${appointment.start_time.slice(0, 5)} - ${appointment.end_time.slice(0, 5)}</p>
      <p>Probleem: ${appointment.issue_label}</p>
      <div class="admin-row-actions">
        <button class="btn btn--secondary" data-status="confirmed">Bevestigen</button>
        <button class="btn btn--secondary" data-status="done">Afgerond</button>
        <button class="btn btn--secondary" data-status="cancelled">Annuleren</button>
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
  if (phonesList) requests.push(apiFetch("/api/admin/phones"));
  if (availabilityList) requests.push(apiFetch("/api/admin/availability"));
  if (appointmentsList) requests.push(apiFetch(`/api/admin/appointments${queryString ? `?${queryString}` : ""}`));

  const results = await Promise.all(requests);
  let index = 0;

  if (widgetTotalAppointments) {
    renderDashboardWidgets(results[index]);
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
        isActive: editIsActive,
      }),
    });
  } else {
    await apiFetch("/api/admin/phones", {
      method: "POST",
      body: JSON.stringify({ brand, modelName, imageUrl: finalImageUrl }),
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
  loadDashboardData().catch(() => {
    clearToken();
    setAuthUi(false);
  });
} else {
  setAuthUi(false);
}

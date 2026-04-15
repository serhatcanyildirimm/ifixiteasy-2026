const phoneSelect = document.querySelector("#phoneId");
const issueSelect = document.querySelector("#issueTypeId");
const dateInput = document.querySelector("#appointmentDate");
const timeSlotsWrap = document.querySelector("#time-slots");
const form = document.querySelector("#appointment-form");
const feedback = document.querySelector("#appointment-feedback");

let selectedSlotId = null;

const formatDateForInput = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayDateString = formatDateForInput(new Date());

const setFeedback = (message, type = "") => {
  feedback.textContent = message;
  feedback.className = `appointment-feedback ${type}`.trim();
};

const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Er ging iets mis.");
  }
  return data;
};

const fillSelect = (selectEl, items, valueKey, labelBuilder) => {
  selectEl.innerHTML = '<option value="">Kies een optie</option>';
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = labelBuilder(item);
    selectEl.appendChild(option);
  });
};

const renderTimeSlots = (slots) => {
  selectedSlotId = null;
  timeSlotsWrap.innerHTML = "";

  if (!slots.length) {
    timeSlotsWrap.innerHTML = "<p>Geen beschikbare slots op deze datum.</p>";
    return;
  }

  slots.forEach((slot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-option";
    btn.textContent = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;
    btn.addEventListener("click", () => {
      selectedSlotId = slot.id;
      timeSlotsWrap.querySelectorAll(".slot-option").forEach((el) => el.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
    timeSlotsWrap.appendChild(btn);
  });
};

const loadInitialData = async () => {
  try {
    const [phones, issues] = await Promise.all([
      apiFetch("/api/public/phones"),
      apiFetch("/api/public/issues"),
    ]);
    fillSelect(phoneSelect, phones, "id", (item) => `${item.brand} ${item.model_name}`);
    fillSelect(issueSelect, issues, "id", (item) => item.label);
  } catch (error) {
    setFeedback(error.message, "error");
  }
};

dateInput?.addEventListener("change", async () => {
  if (!dateInput.value) return;
  if (dateInput.value < todayDateString) {
    dateInput.value = todayDateString;
    selectedSlotId = null;
    timeSlotsWrap.innerHTML = "";
    setFeedback("Je kunt geen datum in het verleden kiezen.", "error");
    return;
  }

  try {
    const slots = await apiFetch(`/api/public/availability?date=${dateInput.value}`);
    renderTimeSlots(slots);
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedSlotId) {
    setFeedback("Kies eerst een tijdslot.", "error");
    return;
  }

  const formData = new FormData(form);
  const payload = {
    customerName: formData.get("customerName")?.toString().trim(),
    customerPhone: formData.get("customerPhone")?.toString().trim(),
    customerEmail: formData.get("customerEmail")?.toString().trim(),
    phoneId: Number(formData.get("phoneId")),
    issueTypeId: Number(formData.get("issueTypeId")),
    notes: formData.get("notes")?.toString().trim(),
    slotId: selectedSlotId,
  };

  try {
    const result = await apiFetch("/api/public/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setFeedback(`${result.message} Referentie: #${result.appointmentId}`, "success");
    form.reset();
    selectedSlotId = null;
    timeSlotsWrap.innerHTML = "";
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

loadInitialData();

if (dateInput) {
  dateInput.min = todayDateString;
  dateInput.value = todayDateString;
  dateInput.dispatchEvent(new Event("change"));
}

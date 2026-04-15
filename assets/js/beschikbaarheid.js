// beschikbaarheid.js — weekkalender voor beschikbaarheidsbeheer
(function () {
  const calendarEl = document.querySelector("#avail-calendar");
  if (!calendarEl) return;

  const weekLabelEl = document.querySelector("#avail-week-label");
  const prevWeekBtn = document.querySelector("#avail-prev-week");
  const nextWeekBtn = document.querySelector("#avail-next-week");

  const MONTH_NAMES = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const DAY_NAMES_FULL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

  let weekOffset = 0;
  let allSlots = [];

  const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const slotDateStr = (slotDate) => {
    if (!slotDate) return "";
    if (typeof slotDate === "string" && slotDate.length === 10) return slotDate;
    const d = new Date(slotDate);
    return toDateStr(d);
  };

  const getMondayOfWeek = (offset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + offset * 7);
    return monday;
  };

  const getWeekDays = (offset) => {
    const monday = getMondayOfWeek(offset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const renderCalendar = () => {
    const days = getWeekDays(weekOffset);
    const monday = days[0];
    const sunday = days[6];
    const todayStr = toDateStr(new Date());

    weekLabelEl.textContent = `${monday.getDate()} ${MONTH_NAMES[monday.getMonth()]} – ${sunday.getDate()} ${MONTH_NAMES[sunday.getMonth()]} ${sunday.getFullYear()}`;
    prevWeekBtn.disabled = weekOffset <= 0;

    calendarEl.innerHTML = "";

    days.forEach((dateObj) => {
      const dateStr = toDateStr(dateObj);
      const closed = dateObj.getDay() === 0;
      const isPast = dateStr < todayStr;

      const daySlots = allSlots
        .filter((s) => slotDateStr(s.slot_date) === dateStr)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const allActive = daySlots.length > 0 && daySlots.every((s) => Number(s.is_active) === 1);
      const anyActive = daySlots.some((s) => Number(s.is_active) === 1);
      const bookedCount = daySlots.reduce((acc, s) => acc + (Number(s.booked_count) || 0), 0);

      let dotClass = "avail-dot--off";
      if (closed || isPast) dotClass = "avail-dot--closed";
      else if (allActive) dotClass = "avail-dot--open";
      else if (anyActive) dotClass = "avail-dot--partial";

      const statusLabel = closed ? "Gesloten"
        : isPast ? "Verleden"
        : allActive ? "Alles open"
        : anyActive ? "Gedeeltelijk"
        : "Uitgeschakeld";

      const dayCard = document.createElement("div");
      dayCard.className = `avail-day-card${closed ? " avail-day-closed" : ""}${isPast ? " avail-day-past" : ""}`;

      dayCard.innerHTML = `
        <div class="avail-day-header">
          <div class="avail-day-meta">
            <span class="avail-dot ${dotClass}"></span>
            <div>
              <span class="avail-day-name">${DAY_NAMES_FULL[dateObj.getDay()]}</span>
              <span class="avail-day-date">${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]}</span>
            </div>
          </div>
          <div class="avail-day-controls">
            ${bookedCount > 0 ? `<span class="avail-booked-badge">${bookedCount} boeking${bookedCount !== 1 ? "en" : ""}</span>` : ""}
            <span class="avail-status-label">${statusLabel}</span>
            ${!closed && !isPast ? `
              <label class="avail-toggle" title="${allActive ? "Dag uitschakelen" : "Dag inschakelen"}">
                <input type="checkbox" class="avail-toggle-input" data-date="${dateStr}" ${allActive ? "checked" : ""} />
                <span class="avail-toggle-slider"></span>
              </label>
            ` : ""}
          </div>
        </div>
        ${!closed ? `<div class="avail-slots-grid" id="slots-${dateStr}"></div>` : ""}
      `;

      calendarEl.appendChild(dayCard);

      if (!closed) {
        const slotsGrid = dayCard.querySelector(`#slots-${dateStr}`);

        if (daySlots.length === 0) {
          slotsGrid.innerHTML = `<p class="avail-no-slots">Geen tijdsloten voor deze dag.</p>`;
        } else {
          daySlots.forEach((slot) => {
            const active = Number(slot.is_active) === 1;
            const slotBtn = document.createElement("button");
            slotBtn.type = "button";
            slotBtn.disabled = isPast;
            slotBtn.className = `avail-slot-btn ${active ? "avail-slot--active" : "avail-slot--inactive"}${isPast ? " avail-slot--past" : ""}`;
            slotBtn.innerHTML = `
              <span class="avail-slot-time">${slot.start_time.slice(0, 5)}</span>
              <span class="avail-slot-sep">–</span>
              <span class="avail-slot-time">${slot.end_time.slice(0, 5)}</span>
              <span class="avail-slot-status">${active ? "aan" : "uit"}</span>
            `;

            if (!isPast) {
              slotBtn.addEventListener("click", async () => {
                slotBtn.disabled = true;
                try {
                  await apiFetch(`/api/admin/availability/${slot.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      slotDate: dateStr,
                      startTime: slot.start_time,
                      endTime: slot.end_time,
                      capacity: slot.capacity,
                      isActive: !active,
                    }),
                  });
                  await refreshCalendar();
                } catch {
                  slotBtn.disabled = false;
                }
              });
            }

            slotsGrid.appendChild(slotBtn);
          });
        }

        const toggle = dayCard.querySelector(".avail-toggle-input");
        if (toggle) {
          toggle.addEventListener("change", async () => {
            const newActive = toggle.checked;
            toggle.disabled = true;
            try {
              await apiFetch(`/api/admin/availability/day/${dateStr}`, {
                method: "PATCH",
                body: JSON.stringify({ isActive: newActive }),
              });
              await refreshCalendar();
            } catch {
              toggle.checked = !newActive;
              toggle.disabled = false;
            }
          });
        }
      }
    });
  };

  const refreshCalendar = async () => {
    allSlots = await apiFetch("/api/admin/availability");
    renderCalendar();
  };

  prevWeekBtn.addEventListener("click", () => {
    if (weekOffset > 0) { weekOffset -= 1; renderCalendar(); }
  });

  nextWeekBtn.addEventListener("click", () => {
    weekOffset += 1;
    renderCalendar();
  });

  const waitForAuth = setInterval(() => {
    const dashboard = document.querySelector("#admin-dashboard");
    if (dashboard && !dashboard.classList.contains("hidden")) {
      clearInterval(waitForAuth);
      refreshCalendar();
    }
  }, 250);
})();

const days = [
  { id: "day1", label: "Day 1", date: "July 28"},
  { id: "day2", label: "Day 2", date: "July 29"},
  { id: "day3", label: "Day 3", date: "July 30"},
  { id: "day4", label: "Day 4", date: "July 30"},
  { id: "day5", label: "Day 5", date: "August 01"},
];

const fallbackState = {
  selectedDay: "all",
  friends: [
    { id: "f1", name: "Yubin", status: "confirmed" },
    { id: "f2", name: "Junho", status: "confirmed" },
    { id: "f3", name: "Seoyeon", status: "pending" },
    { id: "f4", name: "Me", status: "confirmed" },
  ],
  activities: [
    {
      id: "a1",
      day: "day1",
      time: "14:30",
      title: "Meet at Calgary Airport and pick up rental car",
      owner: "Junho",
    },
    {
      id: "a2",
      day: "day2",
      time: "08:00",
      title: "Take the Lake Louise shuttle",
      owner: "Minji",
    },
    {
      id: "a3",
      day: "day2",
      time: "13:30",
      title: "Plain of Six Glaciers Teahouse hike",
      owner: "Me",
    },
    {
      id: "a4",
      day: "day3",
      time: "05:40",
      title: "Watch sunrise at Moraine Lake",
      owner: "Seoyeon",
    },
    {
      id: "a5",
      day: "day4",
      time: "18:30",
      title: "Dinner reservation on Banff Ave",
      owner: "Minji",
    },
  ],
  packing: [
    { id: "p1", item: "Confirm national park pass", done: true },
    { id: "p2", item: "Layered jacket", done: false },
    { id: "p3", item: "Motion sickness meds and first-aid kit", done: false },
  ],
  budget: [
    { id: "b1", name: "Lodging", amount: 1120 },
    { id: "b2", name: "Rental car", amount: 420 },
    { id: "b3", name: "Shuttles / entry", amount: 180 },
  ],
};

let state = loadState();

const elements = {
  dayInput: document.querySelector("#dayInput"),
  dayTabs: document.querySelector("#dayTabs"),
  timeline: document.querySelector("#timeline"),
  activityForm: document.querySelector("#activityForm"),
  timeInput: document.querySelector("#timeInput"),
  titleInput: document.querySelector("#titleInput"),
  ownerInput: document.querySelector("#ownerInput"),
  activityCount: document.querySelector("#activityCount"),
  friendCount: document.querySelector("#friendCount"),
  totalCost: document.querySelector("#totalCost"),
  perPersonCost: document.querySelector("#perPersonCost"),
  friendForm: document.querySelector("#friendForm"),
  friendInput: document.querySelector("#friendInput"),
  friendList: document.querySelector("#friendList"),
  packingForm: document.querySelector("#packingForm"),
  packingInput: document.querySelector("#packingInput"),
  packingList: document.querySelector("#packingList"),
  budgetForm: document.querySelector("#budgetForm"),
  budgetNameInput: document.querySelector("#budgetNameInput"),
  budgetAmountInput: document.querySelector("#budgetAmountInput"),
  budgetList: document.querySelector("#budgetList"),
  copyPlanButton: document.querySelector("#copyPlanButton"),
  toast: document.querySelector("#toast"),
};

function loadState() {
  const saved = localStorage.getItem("banff-crew-planner-en");
  if (!saved) return structuredClone(fallbackState);

  try {
    return { ...structuredClone(fallbackState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(fallbackState);
  }
}

function saveState() {
  localStorage.setItem("banff-crew-planner-en", JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function initControls() {
  elements.dayInput.innerHTML = days
    .map((day) => `<option value="${day.id}">${day.label} - ${day.date}</option>`)
    .join("");

  elements.dayTabs.innerHTML = [
    `<button class="${state.selectedDay === "all" ? "active" : ""}" type="button" data-day="all">All</button>`,
    ...days.map(
      (day) =>
        `<button class="${state.selectedDay === day.id ? "active" : ""}" type="button" data-day="${day.id}">${day.label}</button>`,
    ),
  ].join("");
}

function render() {
  initControls();
  renderSummary();
  renderTimeline();
  renderFriends();
  renderPacking();
  renderBudget();
}

function renderSummary() {
  const confirmedFriends = state.friends.filter((friend) => friend.status === "confirmed").length;
  const total = state.budget.reduce((sum, item) => sum + Number(item.amount), 0);
  const divisor = Math.max(confirmedFriends, 1);

  elements.activityCount.textContent = state.activities.length;
  elements.friendCount.textContent = state.friends.length;
  elements.totalCost.textContent = formatCurrency(total);
  elements.perPersonCost.textContent = formatCurrency(total / divisor);
}

function renderTimeline() {
  const visibleDays = state.selectedDay === "all" ? days : days.filter((day) => day.id === state.selectedDay);
  const markup = visibleDays
    .map((day) => {
      const dayActivities = state.activities
        .filter((activity) => activity.day === day.id)
        .sort((left, right) => left.time.localeCompare(right.time));

      if (!dayActivities.length) {
        return `<div class="day-group">
          <div class="day-title"><span>${day.label} - ${day.date}</span><span>${day.title}</span></div>
          <div class="empty-state">No activities yet.</div>
        </div>`;
      }

      return `<div class="day-group">
        <div class="day-title"><span>${day.label} - ${day.date}</span><span>${day.title}</span></div>
        ${dayActivities
          .map(
            (activity) => `<article class="activity-card">
              <div class="time">${activity.time}</div>
              <div>
                <h3>${escapeHtml(activity.title)}</h3>
                <p>${activity.owner ? `Owner: ${escapeHtml(activity.owner)}` : "Owner not assigned"}</p>
              </div>
              <button class="icon-button" type="button" aria-label="Delete activity" data-remove-activity="${activity.id}">x</button>
            </article>`,
          )
          .join("")}
      </div>`;
    })
    .join("");

  elements.timeline.innerHTML = markup;
}

function renderFriends() {
  elements.friendList.innerHTML = state.friends
    .map(
      (friend) => `<div class="friend-chip">
        <span>${escapeHtml(friend.name)}</span>
        <div class="friend-actions">
          <button class="status-toggle ${friend.status === "pending" ? "pending" : ""}" type="button" data-toggle-friend="${friend.id}">
            ${friend.status === "confirmed" ? "Confirmed" : "Pending"}
          </button>
          <button class="icon-button" type="button" aria-label="Delete friend" data-remove-friend="${friend.id}">x</button>
        </div>
      </div>`,
    )
    .join("");
}


function renderPacking() {
  elements.packingList.innerHTML = state.packing
    .map(
      (item) => `<div class="check-row ${item.done ? "done" : ""}">
        <button class="check-toggle" type="button" aria-label="Toggle packing item" data-toggle-packing="${item.id}">
          ${item.done ? "OK" : ""}
        </button>
        <span>${escapeHtml(item.item)}</span>
        <button class="icon-button" type="button" aria-label="Delete packing item" data-remove-packing="${item.id}">x</button>
      </div>`,
    )
    .join("");
}

function renderBudget() {
  elements.budgetList.innerHTML = state.budget
    .map(
      (item) => `<div class="budget-row">
        <span>${escapeHtml(item.name)}</span>
        <strong>${formatCurrency(Number(item.amount))}</strong>
        <button class="icon-button" type="button" aria-label="Delete cost" data-remove-budget="${item.id}">x</button>
      </div>`,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 1800);
}

elements.activityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.activities.push({
    id: createId("a"),
    day: elements.dayInput.value,
    time: elements.timeInput.value,
    title: elements.titleInput.value.trim(),
    owner: elements.ownerInput.value.trim(),
  });
  elements.activityForm.reset();
  elements.timeInput.value = "09:00";
  saveState();
  render();
  showToast("Activity added.");
});

elements.friendForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.friends.push({
    id: createId("f"),
    name: elements.friendInput.value.trim(),
    status: "pending",
  });
  elements.friendForm.reset();
  saveState();
  render();
});

elements.packingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.packing.push({
    id: createId("p"),
    item: elements.packingInput.value.trim(),
    done: false,
  });
  elements.packingForm.reset();
  saveState();
  render();
});

elements.budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.budget.push({
    id: createId("b"),
    name: elements.budgetNameInput.value.trim(),
    amount: Number(elements.budgetAmountInput.value),
  });
  elements.budgetForm.reset();
  saveState();
  render();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const day = target.dataset.day;
  if (day) {
    state.selectedDay = day;
    saveState();
    render();
  }

  const activityId = target.dataset.removeActivity;
  if (activityId) {
    state.activities = state.activities.filter((activity) => activity.id !== activityId);
    saveState();
    render();
  }

  const friendId = target.dataset.toggleFriend;
  if (friendId) {
    state.friends = state.friends.map((friend) =>
      friend.id === friendId
        ? { ...friend, status: friend.status === "confirmed" ? "pending" : "confirmed" }
        : friend,
    );
    saveState();
    render();
  }

  const removeFriendId = target.dataset.removeFriend;
if (removeFriendId) {
  state.friends = state.friends.filter((friend) => friend.id !== removeFriendId);
  saveState();
  render();
}

  const packingId = target.dataset.togglePacking;
  if (packingId) {
    state.packing = state.packing.map((item) =>
      item.id === packingId ? { ...item, done: !item.done } : item,
    );
    saveState();
    render();
  }

  const removePackingId = target.dataset.removePacking;
  if (removePackingId) {
    state.packing = state.packing.filter((item) => item.id !== removePackingId);
    saveState();
    render();
  }

  const budgetId = target.dataset.removeBudget;
  if (budgetId) {
    state.budget = state.budget.filter((item) => item.id !== budgetId);
    saveState();
    render();
  }
});

elements.copyPlanButton.addEventListener("click", async () => {
  const summary = buildShareSummary();
  try {
    await navigator.clipboard.writeText(summary);
    showToast("Share summary copied.");
  } catch {
    showToast("Copy was blocked. Please check your browser permissions.");
  }
});

function buildShareSummary() {
  const lines = ["Banff Trip Plan", ""];

  days.forEach((day) => {
    lines.push(`${day.label} - ${day.date} - ${day.title}`);
    const items = state.activities
      .filter((activity) => activity.day === day.id)
      .sort((left, right) => left.time.localeCompare(right.time));

    if (!items.length) {
      lines.push("- No activities yet");
    } else {
      items.forEach((activity) => {
        const owner = activity.owner ? ` / Owner: ${activity.owner}` : "";
        lines.push(`- ${activity.time} ${activity.title}${owner}`);
      });
    }
    lines.push("");
  });

  const total = state.budget.reduce((sum, item) => sum + Number(item.amount), 0);
  lines.push(`Friends: ${state.friends.map((friend) => friend.name).join(", ")}`);
  lines.push(`Estimated total: ${formatCurrency(total)}`);

  return lines.join("\n");
}

render();

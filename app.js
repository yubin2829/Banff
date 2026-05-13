import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// IMPORTANT:
// Replace every PASTE_... value below with the firebaseConfig from your Firebase web app.
// Firebase Console > Project settings > Your apps > Web app > SDK setup and configuration.
const firebaseConfig = {
  apiKey: "AIzaSyAFPA2KTorR_k1gckl_jUGeqyL_B62dzrA",
  authDomain: "banff0728.firebaseapp.com",
  projectId: "banff0728",
  storageBucket: "banff0728.firebasestorage.app",
  messagingSenderId: "734114233034",
  appId: "1:734114233034:web:5c0827304752ab89c55233",
  measurementId: "G-QW4XJ6E1D5"
};

const days = [
  { id: "day1", label: "Day 1", date: "July 28" },
  { id: "day2", label: "Day 2", date: "July 29"},
  { id: "day3", label: "Day 3", date: "July 30"},
  { id: "day4", label: "Day 4", date: "July 31"},
  { id: "day5", label: "Day 5", date: "August 1"},
];

const fallbackState = {
  friends: [
    { id: "f1", name: "Yubin", status: "confirmed" },
    { id: "f2", name: "Klein", status: "confirmed" },
    { id: "f3", name: "Kevin", status: "confirmed" },
    { id: "f4", name: "Gwyneth", status: "confirmed" },
    { id: "f5", name: "BJ", status: "confirmed" },
  ],
  activities: [
    {
      id: "a1",
      day: "day1",
      time: "14:30",
      title: "Meet at Calgary Airport and pick up rental car",
      owner: "Yubin",
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

let state = structuredClone(fallbackState);
let selectedDay = "all";
let tripRef = null;
let firebaseReady = false;
let saveTimer = null;

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
  syncStatus: document.querySelector("#syncStatus"),
  toast: document.querySelector("#toast"),
};

function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value && !value.startsWith("PASTE_"),
  );
}

function startFirebase() {
  if (!isFirebaseConfigured()) {
    setSyncStatus("Local only", "local");
    showToast("Add your Firebase config in app.js to enable shared saving.");
    return;
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    const db = getFirestore(firebaseApp);
    tripRef = doc(db, "trips", "banff0728-shared");
    firebaseReady = true;
    setSyncStatus("Connecting", "");

    onSnapshot(
      tripRef,
      (snapshot) => {
        if (snapshot.exists()) {
          state = normalizeState(snapshot.data());
          setSyncStatus("Live sync", "live");
        } else {
          state = structuredClone(fallbackState);
          saveStateNow();
          setSyncStatus("Live sync", "live");
        }

        render();
      },
      (error) => {
        console.error("Firebase connection failed:", error);
        firebaseReady = false;
        setSyncStatus("Sync error", "error");
        showToast("Firebase connection failed. Check Firestore rules and config.");
        render();
      },
    );
  } catch (error) {
    console.error("Firebase setup failed:", error);
    firebaseReady = false;
    setSyncStatus("Setup error", "error");
    showToast("Firebase setup failed. Check app.js config.");
  }
}

function normalizeState(data = {}) {
  return {
    friends: Array.isArray(data.friends) ? data.friends : structuredClone(fallbackState.friends),
    activities: Array.isArray(data.activities) ? data.activities : structuredClone(fallbackState.activities),
    packing: Array.isArray(data.packing) ? data.packing : structuredClone(fallbackState.packing),
    budget: Array.isArray(data.budget) ? data.budget : structuredClone(fallbackState.budget),
  };
}

function saveState() {
  render();

  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveStateNow();
  }, 150);
}

async function saveStateNow() {
  if (!firebaseReady || !tripRef) {
    localStorage.setItem("banff-trip-local-backup", JSON.stringify(state));
    return;
  }

  try {
    await setDoc(tripRef, {
      ...state,
      updatedAt: new Date().toISOString(),
    });
    setSyncStatus("Live sync", "live");
  } catch (error) {
    console.error("Firebase save failed:", error);
    setSyncStatus("Save error", "error");
    showToast("Save failed. Check Firestore rules.");
  }
}

function createId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setSyncStatus(text, mode) {
  elements.syncStatus.textContent = text;
  elements.syncStatus.className = `sync-status ${mode || ""}`.trim();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function initControls() {
  elements.dayInput.innerHTML = days
    .map((day) => `<option value="${day.id}">${day.label} - ${day.date}</option>`)
    .join("");

  elements.dayTabs.innerHTML = [
    `<button class="${selectedDay === "all" ? "active" : ""}" type="button" data-day="all">All</button>`,
    ...days.map(
      (day) =>
        `<button class="${selectedDay === day.id ? "active" : ""}" type="button" data-day="${day.id}">${day.label}</button>`,
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
  const total = state.budget.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const divisor = Math.max(confirmedFriends, 1);

  elements.activityCount.textContent = state.activities.length;
  elements.friendCount.textContent = state.friends.length;
  elements.totalCost.textContent = formatCurrency(total);
  elements.perPersonCost.textContent = formatCurrency(total / divisor);
}

function renderTimeline() {
  const visibleDays = selectedDay === "all" ? days : days.filter((day) => day.id === selectedDay);

  elements.timeline.innerHTML = visibleDays
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
        <button class="check-toggle" type="button" aria-label="Toggle packing item" data-toggle-packing="${item.id}">${item.done ? "OK" : ""}</button>
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
        <strong>${formatCurrency(item.amount)}</strong>
        <button class="icon-button" type="button" aria-label="Delete cost" data-remove-budget="${item.id}">x</button>
      </div>`,
    )
    .join("");
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
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.day) {
    selectedDay = target.dataset.day;
    render();
    return;
  }

  if (target.dataset.removeActivity) {
    state.activities = state.activities.filter((activity) => activity.id !== target.dataset.removeActivity);
    saveState();
    return;
  }

  if (target.dataset.toggleFriend) {
    state.friends = state.friends.map((friend) =>
      friend.id === target.dataset.toggleFriend
        ? { ...friend, status: friend.status === "confirmed" ? "pending" : "confirmed" }
        : friend,
    );
    saveState();
    return;
  }

  if (target.dataset.removeFriend) {
    state.friends = state.friends.filter((friend) => friend.id !== target.dataset.removeFriend);
    saveState();
    return;
  }

  if (target.dataset.togglePacking) {
    state.packing = state.packing.map((item) =>
      item.id === target.dataset.togglePacking ? { ...item, done: !item.done } : item,
    );
    saveState();
    return;
  }

  if (target.dataset.removePacking) {
    state.packing = state.packing.filter((item) => item.id !== target.dataset.removePacking);
    saveState();
    return;
  }

  if (target.dataset.removeBudget) {
    state.budget = state.budget.filter((item) => item.id !== target.dataset.removeBudget);
    saveState();
  }
});

elements.copyPlanButton.addEventListener("click", async () => {
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
        lines.push(`- ${activity.time} ${activity.title}${activity.owner ? ` / Owner: ${activity.owner}` : ""}`);
      });
    }

    lines.push("");
  });

  const total = state.budget.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  lines.push(`Friends: ${state.friends.map((friend) => friend.name).join(", ")}`);
  lines.push(`Estimated total: ${formatCurrency(total)}`);

  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("Share summary copied.");
  } catch {
    showToast("Copy was blocked.");
  }
});

render();
startFirebase();

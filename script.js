const STORAGE_KEYS = {
  tasks: "productivity-dashboard-tasks",
  theme: "productivity-dashboard-theme",
  user: "productivity-dashboard-user",
  categories: "productivity-dashboard-categories"
};

const baseCategories = [
  { name: "Work", icon: "💼", className: "category-work", locked: true },
  { name: "Study", icon: "📚", className: "category-study", locked: true },
  { name: "Personal", icon: "👤", className: "category-personal", locked: true }
];

const priorityMeta = {
  High: { className: "priority-high" },
  Medium: { className: "priority-medium" },
  Low: { className: "priority-low" }
};

const state = {
  tasks: loadTasks(),
  categories: loadCategories(),
  filter: "all",
  view: "tasks",
  showAllCategorySummary: false,
  search: "",
  editingId: null,
  userName: localStorage.getItem(STORAGE_KEYS.user) || "Janaki",
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light"
};

const elements = {
  body: document.body,
  sidebar: document.getElementById("sidebar"),
  openSidebar: document.getElementById("openSidebar"),
  mobileBackdrop: document.getElementById("mobileBackdrop"),
  greetingText: document.getElementById("greetingText"),
  dateText: document.getElementById("dateText"),
  sidebarName: document.getElementById("sidebarName"),
  avatarInitial: document.getElementById("avatarInitial"),
  taskForm: document.getElementById("taskForm"),
  taskInput: document.getElementById("taskInput"),
  categorySelect: document.getElementById("categorySelect"),
  categoriesView: document.getElementById("categoriesView"),
  categoryForm: document.getElementById("categoryForm"),
  newCategoryInput: document.getElementById("newCategoryInput"),
  categoryGrid: document.getElementById("categoryGrid"),
  prioritySelect: document.getElementById("prioritySelect"),
  submitTask: document.getElementById("submitTask"),
  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  focusAddForm: document.getElementById("focusAddForm"),
  filterTabs: document.querySelectorAll(".filter-tab"),
  navItems: document.querySelectorAll(".nav-item"),
  totalCount: document.getElementById("totalCount"),
  completedCount: document.getElementById("completedCount"),
  pendingCount: document.getElementById("pendingCount"),
  progressRing: document.getElementById("progressRing"),
  progressPercent: document.getElementById("progressPercent"),
  progressMessage: document.getElementById("progressMessage"),
  categorySummary: document.getElementById("categorySummary"),
  categoryViewButton: document.querySelector("[data-view-link]"),
  themeToggle: document.getElementById("themeToggle"),
  quickThemeToggle: document.getElementById("quickThemeToggle"),
  settingsThemeToggle: document.getElementById("settingsThemeToggle"),
  themeLabel: document.getElementById("themeLabel"),
  themeLabelIcon: document.getElementById("themeLabelIcon"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettings: document.getElementById("closeSettings"),
  settingsForm: document.getElementById("settingsForm"),
  nameInput: document.getElementById("nameInput"),
  resetTasks: document.getElementById("resetTasks")
};

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEYS.tasks);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  return [];
}

function loadCategories() {
  const saved = localStorage.getItem(STORAGE_KEYS.categories);
  if (!saved) return baseCategories;

  try {
    const customCategories = JSON.parse(saved)
      .filter((category) => category.name)
      .map((category) => ({
        name: category.name,
        icon: category.icon || "✦",
        className: category.className || "category-custom",
        locked: false
      }));
    return [...baseCategories, ...customCategories];
  } catch {
    return baseCategories;
  }
}

function saveCustomCategories() {
  const customCategories = state.categories.filter((category) => !category.locked);
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(customCategories));
}

function refreshCategoriesFromStorage() {
  state.categories = loadCategories();
  renderCategoryOptions();
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  const isDark = theme === "dark";
  elements.themeToggle.checked = isDark;
  elements.settingsThemeToggle.checked = isDark;
  elements.quickThemeToggle.textContent = isDark ? "☀" : "☼";
  elements.themeLabel.textContent = isDark ? "Dark Mode" : "Light Mode";
  elements.themeLabelIcon.textContent = isDark ? "☾" : "☀";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function updateDateAndGreeting() {
  const today = new Date();
  elements.greetingText.textContent = `${getGreeting()}, ${state.userName} 👋`;
  elements.dateText.textContent = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

}

function updateUserUI(syncInput = true) {
  const cleanName = state.userName.trim() || "Janaki";
  state.userName = cleanName;
  localStorage.setItem(STORAGE_KEYS.user, cleanName);
  elements.sidebarName.textContent = cleanName;
  elements.avatarInitial.textContent = cleanName.charAt(0).toUpperCase();
  if (syncInput) {
    elements.nameInput.value = cleanName;
  }
  updateDateAndGreeting();
}

function getVisibleTasks() {
  return state.tasks.filter((task) => {
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "completed" && task.completed) ||
      (state.filter === "pending" && !task.completed);
    const matchesSearch = task.title.toLowerCase().includes(state.search.toLowerCase());
    return matchesFilter && matchesSearch;
  });
}

function getCategoryMeta(categoryName) {
  return state.categories.find((category) => category.name === categoryName) || {
    name: categoryName,
    icon: "•",
    className: "category-custom",
    locked: false
  };
}

function renderCategoryOptions() {
  const currentValue = elements.categorySelect.value || "Work";
  elements.categorySelect.innerHTML = "";

  state.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = `${category.icon} ${category.name}`;
    elements.categorySelect.appendChild(option);
  });

  elements.categorySelect.value = state.categories.some((category) => category.name === currentValue)
    ? currentValue
    : state.categories[0].name;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  elements.taskList.innerHTML = "";
  elements.emptyState.style.display = visibleTasks.length ? "none" : "block";

  visibleTasks.forEach((task) => {
    const category = getCategoryMeta(task.category);
    const priority = priorityMeta[task.priority];
    const item = document.createElement("li");
    item.className = `task-item ${task.completed ? "completed" : ""}`;
    item.innerHTML = `
      <button class="task-check" aria-label="${task.completed ? "Mark pending" : "Mark complete"}">${task.completed ? "✓" : ""}</button>
      <span class="task-title"></span>
      <div class="badges">
        <span class="badge ${category.className}">${category.icon} ${task.category}</span>
        <span class="badge ${priority.className}">${task.priority}</span>
      </div>
      <div class="task-actions">
        <button class="task-action edit" aria-label="Edit task">✎</button>
        <button class="task-action delete" aria-label="Delete task">⌫</button>
      </div>
    `;

    item.querySelector(".task-title").textContent = task.title;
    item.querySelector(".task-check").addEventListener("click", () => toggleTask(task.id));
    item.querySelector(".edit").addEventListener("click", () => editTask(task.id));
    item.querySelector(".delete").addEventListener("click", () => deleteTask(task.id));
    elements.taskList.appendChild(item);
  });
}

function renderAnalytics() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  elements.totalCount.textContent = total;
  elements.completedCount.textContent = completed;
  elements.pendingCount.textContent = pending;
  elements.progressRing.style.setProperty("--progress", progress);
  elements.progressPercent.textContent = `${progress}%`;
  elements.progressMessage.textContent = progress >= 70 ? "Great job! Keep it up." : progress > 0 ? "Nice momentum. Keep going." : "Ready when you are.";

  elements.categorySummary.innerHTML = "";
  const summaryCategories = state.showAllCategorySummary ? state.categories : baseCategories;

  summaryCategories.forEach((category) => {
    const count = state.tasks.filter((task) => task.category === category.name).length;
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `<span>${category.icon}</span><span>${category.name}</span><strong>${count}</strong>`;
    elements.categorySummary.appendChild(row);
  });

  elements.categoryViewButton.textContent = state.showAllCategorySummary ? "Show less" : "View all";
}

function renderCategoryGrid() {
  elements.categoryGrid.innerHTML = "";

  state.categories.forEach((category) => {
    const count = state.tasks.filter((task) => task.category === category.name).length;
    const tile = document.createElement("article");
    tile.className = "category-tile";
    tile.innerHTML = `
      <div class="category-tile-head">
        <span class="category-tile-icon">${category.icon}</span>
        <strong>${category.name}</strong>
      </div>
      <p>${count} ${count === 1 ? "task" : "tasks"}</p>
      ${category.locked ? "" : '<button class="category-delete" type="button">Delete category</button>'}
    `;

    const deleteButton = tile.querySelector(".category-delete");
    if (deleteButton) {
      deleteButton.addEventListener("click", () => deleteCategory(category.name));
    }

    elements.categoryGrid.appendChild(tile);
  });
}

function render() {
  renderCategoryOptions();
  renderTasks();
  renderAnalytics();
  renderCategoryGrid();
}

function addOrUpdateTask(event) {
  event.preventDefault();
  const title = elements.taskInput.value.trim();
  if (!title) return;

  if (state.editingId) {
    state.tasks = state.tasks.map((task) =>
      task.id === state.editingId
        ? { ...task, title, category: elements.categorySelect.value, priority: elements.prioritySelect.value }
        : task
    );
    state.editingId = null;
    elements.submitTask.textContent = "Add Task";
  } else {
    state.tasks.unshift({
      id: createId(),
      title,
      category: elements.categorySelect.value,
      priority: elements.prioritySelect.value,
      completed: false,
      createdAt: Date.now()
    });
  }

  elements.taskForm.reset();
  elements.categorySelect.value = state.categories[0].name;
  elements.prioritySelect.value = "High";
  saveTasks();
  render();
}

function toggleTask(id) {
  state.tasks = state.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function editTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  state.editingId = id;
  elements.taskInput.value = task.title;
  elements.categorySelect.value = task.category;
  elements.prioritySelect.value = task.priority;
  elements.submitTask.textContent = "Save Task";
  elements.taskInput.focus();
}

function setFilter(filter) {
  state.filter = filter;
  state.view = "tasks";
  elements.filterTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.filter === filter));
  elements.categoriesView.classList.add("hidden");
  document.querySelector(".tasks-card").classList.remove("hidden");
  document.querySelector(".filter-tabs").classList.remove("hidden");
  renderTasks();
}

function showCategoriesView() {
  state.view = "categories";
  refreshCategoriesFromStorage();
  elements.categoriesView.classList.remove("hidden");
  document.querySelector(".tasks-card").classList.add("hidden");
  document.querySelector(".filter-tabs").classList.add("hidden");
  renderCategoryGrid();
}

function setActiveNav(activeItem) {
  elements.navItems.forEach((item) => item.classList.toggle("active", item === activeItem));
}

function addCategory(event) {
  event.preventDefault();
  const name = elements.newCategoryInput.value.trim();
  if (!name) return;

  const exists = state.categories.some((category) => category.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    elements.newCategoryInput.value = "";
    return;
  }

  state.categories.push({
    name,
    icon: "✦",
    className: "category-custom",
    locked: false
  });

  elements.newCategoryInput.value = "";
  saveCustomCategories();
  render();
  showCategoriesView();
}

function deleteCategory(categoryName) {
  const hasTasks = state.tasks.some((task) => task.category === categoryName);
  if (hasTasks) {
    alert("Move or delete tasks in this category before deleting it.");
    return;
  }

  state.categories = state.categories.filter((category) => category.name !== categoryName || category.locked);
  saveCustomCategories();
  render();
  showCategoriesView();
}

function openSettings() {
  elements.nameInput.value = state.userName;
  elements.settingsModal.classList.add("open");
  elements.settingsModal.setAttribute("aria-hidden", "false");
  elements.nameInput.focus();
}

function closeSettings() {
  elements.settingsModal.classList.remove("open");
  elements.settingsModal.setAttribute("aria-hidden", "true");
}

function openMobileSidebar() {
  elements.sidebar.classList.add("open");
  elements.mobileBackdrop.classList.add("open");
}

function closeMobileSidebar() {
  elements.sidebar.classList.remove("open");
  elements.mobileBackdrop.classList.remove("open");
}

function bindEvents() {
  elements.taskForm.addEventListener("submit", addOrUpdateTask);
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderTasks();
  });

  elements.focusAddForm.addEventListener("click", () => elements.taskInput.focus());
  elements.filterTabs.forEach((tab) => tab.addEventListener("click", () => setFilter(tab.dataset.filter)));
  elements.categoryForm.addEventListener("submit", addCategory);

  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (item.hasAttribute("data-open-settings")) {
        openSettings();
      } else if (item.dataset.view === "categories") {
        showCategoriesView();
        setActiveNav(item);
      } else if (item.dataset.view === "dashboard" || item.dataset.view === "all") {
        setFilter("all");
        setActiveNav(item);
      } else {
        setFilter(item.dataset.view);
        setActiveNav(item);
      }
      closeMobileSidebar();
    });
  });

  document.querySelectorAll("[data-open-settings]").forEach((button) => {
    button.addEventListener("click", openSettings);
  });

  document.querySelectorAll("[data-view-link]").forEach((button) => {
    button.addEventListener("click", () => {
      refreshCategoriesFromStorage();
      state.showAllCategorySummary = !state.showAllCategorySummary;
      renderAnalytics();
    });
  });

  [elements.themeToggle, elements.settingsThemeToggle].forEach((toggle) => {
    toggle.addEventListener("change", (event) => applyTheme(event.target.checked ? "dark" : "light"));
  });

  elements.quickThemeToggle.addEventListener("click", () => applyTheme(state.theme === "dark" ? "light" : "dark"));
  elements.openSidebar.addEventListener("click", openMobileSidebar);
  elements.mobileBackdrop.addEventListener("click", closeMobileSidebar);
  elements.closeSettings.addEventListener("click", closeSettings);
  elements.settingsModal.addEventListener("click", (event) => {
    if (event.target === elements.settingsModal) closeSettings();
  });

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.userName = elements.nameInput.value.trim() || "Janaki";
    updateUserUI();
    closeSettings();
  });

  elements.nameInput.addEventListener("input", (event) => {
    const typedName = event.target.value.trim();
    if (!typedName) return;
    state.userName = typedName;
    updateUserUI(false);
  });

  elements.resetTasks.addEventListener("click", () => {
    const shouldReset = confirm("Reset all tasks? This cannot be undone.");
    if (!shouldReset) return;
    state.tasks = [];
    saveTasks();
    render();
    closeSettings();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSettings();
      closeMobileSidebar();
    }
  });
}

function init() {
  applyTheme(state.theme);
  updateUserUI();
  updateDateAndGreeting();
  bindEvents();
  render();
  setInterval(updateDateAndGreeting, 60 * 1000);
}

init();

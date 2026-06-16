// Upgraded Todo / Task Board Module for RoutineFlow
import confetti from 'canvas-confetti';

let tasks = [];

export function initTodo() {
  loadTasks();
  setupEventListeners();
  renderTasks('all');
  updateDashboardTaskWidgets();
}

function loadTasks() {
  const data = localStorage.getItem('the_routine_tasks');
  if (data) {
    try {
      tasks = JSON.parse(data);
    } catch (e) {
      tasks = [];
    }
  } else {
    tasks = [
      {
        id: '1',
        title: 'Review Machine Learning Algorithms Lecture notes',
        category: 'Study',
        priority: 'High',
        dueDate: getOffsetDateString(0), // Today
        completed: false,
        subtasks: [
          { id: 's1', text: 'Study Gradient Descent formulas', completed: true },
          { id: 's2', text: 'Solve quiz practice problems', completed: false }
        ]
      },
      {
        id: '2',
        title: 'Implement Agora/Daily.co Floating Video Call Tile',
        category: 'Project',
        priority: 'High',
        dueDate: getOffsetDateString(1), // Tomorrow
        completed: false,
        subtasks: [
          { id: 's3', text: 'Set up draggable wrapper element', completed: false },
          { id: 's4', text: 'Design speaker ring glow audio indicator', completed: false }
        ]
      },
      {
        id: '3',
        title: 'Submit Literature review essay draft',
        category: 'Assignment',
        priority: 'Medium',
        dueDate: getOffsetDateString(3),
        completed: false,
        subtasks: []
      }
    ];
    saveTasks();
  }
}

function saveTasks() {
  localStorage.setItem('the_routine_tasks', JSON.stringify(tasks));
}

function setupEventListeners() {
  const form = document.getElementById('task-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('task-title');
      const categoryInput = document.getElementById('task-category');
      const priorityInput = document.getElementById('task-priority');
      const dateInput = document.getElementById('task-due-date');

      const title = titleInput.value.trim();
      const category = categoryInput.value;
      const priority = priorityInput.value;
      const dueDate = dateInput.value;

      if (title) {
        addTask(title, category, priority, dueDate);
        titleInput.value = '';
        dateInput.value = '';
      }
    });
  }

  // Filter badges
  const filters = document.querySelectorAll('.filter-badge');
  filters.forEach(badge => {
    badge.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      badge.classList.add('active');
      const filterValue = badge.getAttribute('data-filter');
      renderTasks(filterValue, document.getElementById('task-search')?.value);
    });
  });

  // Search input typing
  const searchInput = document.getElementById('task-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeFilter = document.querySelector('.filter-badge.active')?.getAttribute('data-filter') || 'all';
      renderTasks(activeFilter, e.target.value);
    });
  }

  // Drag and drop container
  const container = document.getElementById('tasks-list');
  if (container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
  }
}

function addTask(title, category, priority, dueDate) {
  const newTask = {
    id: Date.now().toString(),
    title,
    category,
    priority,
    dueDate: dueDate || getOffsetDateString(0),
    completed: false,
    subtasks: []
  };

  tasks.unshift(newTask);
  saveTasks();
  
  const activeFilter = document.querySelector('.filter-badge.active')?.getAttribute('data-filter') || 'all';
  renderTasks(activeFilter, document.getElementById('task-search')?.value);
  updateDashboardTaskWidgets();
}

export function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();

  const activeFilter = document.querySelector('.filter-badge.active')?.getAttribute('data-filter') || 'all';
  renderTasks(activeFilter, document.getElementById('task-search')?.value);
  updateDashboardTaskWidgets();
}

export function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    
    // Reward particle burst upon task completion!
    if (task.completed) {
      triggerConfettiBurst();
      // Increase XP on Focus Badge
      window.incrementXp?.(50); // earning 50XP per task!
    }

    saveTasks();
  }

  const activeFilter = document.querySelector('.filter-badge.active')?.getAttribute('data-filter') || 'all';
  renderTasks(activeFilter, document.getElementById('task-search')?.value);
  updateDashboardTaskWidgets();
}

function addSubtask(taskId, text) {
  const task = tasks.find(t => t.id === taskId);
  if (task && text.trim() !== '') {
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: Date.now().toString(),
      text: text.trim(),
      completed: false
    });
    saveTasks();
    
    const activeFilter = document.querySelector('.filter-badge.active')?.getAttribute('data-filter') || 'all';
    renderTasks(activeFilter, document.getElementById('task-search')?.value);
  }
}

function toggleSubtask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.subtasks) {
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      
      // If all subtasks are complete, prompt or reward with minor XP
      if (subtask.completed) {
        window.incrementXp?.(10); // minor reward
      }
      
      saveTasks();
      
      const activeFilter = document.querySelector('.filter-badge.active')?.getAttribute('data-filter') || 'all';
      renderTasks(activeFilter, document.getElementById('task-search')?.value);
    }
  }
}

// DRAG AND DROP HANDLERS
let dragSrcId = null;

function handleDragStart(e) {
  dragSrcId = this.getAttribute('data-id');
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  this.classList.remove('dragging');
  const items = document.querySelectorAll('.task-item');
  items.forEach(item => item.classList.remove('dragging'));
}

function handleDragOver(e) {
  e.preventDefault();
  return false;
}

function handleDrop(e) {
  e.preventDefault();
  const draggingEl = document.querySelector('.task-item.dragging');
  if (!draggingEl) return;

  const dropTargetEl = e.target.closest('.task-item');
  if (!dropTargetEl || dropTargetEl === draggingEl) return;

  const listContainer = document.getElementById('tasks-list');
  const children = Array.from(listContainer.querySelectorAll('.task-item'));
  const draggingIndex = children.indexOf(draggingEl);
  const targetIndex = children.indexOf(dropTargetEl);

  // Re-order tasks array
  const draggingTaskId = draggingEl.getAttribute('data-id');
  const targetTaskId = dropTargetEl.getAttribute('data-id');
  
  const dIndex = tasks.findIndex(t => t.id === draggingTaskId);
  const tIndex = tasks.findIndex(t => t.id === targetTaskId);

  if (dIndex !== -1 && tIndex !== -1) {
    const [moved] = tasks.splice(dIndex, 1);
    tasks.splice(tIndex, 0, moved);
    saveTasks();
    
    // Smoothly re-render tasks
    const activeFilter = document.querySelector('.filter-badge.active')?.getAttribute('data-filter') || 'all';
    renderTasks(activeFilter, document.getElementById('task-search')?.value);
  }
}

export function renderTasks(filter = 'all', searchQuery = '') {
  const listContainer = document.getElementById('tasks-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  let filtered = [...tasks];

  // Apply filters
  if (filter === 'pending') {
    filtered = filtered.filter(t => !t.completed);
  } else if (filter === 'high') {
    filtered = filtered.filter(t => t.priority === 'High' && !t.completed);
  } else if (filter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // Apply search
  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query));
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox" style="width: 38px; height: 38px; margin-bottom: 12px; color: var(--text-dark);"></i>
        <p>No tasks found.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  filtered.forEach(task => {
    const isOverdue = !task.completed && new Date(task.dueDate + 'T23:59:59') < new Date();
    const formattedDate = formatTaskDate(task.dueDate);

    let catEmoji = '📚';
    if (task.category.includes('Assignment')) catEmoji = '📝';
    else if (task.category.includes('Project')) catEmoji = '💻';
    else if (task.category.includes('Exam')) catEmoji = '🎯';
    else if (task.category.includes('Personal')) catEmoji = '🏡';
    else if (task.category.includes('Other')) catEmoji = '🌟';

    const cleanCategory = task.category.replace(/📚|📝|💻|🎯|🏡|🌟/g, '').trim();

    // Check subtasks count
    const totalSub = task.subtasks ? task.subtasks.length : 0;
    const doneSub = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;

    const taskItem = document.createElement('div');
    taskItem.className = `task-item glass-panel ${task.completed ? 'completed' : ''}`;
    taskItem.setAttribute('draggable', 'true');
    taskItem.setAttribute('data-id', task.id);

    taskItem.innerHTML = `
      <div class="task-item-main">
        <div class="task-left">
          <button class="task-check-btn" data-id="${task.id}">
            <i data-lucide="check"></i>
          </button>
          <div class="task-details">
            <span class="task-item-title">${escapeHtml(task.title)}</span>
            <div class="task-meta">
              <span class="task-category-tag">${catEmoji} ${escapeHtml(cleanCategory)}</span>
              <span class="task-due-tag ${isOverdue ? 'overdue' : ''}">
                <i data-lucide="calendar"></i>
                ${formattedDate} ${isOverdue ? '(Overdue)' : ''}
              </span>
              ${totalSub > 0 ? `<span class="task-category-tag"><i data-lucide="git-branch" style="width:10px;height:10px;display:inline-block;margin-right:2px;"></i>${doneSub}/${totalSub}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="task-right">
          <span class="priority-indicator priority-${task.priority.toLowerCase()}">${task.priority}</span>
          <button class="task-subtasks-toggle-btn" title="Toggle Subtasks">
            <i data-lucide="chevron-down"></i>
          </button>
          <button class="task-delete-btn" data-id="${task.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>

      <!-- Expandable Subtasks Panel -->
      <div class="subtasks-panel">
        <div class="subtask-list">
          ${task.subtasks ? task.subtasks.map(sub => `
            <div class="subtask-row ${sub.completed ? 'completed' : ''}" data-sub-id="${sub.id}">
              <button class="subtask-checkbox" data-sub-id="${sub.id}">
                <i data-lucide="check"></i>
              </button>
              <span class="subtask-text">${escapeHtml(sub.text)}</span>
            </div>
          `).join('') : ''}
        </div>
        <div class="subtask-creator-row">
          <input type="text" placeholder="Add subtask..." class="form-control form-control-sm" id="sub-input-${task.id}" />
          <button class="btn btn-secondary btn-sm add-sub-btn" data-id="${task.id}">Add</button>
        </div>
      </div>
    `;

    // Event listeners for Drag
    taskItem.addEventListener('dragstart', handleDragStart);
    taskItem.addEventListener('dragend', handleDragEnd);

    // Accordion Toggle
    taskItem.querySelector('.task-subtasks-toggle-btn').addEventListener('click', () => {
      taskItem.classList.toggle('expanded');
    });

    // Checkboxes
    taskItem.querySelector('.task-check-btn').addEventListener('click', () => {
      toggleTask(task.id);
    });

    taskItem.querySelector('.task-delete-btn').addEventListener('click', () => {
      deleteTask(task.id);
    });

    // Subtask checkbox click
    taskItem.querySelectorAll('.subtask-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const subId = btn.getAttribute('data-sub-id');
        toggleSubtask(task.id, subId);
      });
    });

    // Subtask Add click
    taskItem.querySelector('.add-sub-btn').addEventListener('click', () => {
      const input = document.getElementById(`sub-input-${task.id}`);
      if (input) {
        addSubtask(task.id, input.value);
        input.value = '';
      }
    });

    // Subtask Enter key submit
    const subInput = taskItem.querySelector(`#sub-input-${task.id}`);
    subInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addSubtask(task.id, subInput.value);
        subInput.value = '';
      }
    });

    listContainer.appendChild(taskItem);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function updateDashboardTaskWidgets() {
  const dashDone = document.getElementById('dash-done-count');
  if (dashDone) {
    const todayStr = getOffsetDateString(0);
    const completedToday = tasks.filter(t => t.completed && t.dueDate === todayStr).length;
    dashDone.textContent = completedToday.toString();
  }

  const dashTasksToday = document.getElementById('dash-tasks-today');
  if (!dashTasksToday) return;

  dashTasksToday.innerHTML = '';

  const todayStr = getOffsetDateString(0);
  const urgentTasks = tasks.filter(t => !t.completed && (t.dueDate === todayStr || new Date(t.dueDate + 'T23:59:59') < new Date()));

  if (urgentTasks.length === 0) {
    dashTasksToday.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <i data-lucide="sparkles" style="width: 28px; height: 28px; margin-bottom: 8px; color: var(--accent-cyan);"></i>
        <p style="font-size: 0.85rem;">All clear for today!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  urgentTasks.slice(0, 3).forEach(task => {
    const isOverdue = task.dueDate !== todayStr;
    const item = document.createElement('div');
    item.className = 'preview-row';
    item.style.cursor = 'pointer';
    item.innerHTML = `
      <div class="preview-time" style="color: ${isOverdue ? '#f87171' : 'var(--text-muted)'};">
        ${isOverdue ? 'Overdue' : 'Today'}
      </div>
      <div class="preview-title">${escapeHtml(task.title)}</div>
      <span class="preview-tag priority-${task.priority.toLowerCase()}">${task.priority}</span>
    `;
    item.addEventListener('click', () => {
      window.switchTab('tasks');
    });
    dashTasksToday.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Trigger particle burst
function triggerConfettiBurst() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#7c3aed', '#06b6d4', '#10b981', '#ec4899', '#ffffff']
  });
}

// Helpers
function getOffsetDateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function formatTaskDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  
  const d = new Date(year, month, day);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

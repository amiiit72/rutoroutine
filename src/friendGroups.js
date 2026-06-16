// Friend Groups Hub (WebSocket Mock Chat, Agora Call Mock & Shared Boards) for RoutineFlow

let groups = [];
let activeGroupId = 'g1';
let isCallActive = false;

// Mock database
let groupData = {
  g1: {
    name: 'Alpha Team Space',
    status: '4 members online',
    messages: [
      { id: 'm1', sender: 'John Doe', text: 'Hey guys, did you check out the new RoutineFlow dashboards?', type: 'incoming' },
      { id: 'm2', sender: 'Sarah Smith', text: 'Yeah! My streak is up to 5 days now, just unlocked the fire animation!', type: 'incoming' },
      { id: 'm3', sender: 'Alex Miller', text: 'I am starting a focus session in 5 mins. Who wants to join the WebRTC video study room?', type: 'incoming' }
    ],
    sharedTasks: [
      { id: 'st1', title: 'Draft UI Mockups in Figma', owner: 'Alex', completed: true },
      { id: 'st2', title: 'Set up Agora RTC client connections', owner: 'Sarah', completed: false },
      { id: 'st3', title: 'Write local storage schema definitions', owner: 'Me', completed: false }
    ]
  },
  g2: {
    name: 'Physics Study Squad',
    status: '2 members online',
    messages: [
      { id: 'm4', sender: 'John Doe', text: 'Midterm is next week! Has anyone completed the mock exam review sheet?', type: 'incoming' }
    ],
    sharedTasks: [
      { id: 'st4', title: 'Practice problems 1 to 15', owner: 'John', completed: false },
      { id: 'st5', title: 'Formula cheatsheet check-off', owner: 'Me', completed: false }
    ]
  }
};

export function initFriendGroups() {
  loadGroups();
  setupEventListeners();
  renderGroupsList();
  selectGroup('g1');
  setupDraggableCallDeck();
}

function loadGroups() {
  groups = [
    { id: 'g1', name: 'Alpha Team Space' },
    { id: 'g2', name: 'Physics Study Squad' }
  ];
}

function setupEventListeners() {
  const btnChatSend = document.getElementById('chat-send-btn');
  const chatInput = document.getElementById('chat-message-input');
  const btnCallToggle = document.getElementById('toggle-video-call-btn');
  const btnCallClose = document.getElementById('close-video-call-btn');
  const btnAddShared = document.getElementById('add-shared-task-btn');

  if (btnChatSend) btnChatSend.addEventListener('click', sendGroupMessage);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendGroupMessage();
    });
  }

  if (btnCallToggle) btnCallToggle.addEventListener('click', toggleVideoCall);
  if (btnCallClose) btnCallClose.addEventListener('click', toggleVideoCall);

  if (btnAddShared) {
    btnAddShared.addEventListener('click', createSharedTask);
  }
}

function renderGroupsList() {
  const container = document.getElementById('groups-list-container');
  if (!container) return;

  container.innerHTML = '';

  groups.forEach(g => {
    const el = document.createElement('div');
    el.className = `group-item ${g.id === activeGroupId ? 'active' : ''}`;
    el.setAttribute('data-id', g.id);
    el.innerHTML = `
      <div class="group-avatar">${g.name.substring(0,2).toUpperCase()}</div>
      <span class="group-title">${escapeHtml(g.name)}</span>
    `;

    el.addEventListener('click', () => {
      selectGroup(g.id);
    });

    container.appendChild(el);
  });
}

function selectGroup(groupId) {
  activeGroupId = groupId;
  
  // Highlight active
  const items = document.querySelectorAll('.group-item');
  items.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-id') === groupId) item.classList.add('active');
  });

  const groupInfo = groupData[groupId];
  if (!groupInfo) return;

  // Header update
  const title = document.getElementById('chat-active-group-name');
  const status = document.getElementById('chat-active-group-status');
  if (title) title.textContent = groupInfo.name;
  if (status) status.textContent = groupInfo.status;

  renderMessages();
  renderSharedTasks();
}

function renderMessages() {
  const container = document.getElementById('chat-messages-box');
  if (!container) return;

  container.innerHTML = '';
  const group = groupData[activeGroupId];
  if (!group) return;

  group.messages.forEach(msg => {
    const row = document.createElement('div');
    row.className = `chat-msg ${msg.type}`;
    
    row.innerHTML = `
      <div class="chat-msg-avatar">${msg.sender.substring(0,2).toUpperCase()}</div>
      <div class="chat-msg-bubble">
        <div class="chat-msg-sender">${escapeHtml(msg.sender)}</div>
        <p>${escapeHtml(msg.text)}</p>
      </div>
    `;
    container.appendChild(row);
  });

  // Auto scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function sendGroupMessage() {
  const input = document.getElementById('chat-message-input');
  if (!input || input.value.trim() === '') return;

  const text = input.value.trim();
  const group = groupData[activeGroupId];
  if (group) {
    group.messages.push({
      id: Date.now().toString(),
      sender: 'Scholar Orbit', // Me
      text,
      type: 'outgoing'
    });
    
    input.value = '';
    renderMessages();

    // Reward XP
    window.incrementXp?.(5);

    // Simulate incoming team response 1.5 seconds later
    simulateIncomingResponse();
  }
}

function simulateIncomingResponse() {
  const responses = [
    "Awesome! Let me check that out.",
    "Nice routine score today! 👍",
    "Yes, I will sync that with my schedule.",
    "Is anyone joining the video study session?",
    "Got it, finishing my Pomodoro now!"
  ];

  const members = ["Alex Miller", "Sarah Smith", "John Doe"];

  setTimeout(() => {
    const group = groupData[activeGroupId];
    if (group) {
      const randText = responses[Math.floor(Math.random() * responses.length)];
      const randMember = members[Math.floor(Math.random() * members.length)];

      group.messages.push({
        id: Date.now().toString(),
        sender: randMember,
        text: randText,
        type: 'incoming'
      });

      renderMessages();
    }
  }, 1500);
}

// SHARED TODO BOARD LOGIC
function renderSharedTasks() {
  const container = document.getElementById('shared-todo-box');
  if (!container) return;

  container.innerHTML = '';
  const group = groupData[activeGroupId];
  if (!group) return;

  group.sharedTasks.forEach(task => {
    const item = document.createElement('div');
    item.className = `shared-task-item ${task.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="task-left">
        <button class="subtask-checkbox shared-task-check" data-id="${task.id}">
          <i data-lucide="check" style="width:10px;height:10px; ${task.completed ? 'display:block;' : ''}"></i>
        </button>
        <span class="shared-task-title" style="margin-left: 8px;">${escapeHtml(task.title)}</span>
      </div>
      <span class="shared-task-owner">${escapeHtml(task.owner)}</span>
    `;

    item.querySelector('.shared-task-check').addEventListener('click', () => {
      toggleSharedTask(task.id);
    });

    container.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

function toggleSharedTask(id) {
  const group = groupData[activeGroupId];
  if (group) {
    const task = group.sharedTasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      if (task.completed) {
        import('canvas-confetti').then(conf => {
          conf.default({ particleCount: 50, spread: 40, colors: ['#7c3aed', '#06b6d4'] });
        });
        window.incrementXp?.(20);
      }
      renderSharedTasks();
    }
  }
}

function createSharedTask() {
  const text = prompt('Enter collaborative task description:');
  if (!text || text.trim() === '') return;

  const group = groupData[activeGroupId];
  if (group) {
    const owners = ['Alex', 'Sarah', 'John', 'Me'];
    const owner = owners[Math.floor(Math.random() * owners.length)];

    group.sharedTasks.push({
      id: Date.now().toString(),
      title: text.trim(),
      owner,
      completed: false
    });

    renderSharedTasks();
    window.incrementXp?.(10);
  }
}

// DRAGGABLE VIDEO CALL PANEL
function toggleVideoCall() {
  isCallActive = !isCallActive;

  const panel = document.getElementById('floating-webrtc-call-panel');
  const btn = document.getElementById('toggle-video-call-btn');

  if (!panel || !btn) return;

  if (isCallActive) {
    btn.innerHTML = `<i data-lucide="video-off"></i> End Call`;
    btn.className = 'btn video-deck-btn btn-sm active-call';
    panel.classList.add('active');
    
    // Simulate active audio speak indicators randomly
    startSpeakVisualizer();
  } else {
    btn.innerHTML = `<i data-lucide="video"></i> Group Call`;
    btn.className = 'btn video-deck-btn btn-sm';
    panel.classList.remove('active');
    stopSpeakVisualizer();
  }

  if (window.lucide) window.lucide.createIcons();
}

let speakInterval = null;
function startSpeakVisualizer() {
  const tiles = document.querySelectorAll('.video-tile');
  speakInterval = setInterval(() => {
    tiles.forEach(tile => {
      // 30% chance to toggle speaking style
      if (Math.random() > 0.7) {
        tile.classList.toggle('speaking');
      }
    });
  }, 1200);
}

function stopSpeakVisualizer() {
  clearInterval(speakInterval);
  const tiles = document.querySelectorAll('.video-tile');
  tiles.forEach(tile => tile.classList.remove('speaking'));
}

function setupDraggableCallDeck() {
  const deck = document.getElementById('floating-webrtc-call-panel');
  const handle = document.getElementById('video-deck-drag-handle');

  if (!deck || !handle) return;

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get cursor position
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate delta coordinates
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set absolute offsets
    deck.style.top = (deck.offsetTop - pos2) + "px";
    deck.style.left = (deck.offsetLeft - pos1) + "px";
    deck.style.bottom = "auto";
    deck.style.right = "auto";
  }

  function closeDragElement() {
    // stop tracking
    document.onmouseup = null;
    document.onmousemove = null;
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

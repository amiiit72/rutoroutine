// Friend Circle Social Feed (BeReal posts, comments, emoji reactions) for RoutineFlow

let posts = [];
let activePostId = null;

export function initFriendCircle() {
  loadPosts();
  setupEventListeners();
  renderFeed();
}

function loadPosts() {
  const data = localStorage.getItem('the_routine_posts');
  if (data) {
    try {
      posts = JSON.parse(data);
    } catch (e) {
      posts = [];
    }
  } else {
    posts = [
      {
        id: 'p1',
        author: 'Alex Miller',
        avatar: 'AM',
        timestamp: '1 hour ago',
        score: '96',
        body: 'Just finished all my morning coding goals! The liquid UI is so clean.',
        stats: { tasks: 5, focus: 120, streak: 8 },
        reactions: [
          { emoji: '🔥', count: 8 },
          { emoji: '💡', count: 3 },
          { emoji: '👏', count: 5 }
        ],
        comments: [
          { id: 'c1', user: 'Sarah Smith', text: 'Insane focus! Keep it up!' },
          { id: 'c2', user: 'John Doe', text: 'Which libraries did you use?' }
        ]
      },
      {
        id: 'p2',
        author: 'Sarah Smith',
        avatar: 'SS',
        timestamp: '3 hours ago',
        score: '84',
        body: 'Prepping for the algorithms midterm. Focus Hub is keeping me sane.',
        stats: { tasks: 3, focus: 90, streak: 5 },
        reactions: [
          { emoji: '🔥', count: 4 },
          { emoji: '👏', count: 6 }
        ],
        comments: [
          { id: 'c3', user: 'Alex Miller', text: 'Study notes are shared on Group Board' }
        ]
      }
    ];
    savePosts();
  }
}

function savePosts() {
  localStorage.setItem('the_routine_posts', JSON.stringify(posts));
}

function setupEventListeners() {
  const btnPost = document.getElementById('post-daily-stats-btn');
  const btnCommentSend = document.getElementById('comment-send-btn');
  const commentInput = document.getElementById('comment-text-input');

  if (btnPost) {
    btnPost.addEventListener('click', postMyDailyStats);
  }

  if (btnCommentSend) {
    btnCommentSend.addEventListener('click', sendComment);
  }

  if (commentInput) {
    commentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendComment();
    });
  }
}

function renderFeed() {
  const feedBox = document.getElementById('friend-feed-list');
  if (!feedBox) return;

  feedBox.innerHTML = '';

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'post-card glass-panel';
    card.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          <div class="post-avatar">${post.avatar}</div>
          <div>
            <div class="post-username">${escapeHtml(post.author)}</div>
            <div class="post-time">${post.timestamp}</div>
          </div>
        </div>
        <div class="post-score-badge">Score: ${post.score}</div>
      </div>
      <div class="post-body">
        <p>${escapeHtml(post.body)}</p>
      </div>
      
      <!-- Stats block -->
      <div class="post-stats-grid">
        <div class="post-stat-item">
          <div class="post-stat-val highlight-text">${post.stats.tasks}</div>
          <div class="post-stat-lbl">Tasks Done</div>
        </div>
        <div class="post-stat-item">
          <div class="post-stat-val highlight-text">${post.stats.focus}m</div>
          <div class="post-stat-lbl">Focus Time</div>
        </div>
        <div class="post-stat-item">
          <div class="post-stat-val highlight-text">${post.stats.streak}d</div>
          <div class="post-stat-lbl">Streak</div>
        </div>
      </div>

      <!-- Actions bar -->
      <div class="post-actions-bar">
        <div class="reaction-tray">
          ${post.reactions.map(react => `
            <button class="react-btn" data-post-id="${post.id}" data-emoji="${react.emoji}">
              <span>${react.emoji}</span>
              <span class="count">${react.count}</span>
            </button>
          `).join('')}
          <button class="react-btn add-custom-react" data-post-id="${post.id}">
            <span>➕</span>
          </button>
        </div>
        <button class="post-comments-toggle" data-id="${post.id}">
          <i data-lucide="message-square" style="width:16px;height:16px;"></i>
          <span>${post.comments.length} Comments</span>
        </button>
      </div>
    `;

    // Click to select post for comment thread view
    card.querySelector('.post-comments-toggle').addEventListener('click', () => {
      openCommentThread(post.id);
    });

    // Reaction click mapping
    card.querySelectorAll('.react-btn:not(.add-custom-react)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emoji = btn.getAttribute('data-emoji');
        addReaction(post.id, emoji, e);
      });
    });

    // Custom reaction adder
    card.querySelector('.add-custom-react').addEventListener('click', (e) => {
      const em = prompt('Enter reaction emoji (e.g. 🙌, 🚀, 💡):');
      if (em) {
        addReaction(post.id, em, e);
      }
    });

    feedBox.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

function addReaction(postId, emoji, event) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  let r = post.reactions.find(react => react.emoji === emoji);
  if (r) {
    r.count++;
  } else {
    post.reactions.push({ emoji, count: 1 });
  }

  savePosts();
  renderFeed();

  // Trigger bubble-up emoji reaction visual floating particle
  if (event) {
    triggerEmojiBubbling(emoji, event.clientX, event.clientY);
  }

  // Award minor XP for interactive sharing
  window.incrementXp?.(5);
}

function triggerEmojiBubbling(emoji, x, y) {
  const bubble = document.createElement('span');
  bubble.className = 'bubbling-emoji';
  bubble.textContent = emoji;
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
  document.body.appendChild(bubble);

  setTimeout(() => {
    bubble.remove();
  }, 1200); // animations matches keyframes duration
}

function openCommentThread(postId) {
  activePostId = postId;
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const title = document.getElementById('comments-box-title');
  const count = document.getElementById('comments-count');
  const container = document.getElementById('comments-list-box');

  if (title) title.textContent = `Comments: ${post.author}`;
  if (count) count.textContent = `${post.comments.length} comments`;

  if (!container) return;
  container.innerHTML = '';

  if (post.comments.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No comments on this post yet. Say hello!</p></div>`;
    return;
  }

  post.comments.forEach(comment => {
    const row = document.createElement('div');
    row.className = 'comment-row';
    row.innerHTML = `
      <div class="comment-avatar">${comment.user.substring(0, 2).toUpperCase()}</div>
      <div class="comment-text-box">
        <div class="comment-user">${escapeHtml(comment.user)}</div>
        <p>${escapeHtml(comment.text)}</p>
      </div>
    `;
    container.appendChild(row);
  });
}

function sendComment() {
  if (!activePostId) {
    alert('Please select a post to comment on.');
    return;
  }

  const input = document.getElementById('comment-text-input');
  if (!input || input.value.trim() === '') return;

  const post = posts.find(p => p.id === activePostId);
  if (post) {
    post.comments.push({
      id: Date.now().toString(),
      user: 'Scholar Orbit', // Me
      text: input.value.trim()
    });
    savePosts();
    input.value = '';

    // Refresh feed count & comment thread panel
    renderFeed();
    openCommentThread(activePostId);

    // Earn XP reward
    window.incrementXp?.(10);
  }
}

function postMyDailyStats() {
  // Collect actual stats from localStorage
  const doneLabel = document.getElementById('dash-done-count')?.textContent || '0';
  const focusLabel = document.getElementById('dash-focus-count')?.textContent || '0m';
  const streakLabel = document.getElementById('dash-streak-count')?.textContent || '0';

  const tasksDone = parseInt(doneLabel) || 2;
  const focusMins = parseInt(focusLabel) || 45;
  const streak = parseInt(streakLabel) || 5;

  // Build new post card
  const newPost = {
    id: Date.now().toString(),
    author: 'Scholar Orbit',
    avatar: 'SO',
    timestamp: 'Just now',
    score: '92',
    body: 'My focus flow is locked in! Check out today\'s RoutineFlow routine summary.',
    stats: { tasks: tasksDone, focus: focusMins, streak: streak },
    reactions: [
      { emoji: '🔥', count: 1 },
      { emoji: '👏', count: 1 }
    ],
    comments: []
  };

  posts.unshift(newPost);
  savePosts();
  renderFeed();

  // Completed reward
  window.incrementXp?.(75); // Share stats XP bonus!
  alert('Daily routine stats posted to circle! +75 XP earned.');
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

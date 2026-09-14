// public/js/app.js

window.App = (function() {
  let state = {
    currentTab: 'dashboard',
    subjects: [],
    stats: null,
    todayGoal: null,
    tasks: []
  };

  const DOM = {
    tabs: document.querySelectorAll('#tabs button'),
    app: document.getElementById('app'),
    toast: document.getElementById('toast'),
    heroSub: document.getElementById('heroSub'),
    streakNum: document.getElementById('streakNum')
  };

  function bindNav() {
    DOM.tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });
  }

  function updateNavStyle(activeTab) {
    DOM.tabs.forEach(btn => {
      if (btn.getAttribute('data-tab') === activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  async function loadInitialData() {
    try {
      await refreshSubjects();
      await refreshStats();
      const todayISO = window.Utils.toISO(new Date());
      try {
        state.todayGoal = await window.API.get('/api/goals/today');
      } catch (e) {
        state.todayGoal = { date: todayISO, targetMinutes: 120 };
      }
      
      updateHeader();
      render();
    } catch (e) {
      DOM.app.innerHTML = `<div class="empty-note">Failed to load application data.</div>`;
    }
  }

  function updateHeader() {
    if (state.stats) {
      DOM.streakNum.textContent = state.stats.streak || 0;
      const todayStr = window.Utils.formatPretty(window.Utils.toISO(new Date()));
      DOM.heroSub.textContent = `Today is ${todayStr}`;
    }
  }

  async function refreshSubjects() {
    state.subjects = await window.API.get('/api/subjects') || [];
  }

  async function refreshStats() {
    state.stats = await window.API.get('/api/sessions/stats') || {
      totalMinutes: 0,
      totalSessions: 0,
      streak: 0,
      longestStreak: 0,
      bySubject: [],
      last30Days: []
    };
    updateHeader();
  }

  function showToast(msg) {
    DOM.toast.textContent = msg;
    DOM.toast.style.display = 'block';
    DOM.toast.style.opacity = '1';
    setTimeout(() => {
      DOM.toast.style.opacity = '0';
      setTimeout(() => {
        DOM.toast.style.display = 'none';
      }, 300);
    }, 3000);
  }

  function switchTab(tabName) {
    state.currentTab = tabName;
    updateNavStyle(tabName);
    render();
  }

  function render() {
    switch(state.currentTab) {
      case 'dashboard':
        DOM.app.innerHTML = window.Dashboard.render(state.stats, state.subjects, state.todayGoal);
        if (window.Dashboard.init) window.Dashboard.init();
        break;
      case 'sessions':
        DOM.app.innerHTML = window.Sessions.render(state.subjects);
        if (window.Sessions.init) window.Sessions.init();
        break;
      case 'subjects':
        DOM.app.innerHTML = window.Subjects.render(state.subjects);
        if (window.Subjects.init) window.Subjects.init();
        break;
      case 'tasks':
        DOM.app.innerHTML = window.Tasks.render(state.subjects, state.tasks);
        if (window.Tasks.init) window.Tasks.init();
        break;
      case 'calendar':
        DOM.app.innerHTML = window.Calendar.render(state.stats);
        if (window.Calendar.init) window.Calendar.init();
        break;
      default:
        DOM.app.innerHTML = `<div class="empty-note">Unknown tab</div>`;
    }
  }

  function initTheme() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    // Check local storage or default to dark
    const savedTheme = localStorage.getItem('logbook-theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('logbook-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('logbook-theme', 'dark');
      }
    });
  }

  return {
    init: function() {
      bindNav();
      initTheme();
      loadInitialData();
    },
    switchTab,
    render,
    showToast,
    refreshSubjects,
    refreshStats,
    getState: () => state
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});

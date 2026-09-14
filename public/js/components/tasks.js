// public/js/components/tasks.js

window.Tasks = (function() {
  let _filter = 'all';

  function render(subjects, tasks) {
    let subOptions = '<option value="">No subject (general)</option>';
    if(subjects) {
      subjects.forEach(s => {
        subOptions += `<option value="${s._id || s.id}">${Utils.escapeHtml(s.name)}</option>`;
      });
    }

    return `
      <div class="panel">
        <h2>Add Task</h2>
        <form id="taskForm" style="margin-top: 15px;">
          <div class="row-2">
            <div style="flex:2;">
              <label class="field">
                <span class="lbl">Task Title</span>
                <input type="text" id="taskTitle" required placeholder="e.g. Complete assignment 1">
              </label>
            </div>
            <div style="flex:1;">
              <label class="field">
                <span class="lbl">Subject (optional)</span>
                <select id="taskSubject">${subOptions}</select>
              </label>
            </div>
          </div>
          <button type="submit" class="btn-primary" style="margin-top: 10px;">Add Task</button>
        </form>
      </div>

      <div class="panel" style="margin-top: 20px; margin-bottom: 30px;">
        <div class="filter-bar" id="taskFilters">
          <button data-filter="all" class="${_filter === 'all' ? 'active' : ''}">All</button>
          <button data-filter="active" class="${_filter === 'active' ? 'active' : ''}">Active</button>
          <button data-filter="completed" class="${_filter === 'completed' ? 'active' : ''}">Completed</button>
        </div>
        <div id="taskList">
          <div class="empty-note">Loading tasks...</div>
        </div>
      </div>
    `;
  }

  async function loadTasks() {
    const listEl = document.getElementById('taskList');
    if (!listEl) return;
    try {
      const allTasks = await API.get('/api/tasks');
      let filtered = allTasks;
      if (_filter === 'active') filtered = allTasks.filter(t => !t.completed);
      if (_filter === 'completed') filtered = allTasks.filter(t => t.completed);

      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-note">No ${_filter} tasks found.</div>`;
        return;
      }

      let html = '';
      filtered.forEach(t => {
        let subDot = '';
        const tSubjectId = t.subjectId && typeof t.subjectId === 'object' ? t.subjectId._id : t.subjectId;
        if (tSubjectId) {
          const sub = App.getState().subjects.find(s => (s._id || s.id) === tSubjectId);
          if (sub) {
            subDot = `<span class="color-dot" style="background: ${sub.color}; margin-right: 10px;"></span>`;
          } else if (t.subjectId && typeof t.subjectId === 'object') {
            subDot = `<span class="color-dot" style="background: ${t.subjectId.color || '#888'}; margin-right: 10px;"></span>`;
          }
        }
        
        const taskId = t._id || t.id;
        const doneStyle = t.completed ? 'text-decoration: line-through; color: var(--muted);' : '';
        const checked = t.completed ? 'checked' : '';

        html += `
          <div class="lec-row ${t.completed ? 'done' : ''}">
            <input type="checkbox" class="box task-check" data-id="${taskId}" ${checked}>
            ${subDot}
            <div class="info" style="flex:1; font-weight: 500; ${doneStyle}">
              ${Utils.escapeHtml(t.title)}
            </div>
            <button class="del-btn task-del" data-id="${taskId}" style="font-size: 16px;">×</button>
          </div>
        `;
      });
      listEl.innerHTML = html;

      listEl.querySelectorAll('.task-check').forEach(chk => {
        chk.addEventListener('change', async (e) => {
          const id = e.target.getAttribute('data-id');
          const completed = e.target.checked;
          try {
            await API.put(`/api/tasks/${id}`, { completed });
            loadTasks();
          } catch(err) { e.target.checked = !completed; }
        });
      });

      listEl.querySelectorAll('.task-del').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm('Delete this task?')) {
            const id = e.target.getAttribute('data-id');
            try {
              await API.del(`/api/tasks/${id}`);
              App.showToast('Task deleted');
              loadTasks();
            } catch(err) {}
          }
        });
      });

    } catch(err) {
      listEl.innerHTML = '<div class="empty-note">Failed to load tasks.</div>';
    }
  }

  function init() {
    loadTasks();

    const form = document.getElementById('taskForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          title: document.getElementById('taskTitle').value,
          subjectId: document.getElementById('taskSubject').value || null
        };
        try {
          await API.post('/api/tasks', data);
          App.showToast('Task added');
          form.reset();
          loadTasks();
        } catch(err) {}
      });
    }

    const filters = document.getElementById('taskFilters');
    if (filters) {
      filters.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          _filter = e.target.getAttribute('data-filter');
          filters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          loadTasks();
        });
      });
    }
  }

  return { render, init };
})();

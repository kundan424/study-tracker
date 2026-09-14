// public/js/components/subjects.js

window.Subjects = (function() {
  function render(subjects) {
    let listHTML = '';
    if (!subjects || subjects.length === 0) {
      listHTML = '<div class="empty-note">No subjects added yet.</div>';
    } else {
      subjects.forEach(s => {
        const subId = s._id || s.id;
        listHTML += `
          <div class="lec-row">
            <span class="color-dot" style="background: ${s.color}; margin-right: 15px;"></span>
            <div class="info" style="flex:1; font-weight: 500;">
              ${Utils.escapeHtml(s.name)}
            </div>
            <button class="del-btn" data-id="${subId}" style="font-size: 16px;">×</button>
          </div>
        `;
      });
    }

    return `
      <div class="panel">
        <h2>Add Subject</h2>
        <form id="subjectForm" style="margin-top: 15px;">
          <div style="display: flex; gap: 10px; align-items: flex-end;">
            <div style="flex: 1;">
              <label class="field">
                <span class="lbl">Subject Name</span>
                <input type="text" id="subName" required placeholder="e.g. Mathematics">
              </label>
            </div>
            <div>
              <label class="field">
                <span class="lbl">Color</span>
                <input type="color" id="subColor" value="#C89B4B">
              </label>
            </div>
            <button type="submit" class="btn-primary" style="margin-bottom: 2px;">Add</button>
          </div>
        </form>
      </div>

      <div class="panel" style="margin-top: 20px; margin-bottom: 30px;">
        <h2>Your Subjects</h2>
        <div id="subjectList" style="margin-top: 15px;">
          ${listHTML}
        </div>
      </div>
    `;
  }

  function init() {
    const form = document.getElementById('subjectForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          name: document.getElementById('subName').value,
          color: document.getElementById('subColor').value
        };
        try {
          await API.post('/api/subjects', data);
          App.showToast('Subject added!');
          await App.refreshSubjects();
          App.render();
        } catch(err) {}
      });
    }

    const list = document.getElementById('subjectList');
    if (list) {
      list.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm('Delete this subject?')) {
            const id = e.target.getAttribute('data-id');
            try {
              await API.del(`/api/subjects/${id}`);
              App.showToast('Subject deleted!');
              await App.refreshSubjects();
              App.render();
            } catch(err) {}
          }
        });
      });
    }
  }

  return { render, init };
})();

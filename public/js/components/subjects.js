// public/js/components/subjects.js

window.Subjects = (function() {
  function render(subjects) {
    let listHTML = '';
    if (!subjects || subjects.length === 0) {
      listHTML = '<div class="empty-note">No subjects added yet.</div>';
    } else {
      subjects.forEach(s => {
        const subId = s._id || s.id;
        const total = s.totalLectures || 0;
        const sched = s.weeklySchedule || {};
        const weeklyLectures = Object.values(sched).reduce((a, b) => a + (Number(b) || 0), 0);
        listHTML += `
          <div class="lec-row">
            <span class="color-dot" style="background: ${s.color}; margin-right: 15px;"></span>
            <div class="info" style="flex:1;">
              <div style="font-weight: 600; font-size: 14px;">${Utils.escapeHtml(s.name)}</div>
              <div style="font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-top: 2px;">
                ${total > 0 ? `${total} lectures in syllabus` : 'No total set'} · 
                <span style="color:var(--brass);">${weeklyLectures > 0 ? `${weeklyLectures} lectures/week scheduled` : 'No days scheduled'}</span>
              </div>
            </div>
            <button class="edit-total-btn del-btn" data-id="${subId}" data-name="${Utils.escapeHtml(s.name)}" data-total="${total}" style="font-size: 11px; font-family: var(--font-mono); color: var(--muted); padding: 4px 8px; margin-right: 8px;">edit total</button>
            <button class="del-btn sub-del-btn" data-id="${subId}" style="font-size: 16px;">×</button>
          </div>
        `;
      });
    }

    return `
      <div class="panel">
        <h2>Add Subject</h2>
        <p class="panel-sub">Set the total number of lectures so the progress bar works in the Lectures tab.</p>
        <form id="subjectForm" style="margin-top: 15px;">
          <div class="row-2" style="grid-template-columns: 1fr 80px auto; gap: 10px; align-items: flex-end;">
            <label class="field" style="margin-bottom: 0;">
              <span class="lbl">Subject Name</span>
              <input type="text" id="subName" required placeholder="e.g. Mathematics">
            </label>
            <label class="field" style="margin-bottom: 0;">
              <span class="lbl">Total Lectures</span>
              <input type="number" id="subTotal" min="0" placeholder="e.g. 40">
            </label>
            <label class="field" style="margin-bottom: 0;">
              <span class="lbl">Color</span>
              <input type="color" id="subColor" value="#C89B4B">
            </label>
          </div>
          <button type="submit" class="btn-primary" style="margin-top: 15px;">Add Subject</button>
        </form>
      </div>

      <div class="panel" style="margin-top: 20px; margin-bottom: 30px;">
        <h2>Your Subjects</h2>
        <div id="subjectList" style="margin-top: 15px;">
          ${listHTML}
        </div>
      </div>

      <!-- Edit total modal (inline) -->
      <div id="editTotalModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:200; align-items:center; justify-content:center;">
        <div style="background:var(--panel); border:1px solid var(--line); padding:24px; max-width:360px; width:90%; position:relative;">
          <h2 id="editModalTitle" style="margin-bottom:16px;">Edit Total Lectures</h2>
          <label class="field">
            <span class="lbl">Total Lectures in Syllabus</span>
            <input type="number" id="editTotalInput" min="0" placeholder="e.g. 40">
          </label>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <button id="editTotalSave" class="btn-primary">Save</button>
            <button id="editTotalCancel" style="background:transparent; border:1px solid var(--line); color:var(--muted); padding:10px 16px; cursor:pointer; font-family:var(--font-mono); font-size:13px;">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    // Add subject form
    const form = document.getElementById('subjectForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          name: document.getElementById('subName').value,
          color: document.getElementById('subColor').value,
          totalLectures: parseInt(document.getElementById('subTotal').value, 10) || 0
        };
        try {
          await API.post('/api/subjects', data);
          App.showToast('Subject added!');
          await App.refreshSubjects();
          await App.refreshStats();
          App.render();
        } catch(err) {}
      });
    }

    // Delete buttons
    const list = document.getElementById('subjectList');
    if (list) {
      list.querySelectorAll('.sub-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this subject? This will also remove all its logged lectures and sessions.')) {
            const id = btn.getAttribute('data-id');
            try {
              await API.del(`/api/subjects/${id}`);
              App.showToast('Subject deleted!');
              await App.refreshSubjects();
              await App.refreshStats();
              App.render();
            } catch(err) {}
          }
        });
      });

      // Edit total buttons
      list.querySelectorAll('.edit-total-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          const total = btn.getAttribute('data-total');

          const modal = document.getElementById('editTotalModal');
          document.getElementById('editModalTitle').textContent = `Edit: ${name}`;
          document.getElementById('editTotalInput').value = total;
          modal.style.display = 'flex';

          document.getElementById('editTotalSave').onclick = async () => {
            const newTotal = parseInt(document.getElementById('editTotalInput').value, 10) || 0;
            try {
              await API.put(`/api/subjects/${id}`, { totalLectures: newTotal });
              App.showToast('Updated!');
              modal.style.display = 'none';
              await App.refreshSubjects();
              await App.refreshStats();
              App.render();
            } catch(err) {}
          };
          document.getElementById('editTotalCancel').onclick = () => {
            modal.style.display = 'none';
          };
        });
      });
    }
  }

  return { render, init };
})();

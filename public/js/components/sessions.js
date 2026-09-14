// public/js/components/sessions.js

window.Sessions = (function() {
  let _timer = { interval: null, seconds: 0, running: false };

  function render(subjects) {
    let subOptions = '<option value="">Select a subject...</option>';
    subjects.forEach(s => {
      subOptions += `<option value="${s._id || s.id}">${Utils.escapeHtml(s.name)}</option>`;
    });
    
    const todayISO = Utils.toISO(new Date());

    return `
      <div class="panel">
        <h2>Log a Study Session</h2>
        <form id="sessionForm" style="margin-top: 15px;">
          <div class="row-2">
            <div>
              <label class="field">
                <span class="lbl">Subject</span>
                <select id="sessionSubject" required>${subOptions}</select>
              </label>
            </div>
            <div>
              <label class="field">
                <span class="lbl">Topic (optional)</span>
                <input type="text" id="sessionTopic" placeholder="e.g. Chapter 4">
              </label>
            </div>
          </div>
          
          <div class="row-2">
            <div>
              <label class="field">
                <span class="lbl">Date</span>
                <input type="date" id="sessionDate" value="${todayISO}" required>
              </label>
            </div>
            <div>
              <label class="field">
                <span class="lbl">Duration (minutes)</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="number" id="sessionDuration" min="1" required style="flex: 1;">
                  <button type="button" id="timerBtn" class="timer-btn">Start Timer</button>
                  <span id="timerDisplay" class="timer-display" style="display:none;">00:00</span>
                </div>
              </label>
            </div>
          </div>

          <label class="field">
            <span class="lbl">Notes (optional)</span>
            <textarea id="sessionNotes" rows="2"></textarea>
          </label>

          <button type="submit" class="btn-primary" style="margin-top: 10px;">Log Session</button>
        </form>
      </div>

      <div class="panel" style="margin-top: 20px; margin-bottom: 30px;">
        <h2>Recent Sessions</h2>
        <div id="sessionHistory" style="margin-top: 15px;">
          <div class="empty-note">Loading history...</div>
        </div>
      </div>
    `;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function initTimer() {
    const btn = document.getElementById('timerBtn');
    const display = document.getElementById('timerDisplay');
    const durationInput = document.getElementById('sessionDuration');
    
    _timer.running = false;
    _timer.seconds = 0;
    if (_timer.interval) clearInterval(_timer.interval);

    if (!btn) return;

    let isCountdown = false;
    let targetSeconds = 0;

    btn.addEventListener('click', () => {
      if (!_timer.running) {
        const inputVal = parseInt(durationInput.value, 10);
        
        if (inputVal > 0) {
          isCountdown = true;
          targetSeconds = inputVal * 60;
          _timer.seconds = targetSeconds;
        } else {
          isCountdown = false;
          _timer.seconds = 0;
        }
        
        _timer.running = true;
        btn.textContent = 'Stop Timer';
        btn.classList.add('stop');
        display.style.display = 'inline-block';
        display.textContent = formatTime(_timer.seconds);
        
        _timer.interval = setInterval(() => {
          if (isCountdown) {
            _timer.seconds--;
            display.textContent = formatTime(_timer.seconds);
            if (_timer.seconds <= 0) {
              // Timer ended: Stop and auto-submit
              clearInterval(_timer.interval);
              _timer.running = false;
              btn.textContent = 'Start Timer';
              btn.classList.remove('stop');
              display.style.display = 'none';
              durationInput.value = inputVal; // ensure value is set
              
              // Trigger form submission
              const form = document.getElementById('sessionForm');
              if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              
              App.showToast('Time is up! Session saved.');
            }
          } else {
            _timer.seconds++;
            display.textContent = formatTime(_timer.seconds);
          }
        }, 1000);
      } else {
        // Manually stopped
        _timer.running = false;
        clearInterval(_timer.interval);
        btn.textContent = 'Start Timer';
        btn.classList.remove('stop');
        display.style.display = 'none';
        
        if (isCountdown) {
          const elapsed = targetSeconds - _timer.seconds;
          durationInput.value = Math.max(1, Math.round(elapsed / 60));
        } else {
          durationInput.value = Math.max(1, Math.round(_timer.seconds / 60));
        }
      }
    });
  }

  async function loadHistory() {
    const histEl = document.getElementById('sessionHistory');
    if (!histEl) return;
    try {
      const sessions = await API.get('/api/sessions');
      if (!sessions || sessions.length === 0) {
        histEl.innerHTML = '<div class="empty-note">No recent sessions found.</div>';
        return;
      }

      sessions.sort((a,b) => new Date(b.date) - new Date(a.date));
      const recent = sessions.slice(0, 20);
      
      let html = '';
      recent.forEach(s => {
        // subjectId is populated by the API as an object { _id, name, color }
        const sub = s.subjectId || { name: 'Unknown', color: '#888' };
        const sessionId = s._id || s.id;
        html += `
          <div class="entry">
            <div class="erow">
              <div class="edate">${Utils.formatShort(s.date)}</div>
              <div style="flex:1;">
                <span class="color-dot" style="background: ${sub.color};"></span>
                <strong>${Utils.escapeHtml(sub.name)}</strong>
                <div class="etopic">${Utils.escapeHtml(s.topic || 'No topic')}</div>
              </div>
              <div class="emin">${Utils.formatDuration(s.duration)}</div>
              <button class="del-btn" data-id="${sessionId}">×</button>
            </div>
            ${s.notes ? `<div class="enotes">${Utils.escapeHtml(s.notes)}</div>` : ''}
          </div>
        `;
      });
      histEl.innerHTML = html;

      histEl.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if(confirm('Delete this session?')) {
            const id = btn.getAttribute('data-id');
            await API.del(`/api/sessions/${id}`);
            App.showToast('Session deleted');
            App.refreshStats();
            loadHistory();
          }
        });
      });
    } catch(e) {
      histEl.innerHTML = '<div class="empty-note">Error loading history.</div>';
    }
  }

  function init() {
    initTimer();
    loadHistory();

    const form = document.getElementById('sessionForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          subjectId: document.getElementById('sessionSubject').value,
          topic: document.getElementById('sessionTopic').value,
          date: document.getElementById('sessionDate').value,
          duration: parseInt(document.getElementById('sessionDuration').value, 10),
          notes: document.getElementById('sessionNotes').value
        };

        try {
          await API.post('/api/sessions', data);
          App.showToast('Session logged successfully!');
          form.reset();
          document.getElementById('sessionDate').value = Utils.toISO(new Date());
          await App.refreshStats();
          loadHistory();
        } catch (err) {}
      });
    }
  }

  return { render, init };
})();

// public/js/components/lectures.js
// Lecture manager with Live Day-based Goal setting & schedule (Mon-Sun),
// Syllabus progress, Day Navigator, and interactive completion tracking.

window.Lectures = (function() {
  let _viewDate = Utils.toISO(new Date());
  let _dayCompletions = {};   // { subjectId: { done: true, count: 1 } }
  let _allDays = {};          // { 'YYYY-MM-DD': [subjectId, ...] }
  let _lectureStats = null;
  let _subjects = [];
  let _selectedGoalSubId = null; // Currently selected subject in "Set Goal"
  let _showGoalPanel = true;     // Whether Set Goal panel is expanded

  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const DAY_NAMES = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday'
  };

  function getDayKey(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    return DAY_KEYS[d.getDay()];
  }

  // -----------------------------------------------------------------------
  // Render Main
  // -----------------------------------------------------------------------
  function render(subjects, lectureStats) {
    _subjects = subjects || [];
    _lectureStats = lectureStats || { overallDone: 0, overallTotal: 0, bySubject: [], last30Days: [] };

    if (_subjects.length === 0) {
      return `
        <div class="panel">
          <h2>Lecture Tracker</h2>
          <p class="panel-sub">No subjects found yet. Go to the <strong>Subjects</strong> tab to create your subjects, then set goals here!</p>
        </div>
      `;
    }

    // Ensure _selectedGoalSubId is valid and clean string
    const validSub = _subjects.find(s => String(s._id || s.id) === String(_selectedGoalSubId));
    if (!validSub) {
      _selectedGoalSubId = String(_subjects[0]._id || _subjects[0].id);
    } else {
      _selectedGoalSubId = String(validSub._id || validSub.id);
    }

    const overallDone  = _lectureStats.overallDone  || 0;
    const overallTotal = _lectureStats.overallTotal || 0;
    const overallPct   = overallTotal > 0 ? Math.min(100, Math.round((overallDone / overallTotal) * 100)) : 0;

    // --- 1. Overall Syllabus Panel ---
    const overallPanel = `
      <div class="panel">
        <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:10px;">
          <div>
            <h2>Overall Syllabus Progress</h2>
            <p class="panel-sub" style="margin-bottom:8px;">${overallDone} of ${overallTotal} total lectures completed (${overallPct}%)</p>
          </div>
          <button id="toggleGoalPanelBtn" class="text-btn" style="border:1px solid var(--brass); color:var(--brass); padding:6px 12px; font-weight:600;">
            ${_showGoalPanel ? '▲ Hide Goal Setter' : '🎯 Set Goals & Daily Schedule'}
          </button>
        </div>
        <div class="bar-row">
          <div class="bar-track" style="height:12px;">
            <div class="bar-fill" style="width:${overallPct}%; background: var(--teal);"></div>
          </div>
        </div>
      </div>
    `;

    // --- 2. Set Goal & Day-based Schedule Panel ---
    const goalPanel = `
      <div id="goalSectionWrapper" style="${_showGoalPanel ? '' : 'display:none;'}">
        ${renderGoalSection()}
      </div>
    `;

    // --- 3. Progress by Subject Panel ---
    const barsHtml = (_lectureStats.bySubject || []).map(s => {
      const pct = s.total > 0 ? Math.min(100, Math.round((s.done / s.total) * 100)) : 0;
      const sched = s.weeklySchedule || {};
      const activeDaysCount = Object.values(sched).filter(v => v > 0).length;
      const weeklyLectures = Object.values(sched).reduce((a, b) => a + (Number(b) || 0), 0);

      return `
        <div class="bar-row" style="margin-bottom: 12px;">
          <div class="bar-label">
            <span class="name" style="display:flex; align-items:center; gap:8px;">
              <span class="color-dot" style="background:${s.color};"></span>
              <strong>${Utils.escapeHtml(s.name)}</strong>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--muted); font-weight:normal;">
                (${weeklyLectures} lec/wk · ${activeDaysCount} days active)
              </span>
            </span>
            <span class="count">${s.done} / ${s.total > 0 ? s.total : '?'} lectures (${pct}%)</span>
          </div>
          <div class="bar-track" style="height:10px;">
            <div class="bar-fill" style="width:${pct}%; background:${s.color};"></div>
          </div>
        </div>
      `;
    }).join('');

    const progressPanel = `
      <div class="panel">
        <h2>Syllabus Coverage by Subject</h2>
        <div style="margin-top:14px;">
          ${barsHtml || '<div class="empty-note">No progress data yet.</div>'}
        </div>
      </div>
    `;

    // --- 4. Day Navigator & Today's Schedule Panel ---
    const dayPanel = `
      <div id="dayPanelContainer">
        ${renderDayPanel()}
      </div>
    `;

    return overallPanel + goalPanel + progressPanel + dayPanel;
  }

  // -----------------------------------------------------------------------
  // Render Goal Setting Section
  // -----------------------------------------------------------------------
  function renderGoalSection() {
    const curSub = _subjects.find(s => String(s._id || s.id) === String(_selectedGoalSubId)) || _subjects[0];
    const subId = String(curSub._id || curSub.id);
    const totalLec = curSub.totalLectures || 0;
    const sched = curSub.weeklySchedule || { mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 0, sun: 0 };

    // Subject dropdown options
    const subOptions = _subjects.map(s => {
      const id = String(s._id || s.id);
      const selected = id === subId ? 'selected' : '';
      return `<option value="${id}" ${selected}>${Utils.escapeHtml(s.name)}</option>`;
    }).join('');

    // Weekly schedule calculation
    const weeklySum = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      .reduce((sum, day) => sum + (Number(sched[day]) || 0), 0);

    const subStat = (_lectureStats.bySubject || []).find(b => String(b._id) === String(subId)) || { done: 0 };
    const doneCount = subStat.done || 0;
    const remaining = Math.max(0, totalLec - doneCount);

    let paceEstimate = '0 lectures scheduled per week (Skipped/On hold)';
    if (totalLec === 0) {
      paceEstimate = `<span style="color:var(--muted);">Enter total syllabus lectures to calculate your completion date.</span>`;
    } else if (remaining === 0) {
      paceEstimate = `<span style="color:var(--teal); font-weight:600;">🎉 All ${totalLec} lectures completed! Syllabus 100% finished.</span>`;
    } else if (weeklySum === 0) {
      paceEstimate = `<span style="color:var(--ember);">⚠️ All 7 days are set to 0. Schedule at least 1 lecture/week to calculate completion.</span>`;
    } else {
      const weeksLeft = remaining / weeklySum;
      const daysLeft = Math.ceil(weeksLeft * 7);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysLeft);
      const finishStr = targetDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      paceEstimate = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            Pace: <strong style="color:var(--brass);">${weeklySum} lectures/week</strong> · 
            Remaining: <strong style="color:var(--paper);">${remaining} lectures</strong> (${doneCount} done)
          </div>
          <div style="color:var(--teal); font-weight:600;">
            📅 Finish syllabus by: ${finishStr} (~${daysLeft} days)
          </div>
        </div>
      `;
    }

    // Days pills for Mon - Sun
    const daysOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayPillsHtml = daysOrder.map(day => {
      const count = sched[day] !== undefined ? sched[day] : 1;
      const isSkipped = count === 0;
      return `
        <div class="schedule-day-box" style="background:var(--panel-raised); border:1px solid ${isSkipped ? 'var(--line)' : 'var(--brass-dim)'}; padding:10px 8px; text-align:center; border-radius:4px; flex:1; min-width:85px;">
          <div style="font-family:var(--font-mono); font-size:11px; font-weight:600; text-transform:uppercase; color:${isSkipped ? 'var(--muted)' : 'var(--brass)'};">
            ${day}
          </div>
          <div style="margin:6px 0;">
            <input type="number" class="day-sched-input" data-day="${day}" min="0" max="10" value="${count}" 
              style="width:50px; text-align:center; font-family:var(--font-mono); font-size:14px; padding:4px; background:var(--void); border:1px solid var(--line);">
          </div>
          <div class="day-status-label" style="font-size:10px; color:${isSkipped ? 'var(--muted)' : 'var(--teal)'}; font-family:var(--font-mono);">
            ${isSkipped ? 'Skipped' : `${count} lec/day`}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="panel" style="border: 1px solid var(--brass-dim); background: var(--panel);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <h2 style="color:var(--brass);">🎯 Set Subject Goals & Day Schedule</h2>
            <p class="panel-sub" style="margin-bottom:0;">
              Configure total lectures and days of week you will watch. Set 0 to skip a day.
            </p>
          </div>
          <div style="min-width:200px;">
            <label class="lbl">SELECT SUBJECT</label>
            <select id="goalSubjectSelect" style="padding:6px 10px; font-size:13px; font-weight:600;">${subOptions}</select>
          </div>
        </div>

        <form id="subjectGoalForm" style="margin-top:15px;">
          <div class="row-2" style="grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
            <div>
              <label class="field" style="margin-bottom:0;">
                <span class="lbl">TOTAL SYLLABUS LECTURES</span>
                <input type="number" id="goalTotalLectures" min="0" value="${totalLec}" placeholder="e.g. 45" required>
              </label>
            </div>
            <div>
              <label class="field" style="margin-bottom:0;">
                <span class="lbl">QUICK PRESETS</span>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:2px;">
                  <button type="button" class="text-btn preset-btn" data-preset="weekdays" style="padding:6px 10px; font-size:11px;">Mon–Fri (1/day)</button>
                  <button type="button" class="text-btn preset-btn" data-preset="daily" style="padding:6px 10px; font-size:11px;">Everyday (1/day)</button>
                  <button type="button" class="text-btn preset-btn" data-preset="weekend" style="padding:6px 10px; font-size:11px;">Weekend (2/day)</button>
                </div>
              </label>
            </div>
          </div>

          <label class="lbl" style="margin-bottom:8px;">DAILY LECTURE TARGET BY DAY OF WEEK (SET 0 TO SKIP DAY)</label>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:15px;">
            ${dayPillsHtml}
          </div>

          <!-- Live Completion Projection Badge -->
          <div id="livePaceEstimate" style="background:var(--panel-raised); border:1px solid var(--line); padding:12px 14px; margin-bottom:15px; font-size:13px; font-family:var(--font-mono); color:var(--paper); border-radius:4px;">
            ${paceEstimate}
          </div>

          <div style="display:flex; gap:10px;">
            <button type="submit" class="btn-primary" style="padding:10px 22px;">Save Goal & Schedule</button>
          </div>
        </form>
      </div>
    `;
  }

  // -----------------------------------------------------------------------
  // Render Day Panel (Chip strip + Subject tasks for viewed date)
  // -----------------------------------------------------------------------
  function renderDayPanel() {
    const todayISO = Utils.toISO(new Date());
    const v = _viewDate;
    const isToday = v === todayISO;
    const dayKey = getDayKey(v);

    // 7 days chip strip centred on viewDate (-3 to +3)
    let chipsHtml = '';
    for (let i = -3; i <= 3; i++) {
      const iso = Utils.addDays(v, i);
      const isActive = iso === v;
      const dotsForDay = (_allDays[iso] || []);
      const isoDayKey = getDayKey(iso);

      // Check if any subject is scheduled on this day
      const anyScheduled = _subjects.some(s => (s.weeklySchedule && s.weeklySchedule[isoDayKey] > 0));

      const dotHtml = _subjects.map(s => {
        const subId = String(s._id || s.id);
        const isDone = dotsForDay.includes(subId);
        return `<span class="dot${isDone ? ' on' : ''}"></span>`;
      }).join('');

      chipsHtml += `
        <div class="chip${isActive ? ' active' : ''}" data-chip="${iso}" style="cursor:pointer;" title="${DAY_NAMES[isoDayKey]}">
          <div class="wd">${isoDayKey.toUpperCase()}</div>
          <div class="dnum">${Utils.formatShort(iso)}</div>
          <div class="dots">${dotHtml || '&nbsp;'}</div>
          ${!anyScheduled ? '<div style="font-size:8px; color:var(--muted); margin-top:2px;">REST</div>' : ''}
        </div>
      `;
    }

    // Lecture rows for each subject on viewed day
    let rowsHtml = '';
    _subjects.forEach(s => {
      const subId = String(s._id || s.id);
      const sched = s.weeklySchedule || {};
      const dayTarget = sched[dayKey] !== undefined ? sched[dayKey] : 1;
      const isSkipped = dayTarget === 0;

      const completion = _dayCompletions[subId] || { done: false, count: 0 };
      const currentCount = completion.count || (completion.done ? 1 : 0);
      const isCompleted = dayTarget > 0 ? currentCount >= dayTarget : currentCount > 0;

      const total = s.totalLectures || 0;
      const subStat = (_lectureStats.bySubject || []).find(b => String(b._id) === String(subId)) || { done: 0 };
      const doneOverall = subStat.done;
      const isSyllabusDone = total > 0 && doneOverall >= total;

      if (isSyllabusDone) {
        rowsHtml += `
          <div class="lec-row complete" style="opacity:0.6; cursor:default;">
            <span class="subject-dot" style="background:${s.color};"></span>
            <div class="info">
              <div class="subj">${Utils.escapeHtml(s.name)}</div>
              <div class="lecno">Syllabus complete ✓ (${total}/${total})</div>
            </div>
          </div>
        `;
        return;
      }

      const checkSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#12161D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      let scheduleBadge = '';
      if (isSkipped) {
        scheduleBadge = `<span style="font-family:var(--font-mono); font-size:10px; color:var(--muted); border:1px dashed var(--line); padding:2px 6px; border-radius:3px;">Skipped Day</span>`;
      } else {
        scheduleBadge = `<span style="font-family:var(--font-mono); font-size:10px; color:var(--brass); border:1px solid var(--brass-dim); padding:2px 6px; border-radius:3px;">Target: ${dayTarget} lec</span>`;
      }

      rowsHtml += `
        <div class="lec-row${isCompleted ? ' done' : ''}" style="display:flex; align-items:center; gap:12px; padding:12px 16px;">
          <!-- Checkbox toggle button -->
          <button class="box" data-toggle="${subId}" style="cursor:pointer; background:${isCompleted ? 'var(--brass)' : 'transparent'}; border-color:${isCompleted ? 'var(--brass)' : 'var(--muted)'};" title="Toggle Done">
            ${isCompleted ? checkSvg : ''}
          </button>

          <!-- Subject Color Dot -->
          <span class="subject-dot" style="background:${s.color};"></span>

          <!-- Info -->
          <div class="info" style="flex:1;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="subj" style="font-weight:600; font-size:14px;">${Utils.escapeHtml(s.name)}</span>
              ${scheduleBadge}
            </div>
            <div class="lecno" style="margin-top:2px;">
              Lecture ${Math.min(total, doneOverall + 1)}${total > 0 ? ' / ' + total : ''} · 
              <span style="color:${isCompleted ? 'var(--teal)' : 'var(--muted)'}; font-weight:600;">
                Watched today: ${currentCount} ${dayTarget > 0 ? `/ ${dayTarget}` : ''}
              </span>
            </div>
          </div>

          <!-- Counter Controls (+ / -) -->
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="text-btn count-btn" data-sub="${subId}" data-change="-1" style="width:28px; height:28px; padding:0; display:flex; align-items:center; justify-content:center; font-size:15px;" title="Decrease count">-</button>
            <span style="font-family:var(--font-mono); font-size:13px; min-width:20px; text-align:center; font-weight:600;">${currentCount}</span>
            <button class="text-btn count-btn" data-sub="${subId}" data-change="1" style="width:28px; height:28px; padding:0; display:flex; align-items:center; justify-content:center; font-size:15px; color:var(--brass); border-color:var(--brass-dim);" title="Increase count">+</button>
          </div>
        </div>
      `;
    });

    const jumpBtn = isToday
      ? ''
      : `<button class="text-btn" id="lecJumpToday">Today</button>`;

    return `
      <div class="panel" style="margin-bottom: 30px;">
        <div class="day-nav">
          <div class="date-display">
            ${Utils.formatPretty(v)}
            <span style="font-family:var(--font-mono); font-size:12px; color:var(--muted); margin-left:6px;">(${DAY_NAMES[dayKey]})</span>
            ${isToday ? '<span class="tag">TODAY</span>' : ''}
          </div>
          <div class="nav-btns">
            <button class="icon-btn" id="lecNavPrev">&#8592;</button>
            ${jumpBtn}
            <button class="icon-btn" id="lecNavNext">&#8594;</button>
          </div>
        </div>

        <div class="chip-strip" id="lecChipStrip">
          ${chipsHtml}
        </div>

        <div id="lecRows" style="margin-top:15px;">
          ${rowsHtml || '<div class="empty-note">No subjects added yet.</div>'}
        </div>
      </div>
    `;
  }

  // -----------------------------------------------------------------------
  // Init & Event Listeners
  // -----------------------------------------------------------------------
  async function init() {
    await loadDayAndDays(_viewDate);
    _refreshDayPanel();

    bindHeaderEvents();
    bindGoalEvents();
    bindDayEvents();
  }

  function bindHeaderEvents() {
    const toggleBtn = document.getElementById('toggleGoalPanelBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        _showGoalPanel = !_showGoalPanel;
        const wrapper = document.getElementById('goalSectionWrapper');
        if (wrapper) wrapper.style.display = _showGoalPanel ? 'block' : 'none';
        toggleBtn.textContent = _showGoalPanel ? '▲ Hide Goal Setter' : '🎯 Set Goals & Daily Schedule';
      });
    }
  }

  function updatePaceEstimateLive() {
    const curSub = _subjects.find(s => String(s._id || s.id) === String(_selectedGoalSubId)) || _subjects[0];
    const subId = String(curSub._id || curSub.id);
    const subStat = (_lectureStats.bySubject || []).find(b => String(b._id) === String(subId)) || { done: 0 };
    const doneCount = subStat.done || 0;

    const totalInput = document.getElementById('goalTotalLectures');
    const totalLec = Math.max(0, parseInt(totalInput ? totalInput.value : 0, 10) || 0);

    let weeklySum = 0;
    document.querySelectorAll('.day-sched-input').forEach(inp => {
      const val = Math.max(0, parseInt(inp.value, 10) || 0);
      weeklySum += val;
      const box = inp.closest('.schedule-day-box');
      if (box) {
        box.style.borderColor = val === 0 ? 'var(--line)' : 'var(--brass-dim)';
        const label = box.querySelector('.day-status-label');
        if (label) {
          label.textContent = val === 0 ? 'Skipped' : `${val} lec/day`;
          label.style.color = val === 0 ? 'var(--muted)' : 'var(--teal)';
        }
      }
    });

    const remaining = Math.max(0, totalLec - doneCount);
    const badgeEl = document.getElementById('livePaceEstimate');
    if (!badgeEl) return;

    if (totalLec === 0) {
      badgeEl.innerHTML = `<span style="color:var(--muted);">Enter total syllabus lectures to calculate your completion date.</span>`;
    } else if (remaining === 0) {
      badgeEl.innerHTML = `<span style="color:var(--teal); font-weight:600;">🎉 All ${totalLec} lectures completed! Syllabus 100% finished.</span>`;
    } else if (weeklySum === 0) {
      badgeEl.innerHTML = `<span style="color:var(--ember);">⚠️ All 7 days are set to 0. Schedule at least 1 lecture/week to calculate completion.</span>`;
    } else {
      const weeksLeft = remaining / weeklySum;
      const daysLeft = Math.ceil(weeksLeft * 7);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysLeft);
      const finishStr = targetDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      badgeEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            Pace: <strong style="color:var(--brass);">${weeklySum} lectures/week</strong> · 
            Remaining: <strong style="color:var(--paper);">${remaining} lectures</strong> (${doneCount} done)
          </div>
          <div style="color:var(--teal); font-weight:600;">
            📅 Finish syllabus by: ${finishStr} (~${daysLeft} days)
          </div>
        </div>
      `;
    }
  }

  function bindGoalEvents() {
    // Subject selector in Goal panel
    const sel = document.getElementById('goalSubjectSelect');
    if (sel) {
      sel.addEventListener('change', (e) => {
        _selectedGoalSubId = String(e.target.value);
        const wrapper = document.getElementById('goalSectionWrapper');
        if (wrapper) {
          wrapper.innerHTML = renderGoalSection();
          bindGoalEvents(); // Rebind inputs inside the new form
        }
      });
    }

    // Real-time listener for total lectures input
    const totalInput = document.getElementById('goalTotalLectures');
    if (totalInput) {
      totalInput.addEventListener('input', updatePaceEstimateLive);
    }

    // Real-time listener for all day schedule inputs
    document.querySelectorAll('.day-sched-input').forEach(inp => {
      inp.addEventListener('input', updatePaceEstimateLive);
      inp.addEventListener('change', updatePaceEstimateLive);
    });

    // Presets buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        const inputs = document.querySelectorAll('.day-sched-input');
        inputs.forEach(inp => {
          const day = inp.getAttribute('data-day');
          if (preset === 'weekdays') {
            inp.value = (day === 'sat' || day === 'sun') ? 0 : 1;
          } else if (preset === 'daily') {
            inp.value = 1;
          } else if (preset === 'weekend') {
            inp.value = (day === 'sat' || day === 'sun') ? 2 : 0;
          }
        });
        updatePaceEstimateLive();
      });
    });

    // Form submission
    const form = document.getElementById('subjectGoalForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const totalLectures = parseInt(document.getElementById('goalTotalLectures').value, 10) || 0;
        const weeklySchedule = {};
        document.querySelectorAll('.day-sched-input').forEach(inp => {
          const d = inp.getAttribute('data-day');
          weeklySchedule[d] = Math.max(0, parseInt(inp.value, 10) || 0);
        });

        try {
          await API.put(`/api/subjects/${_selectedGoalSubId}`, {
            totalLectures,
            weeklySchedule
          });
          App.showToast('Goal & schedule updated successfully!');
          await App.refreshSubjects();
          await App.refreshStats();
          App.render();
        } catch (err) {
          App.showToast('Failed to save goal');
        }
      });
    }
  }

  function bindDayEvents() {
    const prevBtn = document.getElementById('lecNavPrev');
    const nextBtn = document.getElementById('lecNavNext');
    const todayBtn = document.getElementById('lecJumpToday');

    if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));
    if (todayBtn) todayBtn.addEventListener('click', () => setViewDate(Utils.toISO(new Date())));

    const strip = document.getElementById('lecChipStrip');
    if (strip) {
      strip.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-chip]');
        if (chip) setViewDate(chip.getAttribute('data-chip'));
      });
    }

    // Toggle box button & Counter controls
    const rowsEl = document.getElementById('lecRows');
    if (rowsEl) {
      rowsEl.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('[data-toggle]');
        if (toggleBtn) {
          const subjectId = toggleBtn.getAttribute('data-toggle');
          await toggleLecture(subjectId);
          return;
        }

        const countBtn = e.target.closest('.count-btn');
        if (countBtn) {
          const subId = countBtn.getAttribute('data-sub');
          const delta = parseInt(countBtn.getAttribute('data-change'), 10);
          await changeLectureCount(subId, delta);
        }
      });
    }
  }

  // -----------------------------------------------------------------------
  // Data Operations
  // -----------------------------------------------------------------------
  async function loadDayAndDays(date) {
    try {
      _dayCompletions = await API.get(`/api/lectures/day/${date}`) || {};
    } catch (e) {
      _dayCompletions = {};
    }

    const from = Utils.addDays(date, -10);
    const to   = Utils.addDays(date, 10);
    try {
      _allDays = await API.get(`/api/lectures/days?from=${from}&to=${to}`) || {};
    } catch (e) {
      _allDays = {};
    }
  }

  async function toggleLecture(subjectId) {
    const cur = _dayCompletions[subjectId] || { done: false, count: 0 };
    const dayKey = getDayKey(_viewDate);
    const curSub = _subjects.find(s => String(s._id || s.id) === String(subjectId));
    const target = (curSub && curSub.weeklySchedule && curSub.weeklySchedule[dayKey] !== undefined)
      ? curSub.weeklySchedule[dayKey]
      : 1;

    // If currently 0 -> set to target (or 1). If > 0 -> set to 0.
    const newCount = cur.count > 0 ? 0 : Math.max(1, target);
    await setLectureCount(subjectId, newCount);
  }

  async function changeLectureCount(subjectId, delta) {
    const cur = _dayCompletions[subjectId] || { done: false, count: 0 };
    const newCount = Math.max(0, (cur.count || 0) + delta);
    await setLectureCount(subjectId, newCount);
  }

  async function setLectureCount(subjectId, count) {
    try {
      await API.post('/api/lectures/toggle', { subjectId, date: _viewDate, count });
      if (count > 0) {
        _dayCompletions[subjectId] = { done: true, count };
        if (!_allDays[_viewDate]) _allDays[_viewDate] = [];
        if (!_allDays[_viewDate].includes(subjectId)) _allDays[_viewDate].push(subjectId);
      } else {
        delete _dayCompletions[subjectId];
        if (_allDays[_viewDate]) {
          _allDays[_viewDate] = _allDays[_viewDate].filter(id => id !== subjectId);
        }
      }
      await App.refreshStats();
      _refreshDayPanel();
    } catch (e) {
      App.showToast('Could not save — check connection');
    }
  }

  function _refreshDayPanel() {
    const container = document.getElementById('dayPanelContainer');
    if (container) {
      container.innerHTML = renderDayPanel();
      bindDayEvents();
    }
  }

  async function setViewDate(iso) {
    _viewDate = iso;
    await loadDayAndDays(iso);
    _refreshDayPanel();
  }

  async function navigate(delta) {
    await setViewDate(Utils.addDays(_viewDate, delta));
  }

  return { render, init };
})();

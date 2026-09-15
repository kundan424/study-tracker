// public/js/components/dashboard.js

window.Dashboard = (function() {
  function render(stats, subjects, todayGoal, lectureStats) {
    if (!stats) return '<div class="empty-note">No stats available.</div>';

    const todayISO = Utils.toISO(new Date());
    const todayStat = stats.last30Days.find(d => d.date === todayISO) || { totalMinutes: 0 };
    const todayMin = todayStat.totalMinutes;
    const goalMin = todayGoal ? todayGoal.targetMinutes : 120;
    const studyGoalPct = Math.min(100, Math.round((todayMin / goalMin) * 100));

    const totalHours = Math.round(stats.totalMinutes / 60) || 0;

    // Lecture Stats
    const lStats = lectureStats || { overallDone: 0, overallTotal: 0, todayTarget: 0, todayDone: 0, bySubject: [], last30Days: [] };
    const lecGoalPct = lStats.todayTarget > 0 
      ? Math.min(100, Math.round((lStats.todayDone / lStats.todayTarget) * 100))
      : (lStats.todayDone > 0 ? 100 : 0);
    const syllabusPct = lStats.overallTotal > 0
      ? Math.min(100, Math.round((lStats.overallDone / lStats.overallTotal) * 100))
      : 0;

    // --- Graph 1: Study Time (Last 7 Days) ---
    const last7Study = stats.last30Days.slice(-7);
    const maxDayMin = Math.max(...last7Study.map(d => d.totalMinutes), 60);
    let studyChartHTML = '';
    last7Study.forEach(day => {
      const percent = (day.totalMinutes / maxDayMin) * 100;
      const lbl = Utils.formatShort(day.date);
      studyChartHTML += `
        <div class="chart-bar-row">
          <div class="chart-bar-label">${lbl}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="chart-bar-value">${Utils.formatDuration(day.totalMinutes)}</div>
        </div>
      `;
    });
    if (last7Study.length === 0) studyChartHTML = '<div class="empty-note">No activity yet.</div>';

    // --- Graph 2: Lecture Consistency (Last 7 Days with Targets) ---
    const last7Lec = (lStats.last30Days || []).slice(-7);
    const maxLecCount = Math.max(...last7Lec.map(d => Math.max(d.count, d.target || 0)), 3);
    let lecChartHTML = '';
    last7Lec.forEach(day => {
      const countPct = (day.count / maxLecCount) * 100;
      const targetPct = ((day.target || 0) / maxLecCount) * 100;
      const lbl = Utils.formatShort(day.date);
      const isTargetMet = day.target > 0 ? day.count >= day.target : day.count > 0;
      const fillColor = isTargetMet ? 'var(--teal)' : 'var(--brass)';
      const statusBadge = day.target === 0 && day.count === 0 
        ? '<span style="color:var(--muted); font-size:10px;">Rest</span>'
        : `<span style="font-family:var(--font-mono); font-size:11px;">${day.count}/${day.target}</span>`;

      lecChartHTML += `
        <div class="chart-bar-row">
          <div class="chart-bar-label" style="display:flex; justify-content:space-between; align-items:center; min-width:80px; margin-right:6px;">
            <span>${lbl}</span>
            <span style="font-size:10px; text-transform:uppercase; color:var(--muted);">${day.dayKey || ''}</span>
          </div>
          <div class="chart-bar-track" style="position:relative; height:18px;">
            <!-- Target marker if target > 0 -->
            ${day.target > 0 ? `
              <div style="position:absolute; left:${targetPct}%; top:0; bottom:0; width:2px; background:rgba(232,226,208,0.4); z-index:2;" title="Target: ${day.target}"></div>
            ` : ''}
            <div class="chart-bar-fill" style="width: ${countPct}%; background: ${fillColor};"></div>
          </div>
          <div class="chart-bar-value" style="min-width:65px; text-align:right;">${statusBadge}</div>
        </div>
      `;
    });
    if (last7Lec.length === 0) lecChartHTML = '<div class="empty-note">No lecture data yet.</div>';

    // --- Subject Syllabus Progress (Lectures) ---
    let syllabusHTML = '';
    if (lStats.bySubject && lStats.bySubject.length > 0) {
      lStats.bySubject.forEach(sub => {
        const pct = sub.total > 0 ? Math.min(100, Math.round((sub.done / sub.total) * 100)) : 0;
        syllabusHTML += `
          <div class="bar-row" style="margin-bottom: 12px;">
            <div class="bar-label">
              <span class="name" style="display:flex; align-items:center; gap:8px;">
                <span class="color-dot" style="background: ${sub.color};"></span>
                ${Utils.escapeHtml(sub.name)}
              </span>
              <span class="count">${sub.done} / ${sub.total > 0 ? sub.total : '?'} lectures (${pct}%)</span>
            </div>
            <div class="bar-track" style="height:10px;">
              <div class="bar-fill" style="width: ${pct}%; background: ${sub.color};"></div>
            </div>
          </div>
        `;
      });
    } else {
      syllabusHTML = '<div class="empty-note">No subjects configured. Add subjects in the Subjects tab.</div>';
    }

    // --- Study Time by Subject ---
    let studySubjectHTML = '';
    if (stats.bySubject && stats.bySubject.length > 0) {
      const totalSubMin = stats.bySubject.reduce((sum, s) => sum + s.totalMinutes, 0) || 1;
      stats.bySubject.forEach(sub => {
        const percent = (sub.totalMinutes / totalSubMin) * 100;
        studySubjectHTML += `
          <div class="bar-row" style="margin-bottom: 8px;">
            <div class="bar-label" style="width: 100px; text-align: left;">
              <span class="color-dot" style="background: ${sub.color};"></span> ${Utils.escapeHtml(sub.name)}
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${percent}%; background: ${sub.color};"></div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--muted); min-width: 40px; margin-left: 10px;">
              ${Utils.formatDuration(sub.totalMinutes)}
            </div>
          </div>
        `;
      });
    } else {
      studySubjectHTML = '<div class="empty-note">No study session data yet.</div>';
    }

    return `
      <!-- Today's Dual Goal Tracker -->
      <div class="stat-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
        <div class="panel" style="margin-bottom: 0;">
          <h2>Today's Study Time</h2>
          <p class="panel-sub" style="margin-bottom: 10px;">
            ${Utils.formatDuration(todayMin)} / ${Utils.formatDuration(goalMin)} target (${studyGoalPct}%)
          </p>
          <div class="bar-track" style="height: 14px;">
            <div class="bar-fill" style="width: ${studyGoalPct}%; background: var(--brass);"></div>
          </div>
        </div>

        <div class="panel" style="margin-bottom: 0;">
          <h2>Today's Lectures</h2>
          <p class="panel-sub" style="margin-bottom: 10px;">
            ${lStats.todayDone} / ${lStats.todayTarget > 0 ? lStats.todayTarget : '0'} target scheduled (${lecGoalPct}%)
          </p>
          <div class="bar-track" style="height: 14px;">
            <div class="bar-fill" style="width: ${lecGoalPct}%; background: var(--teal);"></div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">TOTAL STUDY HOURS</div>
          <div class="stat-val">${totalHours}h</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">LECTURES COMPLETED</div>
          <div class="stat-val" style="color: var(--teal);">${lStats.overallDone}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">CURRENT STREAK</div>
          <div class="stat-val" style="color: var(--brass);">${stats.streak || 0}d</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">SYLLABUS PROGRESS</div>
          <div class="stat-val">${syllabusPct}%</div>
        </div>
      </div>

      <!-- Graphs Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div class="panel" style="margin-bottom: 0;">
          <h2>Study Consistency</h2>
          <p class="panel-sub">Hours studied per day (Last 7 days)</p>
          <div style="margin-top: 15px;">
            ${studyChartHTML}
          </div>
        </div>

        <div class="panel" style="margin-bottom: 0;">
          <h2>Lecture Consistency</h2>
          <p class="panel-sub">Lectures watched vs scheduled target (Last 7 days)</p>
          <div style="margin-top: 15px;">
            ${lecChartHTML}
          </div>
        </div>
      </div>

      <!-- Syllabus Progress by Subject -->
      <div class="panel" style="margin-top: 20px;">
        <h2>Syllabus Coverage by Subject</h2>
        <p class="panel-sub">Progress towards total lectures set in your syllabus</p>
        <div style="margin-top: 15px;">
          ${syllabusHTML}
        </div>
      </div>

      <!-- Self Study Time Breakdown -->
      <div class="panel" style="margin-top: 20px; margin-bottom: 30px;">
        <h2>Self-Study Time by Subject</h2>
        <div style="margin-top: 15px;">
          ${studySubjectHTML}
        </div>
      </div>
    `;
  }

  return { render };
})();

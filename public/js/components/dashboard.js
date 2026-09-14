// public/js/components/dashboard.js

window.Dashboard = (function() {
  function render(stats, subjects, todayGoal) {
    if (!stats) return '<div class="empty-note">No stats available.</div>';

    const todayISO = Utils.toISO(new Date());
    const todayStat = stats.last30Days.find(d => d.date === todayISO) || { totalMinutes: 0 };
    const todayMin = todayStat.totalMinutes;
    const goalMin = todayGoal ? todayGoal.targetMinutes : 120;
    const todayStr = `${Utils.formatDuration(todayMin)} / ${Utils.formatDuration(goalMin)} target`;

    const totalHours = Math.round(stats.totalMinutes / 60) || 0;

    const last7 = stats.last30Days.slice(-7);
    let chartHTML = '';
    const maxDayMin = Math.max(...last7.map(d => d.totalMinutes), 60);
    
    last7.forEach(day => {
      const percent = (day.totalMinutes / maxDayMin) * 100;
      const lbl = Utils.formatShort(day.date);
      chartHTML += `
        <div class="chart-bar-row">
          <div class="chart-bar-label">${lbl}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="chart-bar-value">${Utils.formatDuration(day.totalMinutes)}</div>
        </div>
      `;
    });
    if (last7.length === 0) chartHTML = '<div class="empty-note">No activity yet.</div>';

    let subjectHTML = '';
    if (stats.bySubject && stats.bySubject.length > 0) {
      const totalSubMin = stats.bySubject.reduce((sum, s) => sum + s.totalMinutes, 0) || 1;
      stats.bySubject.forEach(sub => {
        const percent = (sub.totalMinutes / totalSubMin) * 100;
        subjectHTML += `
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
      subjectHTML = '<div class="empty-note">No subject data yet.</div>';
    }

    return `
      <div class="panel">
        <h2>Today's Progress</h2>
        <div class="panel-sub">${todayStr}</div>
        <div class="bar-track" style="height: 24px; margin-top: 10px;">
          <div class="bar-fill" style="width: ${Math.min(100, (todayMin/goalMin)*100)}%; background: var(--brass);"></div>
        </div>
      </div>

      <div class="stat-grid" style="margin-top: 20px;">
        <div class="stat-box">
          <div class="stat-label">TOTAL HOURS</div>
          <div class="stat-val">${totalHours}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">SESSIONS</div>
          <div class="stat-val">${stats.totalSessions || 0}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">CURRENT STREAK</div>
          <div class="stat-val">${stats.streak || 0}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">LONGEST STREAK</div>
          <div class="stat-val">${stats.longestStreak || 0}</div>
        </div>
      </div>

      <div class="panel" style="margin-top: 20px;">
        <h2>Last 7 Days</h2>
        <div style="margin-top: 15px;">
          ${chartHTML}
        </div>
      </div>

      <div class="panel" style="margin-top: 20px; margin-bottom: 30px;">
        <h2>Time by Subject</h2>
        <div style="margin-top: 15px;">
          ${subjectHTML}
        </div>
      </div>
    `;
  }

  return { render };
})();

// public/js/components/calendar.js

window.Calendar = (function() {
  function render(stats) {
    return `
      <div class="panel">
        <h2>Activity Calendar</h2>
        <div class="panel-sub">Your study contributions over the last year</div>
        
        <div style="margin-top: 20px; overflow-x: auto;">
          <div id="heatmapContainer">
            <div class="empty-note">Loading heatmap...</div>
          </div>
        </div>
        
        <div style="display:flex; justify-content:flex-end; align-items:center; gap:4px; margin-top:10px; font-family:var(--font-mono); font-size:10px; color:var(--muted);">
          <span>Less</span>
          <div class="cal-cell" data-level="0"></div>
          <div class="cal-cell" data-level="1"></div>
          <div class="cal-cell" data-level="2"></div>
          <div class="cal-cell" data-level="3"></div>
          <span>More</span>
        </div>
      </div>
    `;
  }

  async function loadHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;

    const today = new Date();
    const endDate = Utils.toISO(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 15);
    const startDate = Utils.toISO(start);

    try {
      const sessions = await API.get(`/api/sessions?from=${startDate}&to=${endDate}`);
      
      const dataMap = {};
      sessions.forEach(s => {
        dataMap[s.date] = (dataMap[s.date] || 0) + s.duration;
      });

      const cols = 53;
      const rows = 7;
      let gridHTML = '<div class="cal-wrap"><div style="display:flex; flex-direction:column; justify-content:space-between; padding-top:14px; margin-right:5px;">';
      
      ['Mon', '', 'Wed', '', 'Fri', '', ''].forEach(day => {
        gridHTML += `<div class="cal-day-label" style="height:14px; line-height:14px; margin-bottom:3px;">${day}</div>`;
      });
      gridHTML += '</div><div class="cal-grid">';

      let curDate = new Date(start);
      while (curDate.getDay() !== 0) { 
        curDate.setDate(curDate.getDate() - 1);
      }

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const iso = Utils.toISO(curDate);
          const inRange = (curDate >= start && curDate <= today);
          const mins = dataMap[iso] || 0;
          
          let level = 0;
          if (mins > 0) level = 1;
          if (mins >= 60) level = 2;
          if (mins >= 120) level = 3;

          const ttText = `${Utils.formatPretty(iso)}: ${Utils.formatDuration(mins)}`;
          
          gridHTML += `
            <div class="cal-cell" ${inRange ? `data-level="${level}"` : 'style="visibility:hidden;"'}>
              ${inRange ? `<div class="cal-tooltip">${ttText}</div>` : ''}
            </div>
          `;
          curDate.setDate(curDate.getDate() + 1);
        }
      }
      gridHTML += '</div></div>';

      container.innerHTML = gridHTML;
      
    } catch(err) {
      container.innerHTML = '<div class="empty-note">Failed to load calendar data.</div>';
    }
  }

  function init() {
    loadHeatmap();
  }

  return { render, init };
})();

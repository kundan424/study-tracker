// public/js/utils.js

window.Utils = {
  // Returns 'YYYY-MM-DD' string from Date object
  toISO: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  },

  // Returns Date from 'YYYY-MM-DD' string
  parseISO: function(str) {
    if (!str) return new Date();
    const parts = str.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  },

  // Returns ISO string n days forward/back
  addDays: function(isoStr, n) {
    const d = this.parseISO(isoStr);
    d.setDate(d.getDate() + n);
    return this.toISO(d);
  },

  // Returns "Mon, 15 Sep 2026" format
  formatPretty: function(isoStr) {
    const d = this.parseISO(isoStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  },

  // Returns "15 Sep" format
  formatShort: function(isoStr) {
    const d = this.parseISO(isoStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  },

  // Escape HTML special characters
  escapeHtml: function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Returns "2h 30m" or "45m" format
  formatDuration: function(minutes) {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }
};

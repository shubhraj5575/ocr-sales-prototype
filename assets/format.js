/* OCR Sales — formatters */

const fmt = {
  inr(n, opts = {}) {
    const num = Number(n);
    if (Number.isNaN(num) || n === null || n === undefined || n === '') return '—';
    if (opts.compact) {
      const abs = Math.abs(num);
      if (abs >= 10_000_000) return '₹' + (num / 10_000_000).toFixed(2) + ' Cr';
      if (abs >= 100_000) return '₹' + (num / 100_000).toFixed(1) + ' L';
      if (abs >= 1_000) return '₹' + (num / 1_000).toFixed(0) + 'k';
      return '₹' + num.toFixed(0);
    }
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  },
  num(n) {
    if (n === null || n === undefined || n === '') return '—';
    const v = Number(n);
    return Number.isNaN(v) ? n : v.toLocaleString('en-IN');
  },
  date(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  initials(name) {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  },
  pillFor(type, value) {
    const v = (value || '').toString().toLowerCase();
    const map = {
      status: {
        active: 'pill-mint', completed: 'pill-evergreen', cancelled: 'pill-rust', transferred: 'pill-slate',
        cleared: 'pill-mint', pending: 'pill-gold', bounced: 'pill-rust',
        available: 'pill-mint', booked: 'pill-evergreen', sold: 'pill-ink', blocked: 'pill-rust',
        yes: 'pill-mint', no: 'pill-naked', 'pending approval': 'pill-gold',
      },
    };
    const cls = (map[type] || {})[v] || 'pill-naked';
    return `<span class="pill ${cls}">${value || '—'}</span>`;
  },
  shortId(s) {
    if (!s) return '—';
    return s.length > 14 ? s.slice(0, 12) + '…' : s;
  }
};

window.fmt = fmt;

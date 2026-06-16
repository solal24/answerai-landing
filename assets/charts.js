/* ============================================================
   AnswerAI — lightweight hand-built SVG charts
   ============================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function line(el, data, opts) {
    opts = opts || {};
    const w = 300, h = 110, pad = 8;
    const min = opts.min != null ? opts.min : Math.min(...data) - 0.2;
    const max = opts.max != null ? opts.max : Math.max(...data) + 0.2;
    const innerW = w - pad * 2, innerH = h - pad * 2;
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * innerW;
      const y = pad + (1 - (v - min) / (max - min)) * innerH;
      return [x, y];
    });
    // smooth-ish polyline + area
    const lineStr = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const areaStr = `${pad},${h - pad} ` + lineStr + ` ${w - pad},${h - pad}`;
    const last = pts[pts.length - 1];
    el.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;overflow:visible">
        <defs>
          <linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(79,70,229,.20)"/>
            <stop offset="100%" stop-color="rgba(79,70,229,0)"/>
          </linearGradient>
        </defs>
        <polygon points="${areaStr}" fill="url(#lcg)"/>
        <polyline points="${lineStr}" fill="none" stroke="#4F46E5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4.5" fill="#fff" stroke="#4F46E5" stroke-width="2.5"/>
      </svg>`;
  }

  function kwBars(el, items) {
    el.innerHTML = items.map(it => {
      const color = it.tone === 'neg' ? 'var(--amber)' : 'var(--green)';
      return `<div class="kw-bar">
        <span class="lbl">${it.label}</span>
        <span class="track"><span class="fill" style="width:0%;background:${color}"></span></span>
      </div>`;
    }).join('');
    // animate widths in
    requestAnimationFrame(() => {
      const fills = el.querySelectorAll('.fill');
      items.forEach((it, i) => {
        fills[i].style.transition = 'width .7s cubic-bezier(.2,.7,.3,1) ' + (i * 70) + 'ms';
        fills[i].style.width = it.value + '%';
      });
    });
  }

  // multi-point line with x labels (for monthly report)
  function lineLabeled(el, data, labels, opts) {
    opts = opts || {};
    const w = 560, h = 200, padX = 30, padTop = 18, padBot = 34;
    const min = opts.min != null ? opts.min : Math.min(...data) - 0.2;
    const max = opts.max != null ? opts.max : Math.max(...data) + 0.2;
    const innerW = w - padX * 2, innerH = h - padTop - padBot;
    const pts = data.map((v, i) => {
      const x = padX + (i / (data.length - 1)) * innerW;
      const y = padTop + (1 - (v - min) / (max - min)) * innerH;
      return [x, y];
    });
    const lineStr = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const areaStr = `${padX},${padTop + innerH} ` + lineStr + ` ${padX + innerW},${padTop + innerH}`;
    let grid = '';
    for (let g = 0; g <= 3; g++) {
      const y = padTop + (g / 3) * innerH;
      const val = (max - (g / 3) * (max - min)).toFixed(1);
      grid += `<line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="#EEF0F3" stroke-width="1"/>`;
      grid += `<text x="${padX - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#9AA1AE">${val}</text>`;
    }
    const xl = labels.map((lb, i) => {
      const x = padX + (i / (labels.length - 1)) * innerW;
      return `<text x="${x}" y="${h - 10}" text-anchor="middle" font-size="11" fill="#9AA1AE">${lb}</text>`;
    }).join('');
    const dots = pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#fff" stroke="#4F46E5" stroke-width="2"/>`).join('');
    el.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">
        <defs><linearGradient id="llg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(79,70,229,.18)"/><stop offset="100%" stop-color="rgba(79,70,229,0)"/></linearGradient></defs>
        ${grid}
        <polygon points="${areaStr}" fill="url(#llg)"/>
        <polyline points="${lineStr}" fill="none" stroke="#4F46E5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}${xl}
      </svg>`;
  }

  window.AnswerCharts = { line, kwBars, lineLabeled };
})();

/* =============================================
   REPORT.JS — Navegación + utilidades para reportes HTML X-Ray
   ============================================= */

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.mobile-toggle');
  const sidebar = document.querySelector('.report-sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar on link click (mobile)
    sidebar.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
        }
      });
    });
  }

  // Mark active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.report-sidebar nav a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});

// Dark mode toggle (manual only — default is light)
function initTheme() {
  // Frontier default is LIGHT. Dark mode only if explicitly set.
  const saved = localStorage.getItem('xray-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
initTheme();

// Chart.js helper — get Frontier colors for charts
function getFrontierColors() {
  return {
    brand: '#288183',
    success: '#2C8F92',
    danger: '#F7675E',
    warning: '#F4C542',
    info: '#3366FF',
    muted: '#A5A5A7',
    gridLines: getComputedStyle(document.documentElement).getPropertyValue('--border-default').trim() || '#DADBDB',
    text: getComputedStyle(document.documentElement).getPropertyValue('--text-default').trim() || '#1A1A1A'
  };
}

// Chart.js default config aligned with Frontier
function frontierChartDefaults() {
  const colors = getFrontierColors();
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = colors.text;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 16;
}

// Utility: create radar chart
function createRadarChart(canvasId, labels, data, targetValue) {
  const colors = getFrontierColors();
  frontierChartDefaults();
  return new Chart(document.getElementById(canvasId), {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Score Actual',
          data: data,
          backgroundColor: 'rgba(46, 92, 230, 0.15)',
          borderColor: colors.brand,
          borderWidth: 2,
          pointBackgroundColor: colors.brand,
          pointRadius: 4
        },
        {
          label: 'Target (3.5)',
          data: Array(labels.length).fill(targetValue || 3.5),
          backgroundColor: 'transparent',
          borderColor: '#3366FF',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1, display: true },
          grid: { color: colors.gridLines },
          angleLines: { color: colors.gridLines },
          pointLabels: { font: { size: 11, weight: '500' } }
        }
      },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Utility: create bar chart (horizontal or vertical)
function createBarChart(canvasId, labels, data, options = {}) {
  const colors = getFrontierColors();
  frontierChartDefaults();
  const barColors = data.map(v => v >= 3.5 ? colors.success : v >= 2 ? colors.warning : colors.danger);
  return new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: options.label || 'Valor',
        data: data,
        backgroundColor: barColors,
        borderRadius: 4,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      indexAxis: options.horizontal ? 'y' : 'x',
      scales: {
        y: { beginAtZero: true, max: options.max || undefined, grid: { color: colors.gridLines } },
        x: { grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// Utility: create doughnut/pie
function createPieChart(canvasId, labels, data, options = {}) {
  const palette = ['#2E5CE6', '#2C8F92', '#F4C542', '#F7675E', '#49D7FF', '#B0A7FF', '#707070', '#85A3FF', '#56A5A8'];
  frontierChartDefaults();
  return new Chart(document.getElementById(canvasId), {
    type: options.doughnut ? 'doughnut' : 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: palette.slice(0, data.length),
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--surface-card').trim() || '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right', labels: { font: { size: 11 } } }
      }
    }
  });
}


// Utility: create Gantt chart as HTML
function createGanttChart(containerId, phases) {
  // phases = [{name, start, duration, color}] where start/duration are in weeks
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalWeeks = phases.reduce((max, p) => Math.max(max, p.start + p.duration), 0);
  const colors = getFrontierColors();
  const palette = [colors.muted, colors.brand, colors.info, colors.success, colors.warning, '#B0A7FF'];

  // Week labels
  let weeksHtml = '<div style="display:flex; border-bottom:1px solid var(--border-default); padding-bottom:var(--sp-2); margin-bottom:var(--sp-3);">';
  weeksHtml += '<div style="width:120px; flex-shrink:0;"></div>';
  weeksHtml += '<div style="flex:1; display:flex;">';
  for (let w = 0; w <= totalWeeks; w += 2) {
    const pct = (w / totalWeeks) * 100;
    weeksHtml += `<div style="position:absolute; left:${pct}%; font-size:0.714rem; color:var(--text-muted);">S${w}</div>`;
  }
  weeksHtml += '</div></div>';

  // Bars
  let barsHtml = '';
  phases.forEach((phase, i) => {
    const leftPct = (phase.start / totalWeeks) * 100;
    const widthPct = (phase.duration / totalWeeks) * 100;
    const color = phase.color || palette[i % palette.length];

    barsHtml += `
      <div style="display:flex; align-items:center; margin-bottom:var(--sp-2); height:32px;">
        <div style="width:120px; flex-shrink:0; font-size:0.786rem; font-weight:500; color:var(--text-default); padding-right:var(--sp-2); text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${phase.name}</div>
        <div style="flex:1; position:relative; height:24px; background:var(--surface-subtle); border-radius:var(--radius-sm);">
          <div style="position:absolute; left:${leftPct}%; width:${widthPct}%; height:100%; background:${color}; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center;">
            <span style="font-size:0.714rem; color:#fff; font-weight:500;">${phase.duration}s</span>
          </div>
        </div>
      </div>`;
  });

  // Week markers
  let markersHtml = '<div style="display:flex; align-items:center; margin-top:var(--sp-2);">';
  markersHtml += '<div style="width:120px; flex-shrink:0;"></div>';
  markersHtml += '<div style="flex:1; display:flex; justify-content:space-between; position:relative;">';
  for (let w = 0; w <= totalWeeks; w += 2) {
    markersHtml += `<span style="font-size:0.714rem; color:var(--text-muted);">S${w}</span>`;
  }
  markersHtml += '</div></div>';

  container.innerHTML = barsHtml + markersHtml;
}

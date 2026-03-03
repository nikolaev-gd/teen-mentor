// ============================================================
// КОЛЕСО БАЛАНСА — balance-wheel.js
// ============================================================

// --- Constants ---
const MAX_SECTORS = 8;
const MIN_IMPORTANCE = 5;
const RING_COUNT = 10;
const WHEEL_CX = 250;
const WHEEL_CY = 250;
const WHEEL_R = 230;
const CENTER_R = 30;
const SVG_NS = 'http://www.w3.org/2000/svg';

const COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f',
    '#9b59b6', '#e67e22', '#1abc9c', '#e84393',
];

const COLORS_LIGHT = [
    'rgba(231,76,60,0.12)',  'rgba(52,152,219,0.12)',
    'rgba(46,204,113,0.12)', 'rgba(241,196,15,0.12)',
    'rgba(155,89,182,0.12)', 'rgba(230,126,34,0.12)',
    'rgba(26,188,156,0.12)', 'rgba(232,67,147,0.12)',
];

// Site background color (matches --bg in styles.css)
const BG_COLOR = '#FAF9F7';

// --- State ---
let sectors = [];
let nextId = 1;
let confirmCallback = null;
let isDraggingSlider = false;

// --- DOM refs ---
const wheelSvg = document.getElementById('wheel');
const sectorsList = document.getElementById('sectors-list');
const newSectorInput = document.getElementById('new-sector-input');
const inputArea = document.getElementById('input-area');
const confirmModal = document.getElementById('confirm-modal');
const confirmText = document.getElementById('confirm-text');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

// ============================================================
// DATA MODEL
// ============================================================

function addSector(name) {
    if (sectors.length >= MAX_SECTORS) return;
    sectors.push({
        id: nextId++,
        name: name,
        importance: 0,
        satisfaction: 0,
        colorIndex: findNextColorIndex(),
    });
    const equal = 100 / sectors.length;
    sectors.forEach(s => s.importance = equal);
    renderPanel();
    renderWheel();
}

function findNextColorIndex() {
    const used = new Set(sectors.map(s => s.colorIndex));
    for (let i = 0; i < COLORS.length; i++) {
        if (!used.has(i)) return i;
    }
    return 0;
}

function removeSector(id) {
    const idx = sectors.findIndex(s => s.id === id);
    if (idx === -1) return;
    const removed = sectors[idx];
    sectors.splice(idx, 1);

    if (sectors.length > 0) {
        const sumRemaining = sectors.reduce((sum, s) => sum + s.importance, 0);
        if (sumRemaining === 0) {
            const equal = 100 / sectors.length;
            sectors.forEach(s => s.importance = equal);
        } else {
            const freed = removed.importance;
            sectors.forEach(s => {
                s.importance += freed * (s.importance / sumRemaining);
            });
        }
        normalizeImportances();
    }
    renderPanel();
    renderWheel();
}

function setImportance(id, newValue) {
    const sector = sectors.find(s => s.id === id);
    if (!sector || sectors.length <= 1) return;

    const maxAllowed = 100 - (sectors.length - 1) * MIN_IMPORTANCE;
    newValue = Math.max(MIN_IMPORTANCE, Math.min(maxAllowed, newValue));

    const oldValue = sector.importance;
    const delta = newValue - oldValue;
    if (Math.abs(delta) < 0.01) return;

    sector.importance = newValue;

    const others = sectors.filter(s => s.id !== id);
    distributeDeficit(others, -delta);
    normalizeImportances();

    // Update panel values in-place (no DOM rebuild while dragging)
    updatePanelValues();
    renderWheel();
}

function distributeDeficit(targets, amount) {
    let remaining = amount;
    let iterations = 0;

    while (Math.abs(remaining) > 0.01 && iterations < 20) {
        iterations++;
        const unfrozen = targets.filter(s =>
            remaining < 0 ? s.importance > MIN_IMPORTANCE + 0.01 : true
        );
        if (unfrozen.length === 0) break;

        const sumUnfrozen = unfrozen.reduce((sum, s) => sum + s.importance, 0);
        if (sumUnfrozen <= 0.01) break;

        let distributed = 0;
        unfrozen.forEach(s => {
            const share = remaining * (s.importance / sumUnfrozen);
            const newVal = s.importance + share;
            if (newVal < MIN_IMPORTANCE) {
                distributed += (MIN_IMPORTANCE - s.importance);
                s.importance = MIN_IMPORTANCE;
            } else {
                distributed += share;
                s.importance = newVal;
            }
        });
        remaining -= distributed;
    }
}

function normalizeImportances() {
    const sum = sectors.reduce((s, sec) => s + sec.importance, 0);
    if (Math.abs(sum - 100) > 0.01 && sectors.length > 0) {
        sectors.forEach(s => s.importance *= (100 / sum));
    }
}

function setSatisfaction(id, value) {
    const sector = sectors.find(s => s.id === id);
    if (!sector) return;
    sector.satisfaction = Math.max(1, Math.min(RING_COUNT, value));
    renderWheel();
}

// ============================================================
// PANEL RENDERING
// ============================================================

function renderPanel() {
    sectorsList.innerHTML = '';

    sectors.forEach(sector => {
        const item = document.createElement('div');
        item.className = 'bw-sector-item';
        item.dataset.sectorId = sector.id;

        const color = COLORS[sector.colorIndex];

        // Header: [x] [dot] [name]
        const header = document.createElement('div');
        header.className = 'bw-sector-header';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bw-sector-delete';
        deleteBtn.textContent = '\u00d7';
        deleteBtn.addEventListener('click', () => {
            showConfirm(`\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u00ab${sector.name}\u00bb?`, () => removeSector(sector.id));
        });

        const dot = document.createElement('span');
        dot.className = 'bw-sector-color-dot';
        dot.style.background = color;

        const nameEl = document.createElement('span');
        nameEl.className = 'bw-sector-name';
        nameEl.textContent = sector.name;
        nameEl.style.color = color;

        header.append(deleteBtn, dot, nameEl);

        // Slider row
        const sliderRow = document.createElement('div');
        sliderRow.className = 'bw-sector-slider-row';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'bw-sector-slider';
        slider.min = MIN_IMPORTANCE;
        slider.max = 100 - (sectors.length - 1) * MIN_IMPORTANCE;
        slider.step = 0.5;
        slider.value = sector.importance;
        slider.dataset.sectorId = sector.id;
        styleSlider(slider, color, sector.importance);

        slider.addEventListener('input', (e) => {
            isDraggingSlider = true;
            setImportance(sector.id, parseFloat(e.target.value));
        });
        slider.addEventListener('change', () => {
            isDraggingSlider = false;
        });

        const percent = document.createElement('span');
        percent.className = 'bw-sector-percent';
        percent.dataset.sectorId = sector.id;
        percent.textContent = Math.round(sector.importance) + '%';

        sliderRow.append(slider, percent);
        item.append(header, sliderRow);
        sectorsList.appendChild(item);
    });

    // Inject dynamic thumb styles
    injectThumbStyles();

    // Show/hide input
    inputArea.style.display = sectors.length >= MAX_SECTORS ? 'none' : 'block';
}

function updatePanelValues() {
    sectors.forEach(sector => {
        const slider = sectorsList.querySelector(
            `.bw-sector-slider[data-sector-id="${sector.id}"]`
        );
        const percent = sectorsList.querySelector(
            `.bw-sector-percent[data-sector-id="${sector.id}"]`
        );
        if (slider) {
            slider.max = 100 - (sectors.length - 1) * MIN_IMPORTANCE;
            // Don't update value of the slider currently being dragged
            if (document.activeElement !== slider) {
                slider.value = sector.importance;
            }
            styleSlider(slider, COLORS[sector.colorIndex], sector.importance);
        }
        if (percent) {
            percent.textContent = Math.round(sector.importance) + '%';
        }
    });
}

function styleSlider(slider, color, value) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    slider.style.background =
        `linear-gradient(to right, ${color} ${pct}%, #e0e0e0 ${pct}%)`;
}

function injectThumbStyles() {
    let styleEl = document.getElementById('bw-dynamic-thumb-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'bw-dynamic-thumb-styles';
        document.head.appendChild(styleEl);
    }
    let css = '';
    sectors.forEach((sector, i) => {
        const color = COLORS[sector.colorIndex];
        css += `
            .bw-sector-item:nth-child(${i + 1}) .bw-sector-slider::-webkit-slider-thumb {
                background: ${color};
            }
            .bw-sector-item:nth-child(${i + 1}) .bw-sector-slider::-moz-range-thumb {
                background: ${color};
            }
        `;
    });
    styleEl.textContent = css;
}

// ============================================================
// SVG WHEEL RENDERING
// ============================================================

function polarToCart(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
    const os = polarToCart(cx, cy, outerR, startAngle);
    const oe = polarToCart(cx, cy, outerR, endAngle);
    const ie = polarToCart(cx, cy, innerR, endAngle);
    const is_ = polarToCart(cx, cy, innerR, startAngle);
    const lg = (endAngle - startAngle) > 180 ? 1 : 0;
    return [
        `M ${os.x} ${os.y}`,
        `A ${outerR} ${outerR} 0 ${lg} 1 ${oe.x} ${oe.y}`,
        `L ${ie.x} ${ie.y}`,
        `A ${innerR} ${innerR} 0 ${lg} 0 ${is_.x} ${is_.y}`,
        'Z'
    ].join(' ');
}

let hoverSectorId = null;
let hoverRing = null;

function renderWheel() {
    wheelSvg.innerHTML = '';

    if (sectors.length === 0) {
        renderEmptyWheel();
        return;
    }

    const ringW = (WHEEL_R - CENTER_R) / RING_COUNT;

    // Compute angles
    const slices = [];
    let angle = 0;
    sectors.forEach(s => {
        const sweep = (s.importance / 100) * 360;
        slices.push({ start: angle, end: angle + sweep, sector: s });
        angle += sweep;
    });

    // Draw ring segments for each sector
    slices.forEach(({ start, end, sector }) => {
        for (let r = 0; r < RING_COUNT; r++) {
            const innerR = CENTER_R + r * ringW;
            const outerR = CENTER_R + (r + 1) * ringW;
            const ringNum = r + 1;

            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', sectorPath(WHEEL_CX, WHEEL_CY, innerR, outerR, start, end));

            let fill;
            if (ringNum <= sector.satisfaction) {
                fill = COLORS[sector.colorIndex];
            } else if (hoverSectorId === sector.id && hoverRing !== null && ringNum <= hoverRing) {
                fill = COLORS[sector.colorIndex] + '66';
            } else {
                fill = COLORS_LIGHT[sector.colorIndex];
            }

            path.setAttribute('fill', fill);
            path.setAttribute('stroke', BG_COLOR);
            path.setAttribute('stroke-width', '1');
            path.style.cursor = 'pointer';

            path.addEventListener('mouseenter', () => {
                if (hoverSectorId !== sector.id || hoverRing !== ringNum) {
                    hoverSectorId = sector.id;
                    hoverRing = ringNum;
                    renderWheel();
                }
            });

            path.addEventListener('click', () => {
                setSatisfaction(sector.id, ringNum);
            });

            wheelSvg.appendChild(path);
        }
    });

    // Concentric ring lines (full circles)
    for (let r = 1; r <= RING_COUNT; r++) {
        const radius = CENTER_R + r * ringW;
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('cx', WHEEL_CX);
        c.setAttribute('cy', WHEEL_CY);
        c.setAttribute('r', radius);
        c.setAttribute('fill', 'none');
        c.setAttribute('stroke', 'rgba(0,0,0,0.08)');
        c.setAttribute('stroke-width', '0.8');
        c.style.pointerEvents = 'none';
        wheelSvg.appendChild(c);
    }

    // Radial dividers
    slices.forEach(({ start }) => {
        const p1 = polarToCart(WHEEL_CX, WHEEL_CY, CENTER_R, start);
        const p2 = polarToCart(WHEEL_CX, WHEEL_CY, WHEEL_R, start);
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('stroke', 'rgba(0,0,0,0.15)');
        line.setAttribute('stroke-width', '1.5');
        line.style.pointerEvents = 'none';
        wheelSvg.appendChild(line);
    });

    // Center circle
    const center = document.createElementNS(SVG_NS, 'circle');
    center.setAttribute('cx', WHEEL_CX);
    center.setAttribute('cy', WHEEL_CY);
    center.setAttribute('r', CENTER_R);
    center.setAttribute('fill', BG_COLOR);
    center.setAttribute('stroke', 'rgba(0,0,0,0.1)');
    center.setAttribute('stroke-width', '1');
    wheelSvg.appendChild(center);

    // Reset hover on leave
    wheelSvg.onmouseleave = () => {
        if (hoverSectorId !== null) {
            hoverSectorId = null;
            hoverRing = null;
            renderWheel();
        }
    };
}

function renderEmptyWheel() {
    const bg = document.createElementNS(SVG_NS, 'circle');
    bg.setAttribute('cx', WHEEL_CX);
    bg.setAttribute('cy', WHEEL_CY);
    bg.setAttribute('r', WHEEL_R);
    bg.setAttribute('fill', 'rgba(0,0,0,0.03)');
    bg.setAttribute('stroke', 'rgba(0,0,0,0.1)');
    bg.setAttribute('stroke-width', '1.5');
    wheelSvg.appendChild(bg);

    const center = document.createElementNS(SVG_NS, 'circle');
    center.setAttribute('cx', WHEEL_CX);
    center.setAttribute('cy', WHEEL_CY);
    center.setAttribute('r', CENTER_R);
    center.setAttribute('fill', BG_COLOR);
    center.setAttribute('stroke', 'rgba(0,0,0,0.1)');
    center.setAttribute('stroke-width', '1');
    wheelSvg.appendChild(center);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', WHEEL_CX);
    text.setAttribute('y', WHEEL_CY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', 'rgba(0,0,0,0.3)');
    text.setAttribute('font-size', '16');
    text.textContent = '\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0441\u0444\u0435\u0440\u0443 \u2192';
    wheelSvg.appendChild(text);
}

// ============================================================
// CONFIRM MODAL
// ============================================================

function showConfirm(message, onYes) {
    confirmText.textContent = message;
    confirmModal.classList.remove('bw-hidden');
    confirmCallback = onYes;
}

confirmYes.addEventListener('click', () => {
    confirmModal.classList.add('bw-hidden');
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
});

confirmNo.addEventListener('click', () => {
    confirmModal.classList.add('bw-hidden');
    confirmCallback = null;
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !confirmModal.classList.contains('bw-hidden')) {
        confirmModal.classList.add('bw-hidden');
        confirmCallback = null;
    }
});

// ============================================================
// INPUT HANDLING
// ============================================================

newSectorInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const name = newSectorInput.value.trim();
        if (!name) return;
        addSector(name);
        newSectorInput.value = '';
        newSectorInput.focus();
    }
});

// ============================================================
// INIT
// ============================================================

renderPanel();
renderWheel();
newSectorInput.focus();

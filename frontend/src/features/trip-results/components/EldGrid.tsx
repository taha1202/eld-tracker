import { useRef, useEffect } from 'react';
import type { DutySegment } from '../../../types/trip';
import { colors } from '../../../theme/palette';

const ROW_ORDER = ['OFF', 'SB', 'D', 'ON'] as const;
const ROW_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', ['On Duty', '(not driving)']];
const HOUR_LABELS = ['M','1','2','3','4','5','6','7','8','9','10','11','N','1','2','3','4','5','6','7','8','9','10','11'];

type Props = {
  segments: DutySegment[];
  svgId: string;
};

export default function EldGrid({ segments, svgId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // Clear any previous render
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const NS = 'http://www.w3.org/2000/svg';
    const marginLeft = 130;
    const marginTop = 22;
    const gridW = 820;
    const rowH = 34;
    const remarksTop = marginTop + rowH * 4 + 10;

    const el = (tag: string, attrs: Record<string, string | number>, text?: string) => {
      const e = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
      if (text !== undefined) e.textContent = text;
      return e;
    };

    // Hour gridlines + labels
    for (let h = 0; h <= 24; h++) {
      const x = marginLeft + (gridW / 24) * h;
      svg.appendChild(el('line', { x1: x, y1: marginTop, x2: x, y2: marginTop + rowH * 4, stroke: '#C7CCD4', 'stroke-width': 1 }));
      if (h < 24) {
        for (let q = 1; q < 4; q++) {
          const xm = x + (gridW / 24 / 4) * q;
          svg.appendChild(el('line', { x1: xm, y1: marginTop, x2: xm, y2: marginTop + rowH * 4, stroke: '#E9EBEF', 'stroke-width': 1 }));
        }
        const label = el('text', { x: x + 3, y: marginTop - 7, 'font-size': 8.5, fill: colors.textTertiary, 'font-family': "'JetBrains Mono', monospace" }, HOUR_LABELS[h]);
        svg.appendChild(label);
      }
    }

    // Row separators + labels
    for (let r = 0; r <= 4; r++) {
      const y = marginTop + rowH * r;
      svg.appendChild(el('line', { x1: marginLeft, y1: y, x2: marginLeft + gridW, y2: y, stroke: '#C7CCD4', 'stroke-width': 1 }));
    }
    svg.appendChild(el('line', { x1: marginLeft, y1: marginTop, x2: marginLeft, y2: marginTop + rowH * 4, stroke: '#C7CCD4', 'stroke-width': 1 }));
    svg.appendChild(el('line', { x1: marginLeft + gridW, y1: marginTop, x2: marginLeft + gridW, y2: marginTop + rowH * 4, stroke: '#C7CCD4', 'stroke-width': 1 }));

    ROW_LABELS.forEach((label, i) => {
      const y = marginTop + rowH * i + rowH / 2;
      const lines = Array.isArray(label) ? label : [label];
      lines.forEach((line, li) => {
        svg.appendChild(el('text', {
          x: marginLeft - 10, y: y + (li === 0 ? (lines.length > 1 ? -2 : 4) : 9),
          'text-anchor': 'end', 'font-size': 10.5, 'font-weight': 600, fill: colors.textSecondary,
          'font-family': "'Inter', sans-serif",
        }, line));
      });
    });

    // Duty status step path
    const rowIndex = (s: string) => ROW_ORDER.indexOf(s as typeof ROW_ORDER[number]);
    const xFor = (h: number) => marginLeft + (gridW / 24) * h;
    const yFor = (s: string) => marginTop + rowH * rowIndex(s) + rowH / 2;

    let d = '';
    segments.forEach((seg, i) => {
      const x1 = xFor(seg.start_hr);
      const x2 = xFor(seg.end_hr);
      const y = yFor(seg.status);
      d += (i === 0 ? `M ${x1} ${y} ` : `L ${x1} ${y} `) + `L ${x2} ${y} `;
      const next = segments[i + 1];
      if (next) d += `L ${x2} ${yFor(next.status)} `;
    });
    svg.appendChild(el('path', { d, fill: 'none', stroke: colors.navy, 'stroke-width': 2.75, 'stroke-linecap': 'round' }));

    // Remarks
    svg.appendChild(el('line', { x1: marginLeft, y1: remarksTop, x2: marginLeft + gridW, y2: remarksTop, stroke: '#C7CCD4', 'stroke-width': 1 }));
    svg.appendChild(el('text', {
      x: marginLeft - 10, y: remarksTop + 14, 'text-anchor': 'end',
      'font-size': 10.5, 'font-weight': 600, fill: colors.textSecondary,
      'font-family': "'Inter', sans-serif",
    }, 'Remarks'));

    segments.forEach((seg) => {
      if (!seg.remark) return;
      const x = xFor(seg.start_hr);
      svg.appendChild(el('line', { x1: x, y1: remarksTop, x2: x, y2: remarksTop + 8, stroke: '#B7BDC7', 'stroke-width': 1 }));
      const truncated = seg.remark.length > 40 ? seg.remark.substring(0, 38) + '...' : seg.remark;
      const t = el('text', {
        x: x + 3, y: remarksTop + 18, 'font-size': 9, fill: colors.textSecondary,
        'font-family': "'Inter', sans-serif",
        transform: `rotate(42 ${x + 3} ${remarksTop + 18})`,
      }, truncated);
      svg.appendChild(t);
    });
  }, [segments]);

  return (
    <svg
      ref={svgRef}
      id={svgId}
      viewBox="0 0 980 340"
      width="100%"
      height="340"
      style={{ display: 'block' }}
    />
  );
}

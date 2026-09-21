import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartPoint {
  x: string | Date;
  y: number;
  label?: string;
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  private _data = signal<ChartPoint[]>([]);

  @Input()
  set data(val: ChartPoint[]) {
    this._data.set(val || []);
  }
  get data(): ChartPoint[] {
    return this._data();
  }

  @Input() yAxisUnit: string = '';
  @Input() lineColor: string = '#6366f1';
  @Input() gradientId: string = 'lineGrad-' + Math.random().toString(36).substr(2, 9);
  @Input() height: number = 240;

  readonly hoveredPoint = signal<{ x: number; y: number; data: ChartPoint } | null>(null);

  // SVG viewBox dimensions
  readonly viewWidth = 600;
  readonly viewHeight = 240;
  readonly padding = { top: 25, right: 30, bottom: 40, left: 45 };

  readonly chartArea = computed(() => {
    return {
      x: this.padding.left,
      y: this.padding.top,
      width: this.viewWidth - this.padding.left - this.padding.right,
      height: this.viewHeight - this.padding.top - this.padding.bottom,
    };
  });

  readonly scaledPoints = computed(() => {
    const raw = this._data();
    if (raw.length === 0) return [];

    const area = this.chartArea();
    const yValues = raw.map((p) => p.y);
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);

    // Add padding to range
    if (minY === maxY) {
      minY = Math.max(0, minY - 5);
      maxY = maxY + 5;
    } else {
      const margin = (maxY - minY) * 0.15;
      minY = Math.max(0, minY - margin);
      maxY = maxY + margin;
    }

    const yRange = maxY - minY || 1;

    return raw.map((point, index) => {
      const x =
        raw.length === 1
          ? area.x + area.width / 2
          : area.x + (index / (raw.length - 1)) * area.width;

      const y = area.y + area.height - ((point.y - minY) / yRange) * area.height;

      return {
        svgX: Math.round(x * 10) / 10,
        svgY: Math.round(y * 10) / 10,
        data: point,
      };
    });
  });

  readonly pathD = computed(() => {
    const points = this.scaledPoints();
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].svgX} ${points[0].svgY}`;

    // Generate smooth or polyline path
    let d = `M ${points[0].svgX} ${points[0].svgY}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.svgX + curr.svgX) / 2;
      d += ` C ${cx} ${prev.svgY}, ${cx} ${curr.svgY}, ${curr.svgX} ${curr.svgY}`;
    }
    return d;
  });

  readonly areaD = computed(() => {
    const points = this.scaledPoints();
    if (points.length < 2) return '';
    const area = this.chartArea();
    const basePath = this.pathD();
    const last = points[points.length - 1];
    const first = points[0];
    return `${basePath} L ${last.svgX} ${area.y + area.height} L ${first.svgX} ${area.y + area.height} Z`;
  });

  readonly gridLines = computed(() => {
    const area = this.chartArea();
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = area.y + (i / steps) * area.height;
      lines.push(Math.round(y));
    }
    return lines;
  });

  onHover(point: { svgX: number; svgY: number; data: ChartPoint }): void {
    this.hoveredPoint.set({ x: point.svgX, y: point.svgY, data: point.data });
  }

  onLeave(): void {
    this.hoveredPoint.set(null);
  }

  formatDate(d: string | Date): string {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  unit?: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
})
export class DonutChartComponent {
  private _segments = signal<DonutSegment[]>([]);

  @Input()
  set segments(val: DonutSegment[]) {
    this._segments.set(val || []);
  }
  get segments(): DonutSegment[] {
    return this._segments();
  }

  @Input() centerValue: string | number = '';
  @Input() centerLabel: string = '';
  @Input() size: number = 180;
  @Input() strokeWidth: number = 16;

  readonly radius = computed(() => (this.size - this.strokeWidth) / 2);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());

  readonly totalValue = computed(() => {
    return this._segments().reduce((acc, seg) => acc + (seg.value || 0), 0);
  });

  readonly processedSegments = computed(() => {
    const raw = this._segments();
    const total = this.totalValue();
    const circ = this.circumference();

    if (total === 0) {
      return [];
    }

    let accumulatedOffset = 0;

    return raw.map((seg) => {
      const percentage = seg.value / total;
      const dashLength = percentage * circ;
      const strokeDasharray = `${dashLength} ${circ - dashLength}`;
      const strokeDashoffset = -accumulatedOffset;

      accumulatedOffset += dashLength;

      return {
        ...seg,
        percentage: Math.round(percentage * 100),
        strokeDasharray,
        strokeDashoffset,
      };
    });
  });
}

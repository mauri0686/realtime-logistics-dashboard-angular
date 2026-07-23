import { ScrollingModule } from '@angular/cdk/scrolling';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Shipment } from '../../../core/models/shipment.model';
import { StatusBadgeComponent } from './status-badge.component';

/**
 * The 5,000-row live table. Three things keep it fast at this volume:
 *
 * 1. **CDK virtual scroll** — only the ~30 visible rows exist in the DOM; scrolling recycles them.
 * 2. **trackBy on the stable id** — a delta batch re-renders only the rows whose object identity
 *    changed, instead of tearing down the whole list.
 * 3. **OnPush + immutable rows** — updates arrive as new objects in a new array, so change
 *    detection is a cheap reference check.
 */
@Component({
  selector: 'app-shipments-table',
  standalone: true,
  imports: [ScrollingModule, DecimalPipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipments-table.component.html',
  styleUrl: './shipments-table.component.scss',
})
export class ShipmentsTableComponent {
  readonly shipments = input.required<Shipment[]>();

  trackById(_index: number, s: Shipment): string {
    return s.id;
  }

  etaLabel(minutes: number): string {
    if (minutes <= 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
  }
}

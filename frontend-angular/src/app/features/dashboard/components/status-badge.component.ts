import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ShipmentStatus } from '../../../core/models/shipment.model';

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  Created: 'muted',
  PickedUp: 'muted',
  InTransit: 'accent',
  OutForDelivery: 'info',
  Delivered: 'ok',
  Delayed: 'warn',
  Exception: 'bad',
};

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  Created: 'Created',
  PickedUp: 'Picked up',
  InTransit: 'In transit',
  OutForDelivery: 'Out for delivery',
  Delivered: 'Delivered',
  Delayed: 'Delayed',
  Exception: 'Exception',
};

/** Tiny dumb component: status in, pill out. */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="cls()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      white-space: nowrap;
      border: 1px solid;
    }
    .muted  { color: var(--text-2); border-color: rgba(147, 163, 196, 0.35); background: rgba(147, 163, 196, 0.08); }
    .accent { color: var(--accent); border-color: rgba(34, 211, 238, 0.35);  background: rgba(34, 211, 238, 0.08); }
    .info   { color: var(--info);   border-color: rgba(96, 165, 250, 0.35);  background: rgba(96, 165, 250, 0.08); }
    .ok     { color: var(--ok);     border-color: rgba(52, 211, 153, 0.35);  background: rgba(52, 211, 153, 0.08); }
    .warn   { color: var(--warn);   border-color: rgba(251, 191, 36, 0.4);   background: rgba(251, 191, 36, 0.08); }
    .bad    { color: var(--bad);    border-color: rgba(251, 113, 133, 0.4);  background: rgba(251, 113, 133, 0.08); }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ShipmentStatus>();
  readonly cls = computed(() => STATUS_CLASS[this.status()]);
  readonly label = computed(() => STATUS_LABEL[this.status()]);
}

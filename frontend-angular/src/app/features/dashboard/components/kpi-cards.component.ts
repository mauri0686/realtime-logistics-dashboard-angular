import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface FleetKpis {
  total: number;
  inTransit: number;
  outForDelivery: number;
  delayed: number;
  delivered: number;
}

/**
 * Dumb/presentational component: signal input in, markup out — no services, no state.
 * OnPush + a new `kpis` object reference per update is all it takes to stay cheap.
 */
@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpis">
      <div class="panel kpi">
        <span class="value num">{{ kpis().total | number }}</span>
        <span class="label">Active shipments</span>
      </div>
      <div class="panel kpi accent">
        <span class="value num">{{ kpis().inTransit | number }}</span>
        <span class="label">In transit</span>
      </div>
      <div class="panel kpi info">
        <span class="value num">{{ kpis().outForDelivery | number }}</span>
        <span class="label">Out for delivery</span>
      </div>
      <div class="panel kpi bad">
        <span class="value num">{{ kpis().delayed | number }}</span>
        <span class="label">Delayed / exception</span>
      </div>
      <div class="panel kpi ok">
        <span class="value num">{{ kpis().delivered | number }}</span>
        <span class="label">Delivered (cycling)</span>
      </div>
    </div>
  `,
  styles: `
    .kpis {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
    }

    @media (max-width: 980px) {
      .kpis {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-top: 2px solid transparent;

      .value {
        font-size: 26px;
        font-weight: 650;
        letter-spacing: 0.02em;
      }

      .label {
        font-size: 11.5px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-3);
      }

      &.accent {
        border-top-color: var(--accent);
        .value { color: var(--accent); }
      }
      &.info {
        border-top-color: var(--info);
        .value { color: var(--info); }
      }
      &.bad {
        border-top-color: var(--bad);
        .value { color: var(--bad); }
      }
      &.ok {
        border-top-color: var(--ok);
        .value { color: var(--ok); }
      }
    }
  `,
})
export class KpiCardsComponent {
  /** Signal-based input (v17+): required, so the compiler enforces the contract. */
  readonly kpis = input.required<FleetKpis>();
}

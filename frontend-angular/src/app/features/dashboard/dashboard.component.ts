import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ALL_STATUSES, Shipment, ShipmentStatus } from '../../core/models/shipment.model';
import { AuthService } from '../../core/services/auth.service';
import { ShipmentsService } from '../../core/services/shipments.service';
import { KpiCardsComponent } from './components/kpi-cards.component';
import { ShipmentsTableComponent } from './components/shipments-table.component';

type StatusFilter = ShipmentStatus | 'All';

/**
 * Smart container: owns the feed lifecycle and derives the view state; presentational children
 * (KPI cards, table) are dumb OnPush components fed via inputs.
 *
 * Derivation pipeline: RxJS handles the async edge (debounced form input → signal via toSignal),
 * signals handle synchronous derived state (computed filter over the live fleet). That split —
 * streams for events, signals for state — is the modern Angular pattern.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, UpperCasePipe, KpiCardsComponent, ShipmentsTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly feed = inject(ShipmentsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly statuses = ALL_STATUSES;
  readonly username = this.auth.username;
  readonly status = this.feed.status;
  readonly updatesPerSec = this.feed.updatesPerSec;

  readonly searchControl: FormControl<string> = this.fb.control('');
  readonly statusControl: FormControl<StatusFilter> = this.fb.control<StatusFilter>('All');

  // Debounce the free-text input (an async concern → RxJS), then hand it to the signal world.
  private readonly search = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      map((q) => q.trim().toLowerCase()),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  private readonly statusFilter = toSignal(this.statusControl.valueChanges, {
    initialValue: 'All' as StatusFilter,
  });

  /** The table's data source: live fleet × search × status filter, recomputed on any change. */
  readonly filtered = computed<Shipment[]>(() => {
    const q = this.search();
    const status = this.statusFilter();
    let rows = this.feed.shipments();

    if (status !== 'All') rows = rows.filter((s) => s.status === status);
    if (q) {
      rows = rows.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.customer.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          s.carrier.toLowerCase().includes(q),
      );
    }
    return rows;
  });

  readonly kpis = computed(() => {
    const rows = this.feed.shipments();
    const count = (s: ShipmentStatus) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      inTransit: count('InTransit'),
      outForDelivery: count('OutForDelivery'),
      delayed: count('Delayed') + count('Exception'),
      delivered: count('Delivered'),
    };
  });

  ngOnInit(): void {
    void this.feed.connect();
  }

  ngOnDestroy(): void {
    // Explicit teardown: leaving the dashboard closes the socket — nothing keeps streaming
    // into a page that no longer exists.
    void this.feed.disconnect();
  }

  logout(): void {
    void this.feed.disconnect();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

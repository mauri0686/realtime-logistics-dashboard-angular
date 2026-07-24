import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DemoShipmentGenerator } from '../demo/demo-data';
import { isDemoMode } from '../demo/demo-mode';
import { Shipment } from '../models/shipment.model';
import { AuthService } from './auth.service';

export type StreamStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'error';

/**
 * Real-time shipment feed. REST for the initial snapshot (request/response), SignalR for live
 * push (WebSocket). Rows live in a Map for O(1) delta merges and are projected into a signal
 * that the UI reads — components never touch the socket.
 *
 * Leak-safety (the classic "dashboard slows down over time" bug): the hub connection is created
 * exactly ONCE in this root singleton, `connect()` is idempotent, and `disconnect()` tears the
 * socket down explicitly. Components subscribe to nothing, so navigating around the app can't
 * stack subscriptions.
 */
@Injectable({ providedIn: 'root' })
export class ShipmentsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly byId = new Map<string, Shipment>();
  private hub: HubConnection | null = null;
  private demo: DemoShipmentGenerator | null = null;
  private demoTimer?: ReturnType<typeof setInterval>;

  private readonly _shipments = signal<Shipment[]>([]);
  private readonly _status = signal<StreamStatus>('idle');
  private readonly _updatesPerSec = signal(0);
  private updateCounter = 0;
  private rateTimer?: ReturnType<typeof setInterval>;

  /** Entire fleet, latest state. New array reference on every merge (plays well with OnPush). */
  readonly shipments: Signal<Shipment[]> = this._shipments.asReadonly();
  readonly status = this._status.asReadonly();
  readonly updatesPerSec = this._updatesPerSec.asReadonly();
  readonly isLive = computed(() => this._status() === 'live');

  /** Loads the REST snapshot, then opens the live stream. Idempotent. */
  async connect(): Promise<void> {
    if (this.hub || this.demo) return;

    // Demo mode (GitHub Pages / ?demo=1): identical UI, but the simulation that normally lives
    // in the .NET backend runs right here in the browser — zero infrastructure needed.
    if (isDemoMode()) {
      this._status.set('connecting');
      this.demo = new DemoShipmentGenerator(5000);
      this.replaceAll(this.demo.snapshot());
      this.demoTimer = setInterval(() => {
        if (this.demo) this.applyUpdates(this.demo.tick());
      }, 1000);
      this.startRateMeter();
      this._status.set('live');
      return;
    }

    this._status.set('connecting');
    try {
      const snapshot = await firstValueFrom(
        this.http.get<Shipment[]>(`${environment.apiBaseUrl}/api/shipments`),
      );
      this.replaceAll(snapshot);
      await this.startHub();
      this.startRateMeter();
    } catch {
      this._status.set('error');
    }
  }

  async disconnect(): Promise<void> {
    if (this.rateTimer) clearInterval(this.rateTimer);
    this.rateTimer = undefined;
    if (this.demoTimer) clearInterval(this.demoTimer);
    this.demoTimer = undefined;
    this.demo = null;
    if (this.hub) {
      const hub = this.hub;
      this.hub = null;
      await hub.stop();
    }
    this.byId.clear();
    this._shipments.set([]);
    this._status.set('idle');
  }

  private async startHub(): Promise<void> {
    const hub = new HubConnectionBuilder()
      .withUrl(`${environment.apiBaseUrl}/hubs/shipments`, {
        accessTokenFactory: () => this.auth.token ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    hub.on('ShipmentsUpdated', (updates: Shipment[]) => this.applyUpdates(updates));
    hub.onreconnecting(() => this._status.set('reconnecting'));
    hub.onreconnected(async () => {
      // Deltas were missed while offline — resync the full snapshot over the socket.
      const snapshot = await hub.invoke<Shipment[]>('GetSnapshot');
      this.replaceAll(snapshot);
      this._status.set('live');
    });
    hub.onclose(() => {
      // Deliberate stop() puts us in 'idle' via disconnect(); anything else is an error.
      if (this.hub !== null) this._status.set('error');
    });

    await hub.start();
    this.hub = hub;
    this._status.set('live');
  }

  private applyUpdates(updates: Shipment[]): void {
    for (const s of updates) {
      this.byId.set(s.id, s);
    }
    this.updateCounter += updates.length;
    this._shipments.set([...this.byId.values()]);
  }

  private replaceAll(shipments: Shipment[]): void {
    this.byId.clear();
    for (const s of shipments) this.byId.set(s.id, s);
    this._shipments.set([...this.byId.values()]);
  }

  private startRateMeter(): void {
    this.rateTimer = setInterval(() => {
      this._updatesPerSec.set(this.updateCounter);
      this.updateCounter = 0;
    }, 1000);
  }
}

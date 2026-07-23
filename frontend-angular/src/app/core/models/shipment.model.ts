export type ShipmentStatus =
  | 'Created'
  | 'PickedUp'
  | 'InTransit'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Delayed'
  | 'Exception';

export type Priority = 'Standard' | 'Express' | 'Overnight';

/** Mirrors the API's Shipment record. Updates always arrive as brand-new objects (immutable rows). */
export interface Shipment {
  id: string;
  carrier: string;
  origin: string;
  destination: string;
  customer: string;
  status: ShipmentStatus;
  lat: number;
  lng: number;
  progressPct: number;
  etaMinutes: number;
  weightKg: number;
  priority: Priority;
  lastUpdated: string;
}

export const ALL_STATUSES: readonly ShipmentStatus[] = [
  'Created',
  'PickedUp',
  'InTransit',
  'OutForDelivery',
  'Delivered',
  'Delayed',
  'Exception',
];

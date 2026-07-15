export type DeliveryStopStatus = 'ASSIGNED' | 'DELIVERED' | 'FAILED';

export interface DeliveryStop {
  id: string;
  orderId: string;
  buyer?: { id: string; name: string; email?: string };
  driver?: { id: string; name: string } | null;
  orderStatus: string;
  stopStatus: DeliveryStopStatus | null;
  deliveryAddress: string;
  deliveryNotes?: string | null;
  scheduledDeliveryDate?: string | null;
  latitude: number;
  longitude: number;
  coordinatesAreApproximate: boolean;
  stopSequence?: number | null;
  failedReason?: string | null;
  deliveredAt?: string | null;
  totalAmount: number;
  items?: Array<{
    id: string;
    quantityOrdered: number;
    product: { id: string; name: string; unit: string };
  }>;
}

export interface RouteProposal {
  orderedOrderIds: string[];
  stops: Array<{
    orderId: string;
    address: string;
    latitude: number;
    longitude: number;
    sequence: number;
    coordinatesAreApproximate: boolean;
  }>;
  rationale: string;
  isFallback: boolean;
}

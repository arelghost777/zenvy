export type OrderStatus = "pending" | "paid" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  totalPrice: number;
  currency: string;
  status: OrderStatus;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssuedTicket {
  id: string;
  orderId: string;
  eventId: string;
  userId: string;
  ticketTypeId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  price: number;
  uniqueCode: string;
  qrCode: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  // client-side only fields used for display / PDF generation
  ticketTypeName?: string;
  qrDataUrl?: string;
}

/** Selected ticket type + quantity, coming from the event detail page */
export interface BookingItem {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

/** Shape stored in sessionStorage between EventDetail and Checkout */
export interface BookingData {
  event: {
    id: string;
    title: string;
    address?: string;
    currency?: string;
    [key: string]: any;
  };
  items: BookingItem[];
  totalPrice: number;
}

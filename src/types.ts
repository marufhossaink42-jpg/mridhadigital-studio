export type OrderStatus = 'pending' | 'working' | 'completed';

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  serviceType: 'B&W Photocopy' | 'Passport Photo Printing' | 'Online Application';
  documentUrl?: string; // Base64 or URL
  status: OrderStatus;
  trackingId: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  emergencyNotice: string;
  showNotice: boolean;
  adminPassword?: string;
}

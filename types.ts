
export interface SMSMessage {
  id?: string;
  sender: string;
  body: string;
  timestamp: any; // Firestore timestamp
  date: number;
  sync_status: 'captured' | 'synced';
}

export interface ServiceState {
  isActive: boolean;
  token: string;
  isVerifying: boolean;
}

export enum ConnectionStatus {
  INACTIVE = 'Inactive',
  ACTIVE = 'Active',
  VERIFYING = 'Verifying'
}

export interface Court {
  id: number;
  name: string;
  location: string;
  status?: string;
  availableSlots: string[];
}

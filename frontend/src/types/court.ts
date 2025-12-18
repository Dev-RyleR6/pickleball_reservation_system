export interface Court {
  id: number;
  name: string;
  location: string;
  status?: string;
  image?: string | null;
  availableSlots: string[];
}

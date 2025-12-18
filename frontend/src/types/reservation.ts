export interface Reservation {
  id: number;
  user_id: number;
  court_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  court_name?: string;
  user_name?: string;
  // Frontend convenience fields
  courtName?: string;
  courtId?: string;
  time?: string;
}

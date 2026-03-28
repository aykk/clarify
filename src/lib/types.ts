export interface TriggerRule {
  id: string;
  user_id: string;
  name: string;
  trigger_phrase: string;
  /** First number; kept for legacy rows and NOT NULL schemas. */
  phone_number: string;
  /** All numbers to call when the trigger fires (parallel outbound calls). */
  phone_numbers?: string[] | null;
  message: string;
  include_location: boolean;
  created_at: string;
}

export interface CallLog {
  id: string;
  user_id: string;
  trigger_phrase: string;
  phone_number: string;
  message: string;
  success: boolean;
  created_at: string;
}

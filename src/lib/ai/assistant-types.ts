/** Structured actions the model may propose; user confirms before DB writes. */

export type AssistantProposal =
  | {
      kind: "create_trigger";
      name: string;
      trigger_phrase: string;
      phone_numbers: string[];
      message: string;
      include_location: boolean;
    }
  | {
      kind: "update_trigger";
      id: string;
      name?: string;
      trigger_phrase?: string;
      phone_numbers?: string[];
      message?: string;
      include_location?: boolean;
    }
  | {
      kind: "delete_trigger";
      id: string;
    };

export interface AssistantChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AssistantResponsePayload {
  reply: string;
  proposals: AssistantProposal[];
}

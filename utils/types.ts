import { Database } from "./types_db";

export interface Template {
  name: string;
  slug: string;
  icon: string;
  desc: string;
  category: string;
  aiPrompt: string;
  form: Form[];
}

export interface Form {
  label: string;
  field: string;
  name: string;
  required: boolean;
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Query = Database["public"]["Tables"]["queries"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

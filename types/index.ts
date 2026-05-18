export type ScanFieldResult = {
  value: string | null;
  confidence: number | null;
};

export type ScanResult = {
  name: ScanFieldResult;
  email: ScanFieldResult;
  phone: ScanFieldResult;
  website: ScanFieldResult;
  social_handles: {
    value: Record<string, string> | null;
    confidence: number | null;
  };
};

export type Business = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  social_handles: Record<string, string>;
  category: string | null;
  met_at: string | null;
  notes: string | null;
  card_image_url: string | null;
  needs_review: boolean;
};

export type ScanConfidence = {
  id: string;
  business_id: string;
  field_name: string;
  confidence_score: number;
};

export type Feedback = {
  id: string;
  created_at: string;
  note: string;
  business_id: string | null;
};

export type BusinessFormData = {
  name: string;
  email: string;
  phone: string;
  website: string;
  social_handles: Record<string, string>;
  category: string;
  met_at: string;
  notes: string;
  needs_review: boolean;
};

export const EMPTY_FORM_DATA: BusinessFormData = {
  name: '',
  email: '',
  phone: '',
  website: '',
  social_handles: {},
  category: '',
  met_at: '',
  notes: '',
  needs_review: false,
};

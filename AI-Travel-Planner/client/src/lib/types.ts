export type TripStatus = 'planning' | 'active' | 'completed';

export type ItineraryItemType = 'activity' | 'meal' | 'transport' | 'accommodation';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'other';

export type PackingCategory =
  | 'essentials'
  | 'clothing'
  | 'electronics'
  | 'documents'
  | 'toiletries';

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  interests: string[];
  cover_image: string | null;
  status: TripStatus;
  created_at: string;
}

export interface ItineraryItem {
  id: string;
  trip_id: string;
  day: number;
  time: string | null;
  title: string;
  description: string | null;
  type: ItineraryItemType;
  created_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  created_at: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  name: string;
  category: PackingCategory;
  checked: boolean;
  created_at: string;
}

export interface TripWithCounts extends Trip {
  itinerary_count?: number;
  expense_total?: number;
  packing_total?: number;
  packing_checked?: number;
}

export interface PlacePhoto {
  name: string;
  widthPx?: number;
  heightPx?: number;
  url: string;
  thumbnailUrl?: string;
  authorAttributions?: {
    displayName: string;
    uri?: string | null;
    photoUri?: string | null;
  }[];
}

export interface PlaceOpeningHours {
  openNow?: boolean;
  periods?: {
    open?: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }[];
  weekdayDescriptions?: string[];
}

export interface PlaceDetails {
  id: string;
  placeId: string;
  name: string;
  formattedAddress: string;
  shortAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  userRatingCount?: number | null;
  types?: string[];
  primaryType?: string | null;
  primaryTypeDisplayName?: string | null;
  businessStatus?: string | null;
  currentOpeningHours?: PlaceOpeningHours | null;
  regularOpeningHours?: PlaceOpeningHours | null;
  weekdayDescriptions?: string[];
  nationalPhoneNumber?: string | null;
  internationalPhoneNumber?: string | null;
  websiteUri?: string | null;
  googleMapsUri?: string | null;
  photos?: PlacePhoto[];
  imageUrl?: string | null;
  editorialSummary?: string | null;
  source?: 'google' | 'photon' | 'cache';
}


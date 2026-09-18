import axiosInstance from "./axios";

export interface PlaceReviewItem {
  _id: string;
  placeId: string;
  destination?: string;
  userId: string;
  userName: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string | null;
  };
  rating: number;
  comment: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlaceReviewSummary {
  totalReviews: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface PlaceReviewsResponse {
  reviews: PlaceReviewItem[];
  summary: PlaceReviewSummary;
}

/**
 * Fetch reviews for a specific Google Place ID
 */
export const getPlaceReviews = async (placeId: string): Promise<PlaceReviewsResponse> => {
  try {
    const response = await axiosInstance.get(`/places/${encodeURIComponent(placeId.trim())}/reviews`);
    return {
      reviews: response.data.data || [],
      summary: response.data.summary || {
        totalReviews: (response.data.data || []).length,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
    };
  } catch (error: any) {
    console.error("Error fetching place reviews:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch place reviews");
  }
};

/**
 * Submit or update a review for a Google Place ID
 */
export const createPlaceReview = async (
  placeId: string,
  rating: number,
  comment: string,
  destination?: string
): Promise<PlaceReviewItem> => {
  try {
    const response = await axiosInstance.post(`/places/${encodeURIComponent(placeId.trim())}/reviews`, {
      rating,
      comment,
      destination,
    });
    return response.data.data;
  } catch (error: any) {
    console.error("Error posting place review:", error);
    throw new Error(error.response?.data?.message || "Failed to post review");
  }
};

/**
 * Delete a user's review for a Google Place ID
 */
export const deletePlaceReview = async (placeId: string, reviewId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/places/${encodeURIComponent(placeId.trim())}/reviews/${encodeURIComponent(reviewId)}`);
  } catch (error: any) {
    console.error("Error deleting place review:", error);
    throw new Error(error.response?.data?.message || "Failed to delete review");
  }
};

// Existing destination review functions preserved
export const createReview = async (destination: string, rating: number, content: string) => {
  try {
    const response = await axiosInstance.post(`/reviews`, { destination, rating, content });
    return response.data;
  } catch (error: any) {
    console.error("Error creating review:", error);
    throw new Error(error.response?.data?.message || "Failed to create review");
  }
};

export const getDestinationReviews = async (destination: string) => {
  try {
    const response = await axiosInstance.get(`/reviews/destination/${encodeURIComponent(destination)}`);
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching destination reviews:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch reviews");
  }
};

export const getUserReviews = async () => {
  try {
    const response = await axiosInstance.get(`/reviews/user/me`);
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching user reviews:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch your reviews");
  }
};


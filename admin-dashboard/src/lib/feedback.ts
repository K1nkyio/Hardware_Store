import { apiRequest } from "@/lib/api";

export type ModerationReview = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verified: boolean;
  createdAt: string;
};

export type ModerationQuestion = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  question: string;
  answer: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  answeredAt: string;
};

export type ModerationQueueItem = {
  type: "review" | "question";
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  authorName: string;
  message: string;
  answer: string;
  moderationState: "pending" | "approved" | "rejected" | "answered";
  createdAt: string;
};

export type ModerationHistoryEntry = {
  id: string;
  entityType: "review" | "question";
  entityId: string;
  action: string;
  templateKey: string;
  note: string;
  actorRole: string;
  createdAt: string;
};

export type CustomerInquiry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  orderNumber: string;
  message: string;
  status: "pending" | "in_review" | "resolved" | "spam";
  moderationNote: string;
  moderatedBy: string;
  moderatedByName?: string;
  moderatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export async function listModerationReviews(): Promise<ModerationReview[]> {
  return apiRequest<ModerationReview[]>("/api/products/moderation/reviews/list");
}

export async function updateReviewVerification(
  reviewId: string,
  verified: boolean,
  options: { templateKey?: string; note?: string } = {}
): Promise<ModerationReview> {
  return apiRequest<ModerationReview>(`/api/products/moderation/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify({ verified, templateKey: options.templateKey, note: options.note }),
  });
}

export async function listModerationQuestions(): Promise<ModerationQuestion[]> {
  return apiRequest<ModerationQuestion[]>("/api/products/moderation/questions/list");
}

export async function updateQuestionAnswer(
  questionId: string,
  answer: string,
  options: { templateKey?: string; note?: string } = {}
): Promise<ModerationQuestion> {
  return apiRequest<ModerationQuestion>(`/api/products/moderation/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify({ answer, templateKey: options.templateKey, note: options.note }),
  });
}

export async function listModerationQueue(search = ""): Promise<ModerationQueueItem[]> {
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
  return apiRequest<ModerationQueueItem[]>(`/api/products/moderation/queue${query}`);
}

export async function listModerationHistory(search = ""): Promise<ModerationHistoryEntry[]> {
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
  return apiRequest<ModerationHistoryEntry[]>(`/api/products/moderation/history${query}`);
}

export async function listCustomerInquiries(search = "", status = "all"): Promise<CustomerInquiry[]> {
  const searchParams = new URLSearchParams();
  if (search.trim()) searchParams.set("q", search.trim());
  if (status !== "all") searchParams.set("status", status);
  const query = searchParams.toString();
  return apiRequest<CustomerInquiry[]>(`/api/customer-care/inquiries${query ? `?${query}` : ""}`);
}

export async function updateCustomerInquiry(
  inquiryId: string,
  payload: {
    status: "pending" | "in_review" | "resolved" | "spam";
    moderationNote?: string;
  }
): Promise<CustomerInquiry> {
  return apiRequest<CustomerInquiry>(`/api/customer-care/inquiries/${inquiryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

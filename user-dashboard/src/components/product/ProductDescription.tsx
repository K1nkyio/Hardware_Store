import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReviewProduct from "./ReviewProduct";
import {
  createProductQuestion,
  getProductQuestions,
  getProductReviews,
  Product,
  ProductQuestion,
  ProductReview,
} from "@/lib/api";

const CustomStar = ({ filled, className }: { filled: boolean; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-3 h-3 ${filled ? "text-foreground" : "text-muted-foreground/30"} ${className}`}
  >
    <path
      fillRule="evenodd"
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
      clipRule="evenodd"
    />
  </svg>
);

type ProductDescriptionProps = {
  product: Product;
};

const ProductDescription = ({ product }: ProductDescriptionProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [isCompatibilityOpen, setIsCompatibilityOpen] = useState(false);
  const [isWarrantyOpen, setIsWarrantyOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [questionForm, setQuestionForm] = useState({
    question: "",
    authorName: "",
    authorEmail: "",
  });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    setReviewsError("");
    getProductReviews(product.id)
      .then((data) => {
        if (active) setReviews(data);
      })
      .catch((err) => {
        if (active) setReviewsError(err instanceof Error ? err.message : "Could not load reviews");
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [product.id]);

  useEffect(() => {
    let active = true;
    setQuestionsLoading(true);
    setQuestionsError("");
    getProductQuestions(product.id)
      .then((data) => {
        if (active) setQuestions(data);
      })
      .catch((err) => {
        if (active) setQuestionsError(err instanceof Error ? err.message : "Could not load questions");
      })
      .finally(() => {
        if (active) setQuestionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [product.id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const specs = useMemo(() => {
    const baseSpecs = [
      { label: "Brand", value: product.brand },
      { label: "Material", value: product.material },
      { label: "Size", value: product.size },
      { label: "Voltage", value: product.voltage },
      { label: "Finish", value: product.finish },
      { label: "Weight (kg)", value: product.weightKg ? product.weightKg.toString() : "" },
      {
        label: "Dimensions (cm)",
        value:
          product.lengthCm && product.widthCm && product.heightCm
            ? `${product.lengthCm} × ${product.widthCm} × ${product.heightCm}`
            : "",
      },
      { label: "Category", value: product.category },
      { label: "SKU", value: product.sku },
    ];
    const dynamicSpecs = Object.entries(product.specs ?? {}).map(([key, value]) => ({
      label: key,
      value: String(value),
    }));
    return [...baseSpecs, ...dynamicSpecs].filter((spec) => spec.value && spec.value !== "");
  }, [product]);

  const handleQuestionSubmit = async () => {
    setQuestionSubmitting(true);
    try {
      const created = await createProductQuestion(product.id, {
        question: questionForm.question.trim(),
        authorName: questionForm.authorName.trim(),
        authorEmail: questionForm.authorEmail.trim() || undefined,
      });
      setQuestions((prev) => [created, ...prev]);
      setQuestionForm({ question: "", authorName: "", authorEmail: "" });
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Unable to submit question");
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const statusLabel = product.status ? product.status.replace(/_/g, " ") : "N/A";

  return (
    <div className="space-y-0 mt-8 border-t border-border">
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Description</span>
          {isDescriptionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isDescriptionOpen && (
          <div className="pb-6 space-y-4">
            <p className="text-sm font-light text-muted-foreground leading-relaxed">
              {product.description || "No description available."}
            </p>
          </div>
        )}
      </div>

      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsSpecsOpen(!isSpecsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Specifications</span>
          {isSpecsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isSpecsOpen && (
          <div className="pb-6 space-y-4">
            {specs.length === 0 ? (
              <p className="text-sm font-light text-muted-foreground">Specifications are not available yet.</p>
            ) : (
              <div className="space-y-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-6">
                    <span className="text-sm font-light text-muted-foreground">{spec.label}</span>
                    <span className="text-sm font-light text-foreground">{spec.value}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-6">
                  <span className="text-sm font-light text-muted-foreground">Status</span>
                  <span className="text-sm font-light text-foreground">{statusLabel}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-sm font-light text-muted-foreground">Stock</span>
                  <span className="text-sm font-light text-foreground">
                    {product.stock > 0 ? `${product.stock} units` : "Out of stock"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsCompatibilityOpen(!isCompatibilityOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Compatibility</span>
          {isCompatibilityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isCompatibilityOpen && (
          <div className="pb-6 space-y-4">
            <p className="text-sm font-light text-muted-foreground leading-relaxed">
              {product.compatibility || "Compatibility details are not available yet."}
            </p>
          </div>
        )}
      </div>

      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsWarrantyOpen(!isWarrantyOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Warranty & Safety</span>
          {isWarrantyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isWarrantyOpen && (
          <div className="pb-6 space-y-4">
            <div>
              <h4 className="text-sm font-light text-foreground mb-2">Warranty</h4>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                {product.warranty || "Warranty information is not provided for this item."}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-light text-foreground mb-2">Safety</h4>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                {product.safetyInfo || "Safety guidance is not provided for this item."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsReviewsOpen(!isReviewsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <div className="flex items-center gap-3">
            <span>Customer Reviews</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <CustomStar key={star} filled={star <= Math.round(averageRating)} />
              ))}
              <span className="text-sm font-light text-muted-foreground ml-1">
                {averageRating.toFixed(1)}
              </span>
            </div>
          </div>
          {isReviewsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isReviewsOpen && (
          <div className="pb-6 space-y-6">
            <ReviewProduct
              productId={product.id}
              onReviewAdded={(review) => setReviews((prev) => [review, ...prev])}
            />

            {reviewsLoading ? (
              <p className="text-sm font-light text-muted-foreground">Loading reviews…</p>
            ) : reviewsError ? (
              <p className="text-sm font-light text-rose-600">{reviewsError}</p>
            ) : reviews.length === 0 ? (
              <div className="text-sm font-light text-muted-foreground">
                No verified reviews yet. Be the first to review this product.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-border p-4 rounded-none space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-light text-foreground">{review.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {review.verified && (
                        <span className="text-xs uppercase tracking-wide text-emerald-600">Verified buyer</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <CustomStar key={star} filled={star <= review.rating} />
                      ))}
                    </div>
                    {review.title && (
                      <p className="text-sm font-medium text-foreground">{review.title}</p>
                    )}
                    <p className="text-sm font-light text-muted-foreground">{review.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-border lg:mb-16">
        <Button
          variant="ghost"
          onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Questions & Answers</span>
          {isQuestionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isQuestionsOpen && (
          <div className="pb-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-light text-foreground">Ask a question</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  value={questionForm.authorName}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, authorName: e.target.value }))}
                  placeholder="Your name"
                  className="rounded-none font-light"
                />
                <Input
                  value={questionForm.authorEmail}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, authorEmail: e.target.value }))}
                  placeholder="Email (optional)"
                  className="rounded-none font-light"
                />
              </div>
              <Textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="Ask about fit, compatibility, or installation..."
                className="min-h-24 resize-none rounded-none font-light"
              />
              <Button
                onClick={handleQuestionSubmit}
                disabled={
                  questionSubmitting ||
                  questionForm.authorName.trim() === "" ||
                  questionForm.question.trim().length < 10
                }
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none"
              >
                {questionSubmitting ? "Submitting..." : "Submit question"}
              </Button>
            </div>

            {questionsLoading ? (
              <p className="text-sm font-light text-muted-foreground">Loading questions…</p>
            ) : questionsError ? (
              <p className="text-sm font-light text-rose-600">{questionsError}</p>
            ) : questions.length === 0 ? (
              <p className="text-sm font-light text-muted-foreground">
                No questions yet. Ask the first one and we will respond soon.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((item) => (
                  <div key={item.id} className="border border-border p-4 rounded-none space-y-2">
                    <div>
                      <p className="text-sm font-light text-foreground">{item.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-light text-foreground">Q: {item.question}</p>
                    {item.answer ? (
                      <p className="text-sm font-light text-muted-foreground">A: {item.answer}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Awaiting answer from our team.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;

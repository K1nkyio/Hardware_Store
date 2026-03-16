import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CustomerInquiry,
  listModerationHistory,
  listModerationQueue,
  listCustomerInquiries,
  ModerationQueueItem,
  updateQuestionAnswer,
  updateCustomerInquiry,
  updateReviewVerification,
} from "@/lib/feedback";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const answerTemplates: Array<{ key: string; label: string; text: string }> = [
  { key: "answer_specs", label: "Share specs", text: "This item is compatible with standard fittings listed in the specs section." },
  { key: "answer_availability", label: "Availability response", text: "This product is in stock and can be dispatched within our standard lead time." },
  { key: "answer_followup", label: "Need details", text: "Please share the exact model and size so we can confirm fitment accurately." },
];

const reviewTemplates: Array<{ key: string; label: string; note: string }> = [
  { key: "review_verified", label: "Approve verified", note: "Approved after verification checks." },
  { key: "review_unverified", label: "Mark pending", note: "Pending additional verification details." },
];

const AdminFeedback = () => {
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [inquirySearch, setInquirySearch] = useState("");
  const [inquiryStatus, setInquiryStatus] = useState("all");
  const [selectedQuestion, setSelectedQuestion] = useState<ModerationQueueItem | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [selectedAnswerTemplate, setSelectedAnswerTemplate] = useState(answerTemplates[0].key);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queueQuery = useQuery({
    queryKey: ["moderation-queue", search],
    queryFn: () => listModerationQueue(search),
  });

  const historyQuery = useQuery({
    queryKey: ["moderation-history", historySearch],
    queryFn: () => listModerationHistory(historySearch),
  });

  const inquiriesQuery = useQuery({
    queryKey: ["customer-inquiries", inquirySearch, inquiryStatus],
    queryFn: () => listCustomerInquiries(inquirySearch, inquiryStatus),
  });

  const verifyReviewMutation = useMutation({
    mutationFn: ({
      reviewId,
      verified,
      templateKey,
      note,
    }: {
      reviewId: string;
      verified: boolean;
      templateKey?: string;
      note?: string;
    }) => updateReviewVerification(reviewId, verified, { templateKey, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      await queryClient.invalidateQueries({ queryKey: ["moderation-history"] });
      toast({ title: "Review moderation updated" });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["moderation-history"] });
      toast({
        title: "Could not update review",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const answerQuestionMutation = useMutation({
    mutationFn: ({
      questionId,
      answer,
      templateKey,
      note,
    }: {
      questionId: string;
      answer: string;
      templateKey?: string;
      note?: string;
    }) => updateQuestionAnswer(questionId, answer, { templateKey, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      await queryClient.invalidateQueries({ queryKey: ["moderation-history"] });
      setSelectedQuestion(null);
      setAnswerDraft("");
      toast({ title: "Answer saved" });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["moderation-history"] });
      toast({
        title: "Could not save answer",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateInquiryMutation = useMutation({
    mutationFn: ({
      inquiryId,
      status,
      moderationNote,
    }: {
      inquiryId: string;
      status: "pending" | "in_review" | "resolved" | "spam";
      moderationNote?: string;
    }) => updateCustomerInquiry(inquiryId, { status, moderationNote }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customer-inquiries"] });
      toast({ title: "Inquiry moderation updated" });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ["customer-inquiries"] });
      toast({
        title: "Could not update inquiry",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const queueItems = queueQuery.data ?? [];
  const pendingCount = useMemo(
    () => queueItems.filter((item) => item.moderationState === "pending").length,
    [queueItems]
  );
  const inquiryPendingCount = useMemo(
    () => (inquiriesQuery.data ?? []).filter((inquiry) => inquiry.status === "pending").length,
    [inquiriesQuery.data]
  );

  const applyAnswerTemplate = (templateKey: string) => {
    setSelectedAnswerTemplate(templateKey);
    const template = answerTemplates.find((entry) => entry.key === templateKey);
    if (template) setAnswerDraft(template.text);
  };

  const handleOpenAnswerDialog = (item: ModerationQueueItem) => {
    setSelectedQuestion(item);
    setSelectedAnswerTemplate(answerTemplates[0].key);
    setAnswerDraft(item.answer || answerTemplates[0].text);
  };

  const handleApproveReview = (item: ModerationQueueItem, verified: boolean) => {
    const template = verified ? reviewTemplates[0] : reviewTemplates[1];
    verifyReviewMutation.mutate({
      reviewId: item.id,
      verified,
      templateKey: template.key,
      note: template.note,
    });
  };

  const handleInquiryStatusChange = (inquiry: CustomerInquiry, status: "pending" | "in_review" | "resolved" | "spam") => {
    updateInquiryMutation.mutate({
      inquiryId: inquiry.id,
      status,
      moderationNote: `Status changed to ${status.replace("_", " ")}`,
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-light text-foreground sm:text-2xl">Feedback Moderation Queue</h1>
          <p className="text-sm font-light text-muted-foreground">
            Unified queue for reviews and questions with moderation templates.
          </p>
        </div>
        <div className="border border-border px-3 py-2 text-xs font-light text-muted-foreground">
          Pending items: <span className="text-foreground">{pendingCount}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search queue by product, SKU, customer, or message..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-none pl-9 font-light"
        />
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-light">Type</TableHead>
                  <TableHead className="text-xs font-light">Product</TableHead>
                  <TableHead className="text-xs font-light">Customer</TableHead>
                  <TableHead className="text-xs font-light">Message</TableHead>
                  <TableHead className="text-xs font-light">State</TableHead>
                  <TableHead className="text-xs font-light">Date</TableHead>
                  <TableHead className="text-right text-xs font-light">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueQuery.isPending ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-muted-foreground">
                      Loading moderation queue...
                    </TableCell>
                  </TableRow>
                ) : queueQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-destructive">
                      Could not load moderation queue.
                    </TableCell>
                  </TableRow>
                ) : queueItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-muted-foreground">
                      Queue is empty.
                    </TableCell>
                  </TableRow>
                ) : (
                  queueItems.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell className="text-sm font-light capitalize">{item.type}</TableCell>
                      <TableCell className="text-sm font-light">
                        <div>
                          <p>{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.productSku || "No SKU"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-light">{item.authorName}</TableCell>
                      <TableCell className="max-w-[360px] text-sm font-light text-muted-foreground">
                        {item.message}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-light ${
                            item.moderationState === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : item.moderationState === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.moderationState === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.moderationState}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-light text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.type === "review" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-none text-xs font-light"
                              disabled={
                                verifyReviewMutation.isPending || item.moderationState !== "pending"
                              }
                              onClick={() => handleApproveReview(item, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-none text-xs font-light"
                              disabled={
                                verifyReviewMutation.isPending || item.moderationState !== "pending"
                              }
                              onClick={() => handleApproveReview(item, false)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-none text-xs font-light"
                            onClick={() => handleOpenAnswerDialog(item)}
                          >
                            {item.answer ? "Edit Answer" : "Answer"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-light uppercase tracking-[0.18em] text-muted-foreground">
            Customer Care Inquiries
          </h2>
          <div className="border border-border px-3 py-2 text-xs font-light text-muted-foreground">
            Pending inquiries: <span className="text-foreground">{inquiryPendingCount}</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inquiries by name, email, order, or message..."
              value={inquirySearch}
              onChange={(event) => setInquirySearch(event.target.value)}
              className="rounded-none pl-9 font-light"
            />
          </div>
          <Select value={inquiryStatus} onValueChange={setInquiryStatus}>
            <SelectTrigger className="rounded-none font-light">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card className="border border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-light">Customer</TableHead>
                    <TableHead className="text-xs font-light">Email</TableHead>
                    <TableHead className="text-xs font-light">Order #</TableHead>
                    <TableHead className="text-xs font-light">Message</TableHead>
                    <TableHead className="text-xs font-light">Status</TableHead>
                    <TableHead className="text-xs font-light">Submitted</TableHead>
                    <TableHead className="text-right text-xs font-light">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiriesQuery.isPending ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-muted-foreground">
                        Loading customer inquiries...
                      </TableCell>
                    </TableRow>
                  ) : inquiriesQuery.isError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-destructive">
                        Could not load customer inquiries.
                      </TableCell>
                    </TableRow>
                  ) : (inquiriesQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-muted-foreground">
                        No customer inquiries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (inquiriesQuery.data ?? []).map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="text-sm font-light">
                          {inquiry.firstName} {inquiry.lastName}
                        </TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">{inquiry.email}</TableCell>
                        <TableCell className="text-sm font-light">{inquiry.orderNumber || "-"}</TableCell>
                        <TableCell className="max-w-[360px] text-sm font-light text-muted-foreground">
                          {inquiry.message}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-light ${
                              inquiry.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : inquiry.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : inquiry.status === "spam"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {inquiry.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">
                          {new Date(inquiry.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-none text-xs font-light"
                              disabled={updateInquiryMutation.isPending}
                              onClick={() => handleInquiryStatusChange(inquiry, "in_review")}
                            >
                              In Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-none text-xs font-light"
                              disabled={updateInquiryMutation.isPending}
                              onClick={() => handleInquiryStatusChange(inquiry, "resolved")}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-none text-xs font-light"
                              disabled={updateInquiryMutation.isPending}
                              onClick={() => handleInquiryStatusChange(inquiry, "spam")}
                            >
                              Spam
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-light uppercase tracking-[0.18em] text-muted-foreground">
          Moderation History
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search history by action, template, or notes..."
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            className="rounded-none pl-9 font-light"
          />
        </div>
        <Card className="border border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-light">Entity</TableHead>
                    <TableHead className="text-xs font-light">Action</TableHead>
                    <TableHead className="text-xs font-light">Template</TableHead>
                    <TableHead className="text-xs font-light">Note</TableHead>
                    <TableHead className="text-xs font-light">Role</TableHead>
                    <TableHead className="text-xs font-light">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyQuery.isPending ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm font-light text-muted-foreground">
                        Loading moderation history...
                      </TableCell>
                    </TableRow>
                  ) : (historyQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm font-light text-muted-foreground">
                        No moderation history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (historyQuery.data ?? []).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm font-light">
                          {entry.entityType} - {entry.entityId.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm font-light">{entry.action}</TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">
                          {entry.templateKey || "-"}
                        </TableCell>
                        <TableCell className="max-w-[260px] text-sm font-light text-muted-foreground">
                          {entry.note || "-"}
                        </TableCell>
                        <TableCell className="text-sm font-light">{entry.actorRole}</TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedQuestion)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuestion(null);
            setAnswerDraft("");
          }
        }}
      >
        <DialogContent className="!rounded-none">
          <DialogHeader>
            <DialogTitle className="font-light text-xl">Answer Customer Question</DialogTitle>
            <DialogDescription className="font-light text-sm text-muted-foreground">
              Use a response template or write a custom answer.
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm font-light">
                <p className="text-muted-foreground">Product</p>
                <p className="text-foreground">{selectedQuestion.productName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-light text-muted-foreground">Question</p>
                <p className="text-sm font-light text-foreground">{selectedQuestion.message}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-light text-muted-foreground">Template</p>
                <Select value={selectedAnswerTemplate} onValueChange={applyAnswerTemplate}>
                  <SelectTrigger className="rounded-none font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {answerTemplates.map((template) => (
                      <SelectItem key={template.key} value={template.key}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-light text-muted-foreground">Answer</p>
                <Textarea
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  className="min-h-28 rounded-none font-light"
                  placeholder="Write your answer here..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-none font-light"
              onClick={() => {
                setSelectedQuestion(null);
                setAnswerDraft("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none bg-foreground font-light text-background hover:bg-foreground/90"
              disabled={!selectedQuestion || answerQuestionMutation.isPending}
              onClick={() => {
                if (!selectedQuestion) return;
                answerQuestionMutation.mutate({
                  questionId: selectedQuestion.id,
                  answer: answerDraft,
                  templateKey: selectedAnswerTemplate,
                  note: `Template: ${selectedAnswerTemplate}`,
                });
              }}
            >
              {answerQuestionMutation.isPending ? "Saving..." : "Save Answer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedback;

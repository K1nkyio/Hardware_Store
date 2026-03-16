import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
export const paymentsRouter = Router();
const CheckoutMethodSchema = z.enum(["card", "mpesa"]);
const InitializePaymentSchema = z.object({
    method: CheckoutMethodSchema,
    amountCents: z.number().int().positive(),
    currency: z.string().trim().min(3).max(3),
    customer: z.object({
        email: z.string().email(),
        fullName: z.string().trim().min(1).max(160),
        phone: z.string().trim().optional(),
    }),
    metadata: z.record(z.any()).optional(),
});
const VerifyPaymentSchema = z.object({
    method: CheckoutMethodSchema,
    txRef: z.string().trim().min(1),
    transactionId: z.string().trim().min(1),
    expectedAmountCents: z.number().int().positive(),
    expectedCurrency: z.string().trim().min(3).max(3),
});
const MPESA_VERIFY_MIN_INTERVAL_MS = 15_000;
const mpesaVerifyCache = new Map();
const mpesaCallbackStore = new Map();
function splitName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? "Customer";
    const lastName = parts.slice(1).join(" ") || "Customer";
    return { firstName, lastName };
}
function normalizeMpesaPhone(raw) {
    const digits = raw.replace(/[^\d+]/g, "").trim();
    if (digits.startsWith("+")) {
        const value = digits.slice(1);
        if (value.startsWith("254") && value.length === 12)
            return value;
    }
    if (digits.startsWith("254") && digits.length === 12)
        return digits;
    if (digits.startsWith("0") && digits.length === 10)
        return `254${digits.slice(1)}`;
    throw new Error("Invalid M-Pesa phone number. Use format +2547XXXXXXXX or 07XXXXXXXX.");
}
function darajaTimestamp() {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const min = String(now.getUTCMinutes()).padStart(2, "0");
    const ss = String(now.getUTCSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}
function requireDarajaConfig() {
    if (!config.darajaConsumerKey || !config.darajaConsumerSecret || !config.darajaShortCode || !config.darajaPassKey) {
        return false;
    }
    return true;
}
function requirePesapalConfig() {
    if (!config.pesapalConsumerKey || !config.pesapalConsumerSecret || !config.pesapalNotificationId) {
        return false;
    }
    return true;
}
function isPublicHttpsUrl(value) {
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:")
            return false;
        const host = parsed.hostname.toLowerCase();
        if (host === "localhost" || host === "127.0.0.1")
            return false;
        if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host))
            return false;
        if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host))
            return false;
        const match172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
        if (match172) {
            const secondOctet = Number(match172[1]);
            if (secondOctet >= 16 && secondOctet <= 31)
                return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
async function readApiBody(response) {
    const text = await response.text();
    if (!text)
        return { data: {}, text: "" };
    try {
        return { data: JSON.parse(text), text };
    }
    catch {
        return { data: {}, text };
    }
}
function normalizeProviderError(err, fallback) {
    if (err instanceof Error && err.message.trim().length > 0)
        return err.message.trim();
    return fallback;
}
function looksLikeHtml(text) {
    const trimmed = text.trim().toLowerCase();
    return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}
function buildMpesaVerifyPayload(params) {
    return {
        verified: params.verified,
        provider: "daraja",
        method: "mpesa",
        transactionId: params.transactionId,
        txRef: params.txRef,
        status: params.verified ? "successful" : "pending",
        amountCents: params.amountCents,
        currency: params.currency,
        paymentType: "mpesa",
        processorResponse: params.processorResponse,
        customerEmail: "",
    };
}
async function getDarajaAccessToken() {
    try {
        const credentials = Buffer.from(`${config.darajaConsumerKey}:${config.darajaConsumerSecret}`).toString("base64");
        const response = await fetch(`${config.darajaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });
        const { data, text } = await readApiBody(response);
        const payload = data;
        if (!response.ok || !payload.access_token) {
            throw new Error(payload.errorMessage || payload.error_description || text || "Unable to get Daraja access token.");
        }
        return payload.access_token;
    }
    catch (err) {
        throw new Error(normalizeProviderError(err, "Unable to reach Daraja auth service."));
    }
}
async function getPesapalToken() {
    try {
        const response = await fetch(`${config.pesapalBaseUrl}/api/Auth/RequestToken`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                consumer_key: config.pesapalConsumerKey,
                consumer_secret: config.pesapalConsumerSecret,
            }),
        });
        const { data, text } = await readApiBody(response);
        const payload = data;
        if (!response.ok || !payload.token) {
            throw new Error(payload.message || text || "Unable to get Pesapal auth token.");
        }
        return payload.token;
    }
    catch (err) {
        throw new Error(normalizeProviderError(err, "Unable to reach Pesapal auth service."));
    }
}
paymentsRouter.post("/initialize", async (req, res, next) => {
    try {
        const body = InitializePaymentSchema.parse(req.body);
        const txRef = `RAPH-${body.method.toUpperCase()}-${Date.now()}-${randomUUID().slice(0, 8)}`;
        if (body.method === "mpesa") {
            if (!requireDarajaConfig()) {
                return res.status(503).json({ message: "Daraja is not configured. Set DARAJA_* env values." });
            }
            if (!isPublicHttpsUrl(config.darajaCallbackUrl)) {
                return res.status(503).json({
                    message: "Daraja callback URL must be a public HTTPS URL (use ngrok/cloud tunnel in development).",
                });
            }
            const token = await getDarajaAccessToken();
            const timestamp = darajaTimestamp();
            const password = Buffer.from(`${config.darajaShortCode}${config.darajaPassKey}${timestamp}`).toString("base64");
            const phone = normalizeMpesaPhone(body.customer.phone ?? "");
            const amount = Math.max(1, Math.round(body.amountCents / 100));
            const response = await fetch(`${config.darajaBaseUrl}/mpesa/stkpush/v1/processrequest`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    BusinessShortCode: config.darajaShortCode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phone,
                    PartyB: config.darajaShortCode,
                    PhoneNumber: phone,
                    CallBackURL: config.darajaCallbackUrl,
                    AccountReference: txRef,
                    TransactionDesc: "RAPH checkout payment",
                }),
            });
            const { data, text } = await readApiBody(response);
            const payload = data;
            if (!response.ok || payload.ResponseCode !== "0" || !payload.CheckoutRequestID) {
                return res.status(502).json({
                    message: payload.errorMessage ||
                        payload.ResponseDescription ||
                        text ||
                        "Failed to initiate M-Pesa STK push.",
                });
            }
            return res.json({
                provider: "daraja",
                method: "mpesa",
                txRef,
                transactionId: payload.CheckoutRequestID,
                checkoutUrl: "",
                pending: true,
                message: payload.CustomerMessage || payload.ResponseDescription || "STK push sent.",
            });
        }
        if (!requirePesapalConfig()) {
            return res.status(503).json({ message: "Pesapal is not configured. Set PESAPAL_* env values." });
        }
        const token = await getPesapalToken();
        const names = splitName(body.customer.fullName);
        const response = await fetch(`${config.pesapalBaseUrl}/api/Transactions/SubmitOrderRequest`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: txRef,
                currency: body.currency.toUpperCase(),
                amount: Number((body.amountCents / 100).toFixed(2)),
                description: "RAPH checkout payment",
                callback_url: config.pesapalCallbackUrl,
                notification_id: config.pesapalNotificationId,
                billing_address: {
                    email_address: body.customer.email,
                    phone_number: body.customer.phone ?? "",
                    country_code: "KE",
                    first_name: names.firstName,
                    last_name: names.lastName,
                    line_1: "Online order",
                },
            }),
        });
        const { data, text } = await readApiBody(response);
        const payload = data;
        if (!response.ok || !payload.redirect_url || !payload.order_tracking_id) {
            return res.status(502).json({
                message: payload.message || payload.error?.message || text || "Failed to initialize card payment.",
            });
        }
        return res.json({
            provider: "pesapal",
            method: "card",
            txRef: payload.merchant_reference || txRef,
            transactionId: payload.order_tracking_id,
            checkoutUrl: payload.redirect_url,
            pending: true,
            message: "Redirecting to secure card payment.",
        });
    }
    catch (err) {
        if (err && typeof err === "object" && "name" in err && String(err.name) === "ZodError") {
            return res.status(400).json({ message: "Invalid payment request payload." });
        }
        const message = normalizeProviderError(err, "Failed to initialize payment.");
        return res.status(502).json({ message });
    }
});
paymentsRouter.post("/verify", async (req, res, next) => {
    try {
        const body = VerifyPaymentSchema.parse(req.body);
        const expectedCurrency = body.expectedCurrency.toUpperCase();
        if (body.method === "mpesa") {
            if (!requireDarajaConfig()) {
                return res.status(503).json({ message: "Daraja is not configured. Set DARAJA_* env values." });
            }
            const callbackRecord = mpesaCallbackStore.get(body.transactionId);
            if (callbackRecord) {
                const callbackVerified = callbackRecord.resultCode === "0";
                const callbackPayload = buildMpesaVerifyPayload({
                    verified: callbackVerified,
                    transactionId: body.transactionId,
                    txRef: body.txRef,
                    amountCents: callbackRecord.amountCents ?? body.expectedAmountCents,
                    currency: expectedCurrency,
                    processorResponse: callbackRecord.resultDesc || "M-Pesa callback received.",
                });
                mpesaVerifyCache.set(body.transactionId, { checkedAt: Date.now(), payload: callbackPayload });
                return res.json(callbackPayload);
            }
            const cached = mpesaVerifyCache.get(body.transactionId);
            const now = Date.now();
            if (cached && now - cached.checkedAt < MPESA_VERIFY_MIN_INTERVAL_MS) {
                return res.json(cached.payload);
            }
            const token = await getDarajaAccessToken();
            const timestamp = darajaTimestamp();
            const password = Buffer.from(`${config.darajaShortCode}${config.darajaPassKey}${timestamp}`).toString("base64");
            const response = await fetch(`${config.darajaBaseUrl}/mpesa/stkpushquery/v1/query`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    BusinessShortCode: config.darajaShortCode,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID: body.transactionId,
                }),
            });
            const { data, text } = await readApiBody(response);
            const payload = data;
            if (!response.ok) {
                const details = payload.errorMessage || payload.ResultDesc || text || "Failed to query M-Pesa transaction status.";
                if (/SpikeArrestViolation|rate\s*limit|too\s*many/i.test(details) || looksLikeHtml(details) || /incapsula/i.test(details)) {
                    const pendingPayload = buildMpesaVerifyPayload({
                        verified: false,
                        transactionId: body.transactionId,
                        txRef: body.txRef,
                        amountCents: body.expectedAmountCents,
                        currency: expectedCurrency,
                        processorResponse: "M-Pesa verification is temporarily delayed. Please retry after a short wait.",
                    });
                    mpesaVerifyCache.set(body.transactionId, { checkedAt: now, payload: pendingPayload });
                    return res.json(pendingPayload);
                }
                return res.status(502).json({ message: details });
            }
            const successful = payload.ResultCode === "0";
            const verifyPayload = buildMpesaVerifyPayload({
                verified: successful,
                transactionId: body.transactionId,
                txRef: body.txRef,
                amountCents: body.expectedAmountCents,
                currency: expectedCurrency,
                processorResponse: payload.ResultDesc ?? "",
            });
            mpesaVerifyCache.set(body.transactionId, { checkedAt: now, payload: verifyPayload });
            return res.json(verifyPayload);
        }
        if (!requirePesapalConfig()) {
            return res.status(503).json({ message: "Pesapal is not configured. Set PESAPAL_* env values." });
        }
        const token = await getPesapalToken();
        const queryUrl = `${config.pesapalBaseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(body.transactionId)}`;
        const response = await fetch(queryUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const { data, text } = await readApiBody(response);
        const payload = data;
        if (!response.ok) {
            return res.status(502).json({ message: payload.message || text || "Failed to query card transaction status." });
        }
        const status = String(payload.payment_status ?? "").toLowerCase();
        const paidAmountCents = Math.round(Number(payload.amount ?? 0) * 100);
        const paidCurrency = String(payload.currency ?? "").toUpperCase();
        const reference = String(payload.merchant_reference ?? body.txRef);
        const verified = (status === "completed" || status === "paid" || status === "successful") &&
            reference === body.txRef &&
            paidAmountCents === body.expectedAmountCents &&
            paidCurrency === expectedCurrency;
        return res.json({
            verified,
            provider: "pesapal",
            method: "card",
            transactionId: body.transactionId,
            txRef: reference,
            status,
            amountCents: paidAmountCents || body.expectedAmountCents,
            currency: paidCurrency || expectedCurrency,
            paymentType: String(payload.payment_method ?? "card"),
            processorResponse: String(payload.confirmation_code ?? ""),
            customerEmail: "",
        });
    }
    catch (err) {
        if (err && typeof err === "object" && "name" in err && String(err.name) === "ZodError") {
            return res.status(400).json({ message: "Invalid payment verification payload." });
        }
        const message = normalizeProviderError(err, "Failed to verify payment.");
        return res.status(502).json({ message });
    }
});
function handleDarajaCallback(req, res) {
    const callback = (req.body ?? {});
    const stk = callback.Body?.stkCallback;
    if (stk?.CheckoutRequestID) {
        let amountCents;
        let receipt;
        let phoneNumber;
        for (const item of stk.CallbackMetadata?.Item ?? []) {
            if (!item?.Name)
                continue;
            if (item.Name === "Amount" && typeof item.Value === "number") {
                amountCents = Math.round(item.Value * 100);
            }
            if (item.Name === "MpesaReceiptNumber" && typeof item.Value === "string") {
                receipt = item.Value;
            }
            if (item.Name === "PhoneNumber" && typeof item.Value === "number") {
                phoneNumber = String(item.Value);
            }
        }
        mpesaCallbackStore.set(stk.CheckoutRequestID, {
            checkedAt: Date.now(),
            resultCode: String(stk.ResultCode ?? ""),
            resultDesc: stk.ResultDesc ?? "",
            amountCents,
            receipt,
            phoneNumber,
        });
    }
    return res.status(200).json({ ok: true });
}
paymentsRouter.post("/daraja/callback", (req, res) => handleDarajaCallback(req, res));
// Backward-compatible callback path for previously configured integrations.
paymentsRouter.post("/mpesa/callback", (req, res) => {
    return handleDarajaCallback(req, res);
});

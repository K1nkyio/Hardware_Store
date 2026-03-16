import * as crypto from "node:crypto";
import { createRequire } from "node:module";
const { createHmac, randomBytes, scryptSync, timingSafeEqual } = crypto;
const DERIVED_KEY_BYTES = 64;
const require = createRequire(import.meta.url);
let bcrypt = null;
try {
    bcrypt = require("bcryptjs");
}
catch {
    bcrypt = null;
}
function encodeBase64Url(input) {
    const buffer = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function decodeBase64Url(input) {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return Buffer.from(padded, "base64");
}
export function signToken(payload, secret, expiresInSeconds) {
    const header = {
        alg: "HS256",
        typ: "JWT",
    };
    const now = Math.floor(Date.now() / 1000);
    const body = {
        ...payload,
        iat: now,
        exp: now + Math.max(1, expiresInSeconds),
    };
    const encodedHeader = encodeBase64Url(JSON.stringify(header));
    const encodedBody = encodeBase64Url(JSON.stringify(body));
    const signature = createHmac("sha256", secret).update(`${encodedHeader}.${encodedBody}`).digest();
    const encodedSignature = encodeBase64Url(signature);
    return `${encodedHeader}.${encodedBody}.${encodedSignature}`;
}
export function verifyToken(token, secret) {
    const segments = token.split(".");
    if (segments.length !== 3)
        return null;
    const [encodedHeader, encodedBody, encodedSignature] = segments;
    if (!encodedHeader || !encodedBody || !encodedSignature)
        return null;
    const expectedSignature = createHmac("sha256", secret).update(`${encodedHeader}.${encodedBody}`).digest();
    let receivedSignature;
    try {
        receivedSignature = decodeBase64Url(encodedSignature);
    }
    catch {
        return null;
    }
    if (receivedSignature.byteLength !== expectedSignature.byteLength ||
        !timingSafeEqual(receivedSignature, expectedSignature)) {
        return null;
    }
    try {
        const payload = JSON.parse(decodeBase64Url(encodedBody).toString("utf-8"));
        const now = Math.floor(Date.now() / 1000);
        const exp = Number(payload.exp ?? 0);
        if (!Number.isFinite(exp) || exp <= now)
            return null;
        const nbf = payload.nbf !== undefined ? Number(payload.nbf) : null;
        if (nbf !== null && (!Number.isFinite(nbf) || nbf > now))
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
export async function hashPassword(password, workFactor = 12) {
    const rounds = Number.isFinite(workFactor) ? Math.min(14, Math.max(10, Math.floor(workFactor))) : 12;
    if (bcrypt) {
        return bcrypt.hash(password, rounds);
    }
    const N = 2 ** rounds;
    const r = 8;
    const p = 1;
    const maxmem = 128 * N * r;
    const salt = randomBytes(16).toString("hex");
    const derived = scryptSync(password, salt, DERIVED_KEY_BYTES, { N, r, p, maxmem });
    return `scrypt$${N}$${r}$${p}$${salt}$${derived.toString("hex")}`;
}
export async function verifyPassword(password, encodedHash) {
    if (encodedHash.startsWith("$2") && bcrypt) {
        return bcrypt.compare(password, encodedHash);
    }
    const [scheme, nRaw, rRaw, pRaw, salt, hashHex] = encodedHash.split("$");
    if (scheme !== "scrypt" || !nRaw || !rRaw || !pRaw || !salt || !hashHex)
        return false;
    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    if (![N, r, p].every((v) => Number.isFinite(v) && v > 0))
        return false;
    const expectedHash = Buffer.from(hashHex, "hex");
    const maxmem = 128 * N * r;
    const derived = scryptSync(password, salt, expectedHash.byteLength, { N, r, p, maxmem });
    if (derived.byteLength !== expectedHash.byteLength)
        return false;
    return timingSafeEqual(derived, expectedHash);
}

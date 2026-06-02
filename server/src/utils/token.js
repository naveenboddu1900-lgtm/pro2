import { createHmac, timingSafeEqual } from "crypto";

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createToken(payload, secret, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const body = base64UrlEncode({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  });
  const unsignedToken = `${header}.${body}`;

  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
}

export function verifyToken(token, secret) {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    throw new Error("Malformed token");
  }

  const unsignedToken = `${header}.${body}`;
  const expectedSignature = sign(unsignedToken, secret);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new Error("Invalid token signature");
  }

  const payload = base64UrlDecode(body);

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Expired token");
  }

  return payload;
}

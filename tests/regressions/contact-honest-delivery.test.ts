import { createServer } from "node:net";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderPage } from "./helpers/render";
import { PUBLISHER } from "@/lib/constants/publisher";
import { POST as contactPost } from "@/app/api/contact/route";
import { POST as feedbackPost } from "@/app/api/feedback/route";
import ContactPage, { metadata } from "@/app/contact/page";
import { interpretContactResponse } from "@/components/shared/contact-form";

const SRC = join(__dirname, "..", "..", "src");
const CONTACT_BODY = { name: "Jane Doe", email: "jane@example.com", message: "A correction about a figure." };
const FEEDBACK_BODY = { type: "bug", message: "The calculator is not working on mobile.", email: "jane@example.com" };

let ipSeq = 0;
function post(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `198.51.100.${(ipSeq += 1)}` },
    body: JSON.stringify(body),
  });
}

function closedLocalPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

const routes = [
  ["/api/contact", contactPost, CONTACT_BODY],
  ["/api/feedback", feedbackPost, FEEDBACK_BODY],
] as const;

describe.each(routes)("K5/K10: %s reports success only when the collector accepted the message", (path, handler, body) => {
  const originalEndpoint = process.env.FEEDBACK_ENDPOINT;
  const mockFetch = vi.fn();

  beforeEach(() => {
    delete process.env.FEEDBACK_ENDPOINT;
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalEndpoint === undefined) delete process.env.FEEDBACK_ENDPOINT;
    else process.env.FEEDBACK_ENDPOINT = originalEndpoint;
  });

  it("returns 503 with the publisher mailbox when no collector is configured", async () => {
    const res = await handler(post(path, body));
    const data = (await res.json()) as { ok: boolean; error?: string };
    expect(res.status).toBe(503);
    expect(data.ok).toBe(false);
    expect(data.error).toContain(PUBLISHER.email);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("treats a blank collector setting as not configured", async () => {
    process.env.FEEDBACK_ENDPOINT = "   ";
    const res = await handler(post(path, body));
    expect(res.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 503 when the collector answers with an error status", async () => {
    process.env.FEEDBACK_ENDPOINT = "http://127.0.0.1:9/collect";
    mockFetch.mockResolvedValue(new Response("boom", { status: 500 }));
    const res = await handler(post(path, body));
    const data = (await res.json()) as { ok: boolean; error?: string };
    expect(res.status).toBe(503);
    expect(data.ok).toBe(false);
    expect(data.error).toContain(PUBLISHER.email);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("returns 503 when the collector request throws", async () => {
    process.env.FEEDBACK_ENDPOINT = "http://127.0.0.1:9/collect";
    mockFetch.mockRejectedValue(new Error("network error"));
    const res = await handler(post(path, body));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(false);
  });

  it("returns 200 ok:true only after the collector answers 2xx, and forwards the record", async () => {
    process.env.FEEDBACK_ENDPOINT = "http://127.0.0.1:9/collect";
    mockFetch.mockResolvedValue(new Response("{}", { status: 200 }));
    const res = await handler(post(path, body));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:9/collect");
    const sent = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sent.message).toBe(body.message);
    expect(sent.email).toBe(body.email);
    expect(typeof sent.receivedAt).toBe("string");
  });

  it("returns 503 against a really closed local port (no mock, nothing leaves the machine)", async () => {
    vi.unstubAllGlobals();
    process.env.FEEDBACK_ENDPOINT = `http://127.0.0.1:${await closedLocalPort()}/collect`;
    const res = await handler(post(path, body));
    expect(res.status).toBe(503);
  });

  it("still rejects an invalid body with 400 before any delivery attempt", async () => {
    process.env.FEEDBACK_ENDPOINT = "http://127.0.0.1:9/collect";
    const res = await handler(post(path, { ...body, message: "" }));
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("K5: the contact route labels its record and carries the sender name", () => {
  it("forwards type contact and the name", async () => {
    const original = process.env.FEEDBACK_ENDPOINT;
    const mockFetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);
    process.env.FEEDBACK_ENDPOINT = "http://127.0.0.1:9/collect";
    try {
      await contactPost(post("/api/contact", CONTACT_BODY));
      const sent = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string) as Record<string, unknown>;
      expect(sent.type).toBe("contact");
      expect(sent.name).toBe(CONTACT_BODY.name);
    } finally {
      vi.unstubAllGlobals();
      if (original === undefined) delete process.env.FEEDBACK_ENDPOINT;
      else process.env.FEEDBACK_ENDPOINT = original;
    }
  });
});

describe("K5: no response-time promise anywhere", () => {
  const PROMISE = /business days?|typically respond|respond within|get back to you within/i;

  it("the contact page text and meta description promise no response time", async () => {
    expect(await renderPage(ContactPage)).not.toMatch(PROMISE);
    expect(String(metadata.description)).not.toMatch(PROMISE);
  });

  it("no source file promises a response time", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => PROMISE.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(SRC.length + 1));
    expect(offenders).toEqual([]);
  });
});

describe("K10: the contact form shows failures and the mailbox fallback", () => {
  it("success only for a 2xx response with ok:true", () => {
    expect(interpretContactResponse(200, { ok: true }).state).toBe("success");
    expect(interpretContactResponse(200, { ok: false }).state).toBe("error");
  });

  it("503 shows the server message and offers the publisher mailbox", () => {
    const result = interpretContactResponse(503, { ok: false, error: "We could not deliver your message right now." });
    expect(result).toMatchObject({ state: "error", offerEmail: true });
    expect(result.message).toContain("could not deliver");
  });

  it("a non-JSON server error still offers the mailbox", () => {
    expect(interpretContactResponse(502, null)).toMatchObject({ state: "error", offerEmail: true });
  });

  it("a validation error shows its own message without the mailbox fallback", () => {
    expect(interpretContactResponse(400, { ok: false, error: "Name is required." })).toMatchObject({
      state: "error",
      message: "Name is required.",
      offerEmail: false,
    });
  });

  it("success copy promises nothing about timing", () => {
    expect(interpretContactResponse(200, { ok: true }).message).not.toMatch(/business|within|typically|days/i);
  });
});

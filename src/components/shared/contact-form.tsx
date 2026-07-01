"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";

type FormState = "idle" | "submitting" | "success" | "error";

const MAX_NAME = 100;
const MAX_MESSAGE = 2000;

/** Pure client-side field validation — mirrors server-side caps. */
export function validateContactFields(
  name: string,
  email: string,
  message: string,
): string | null {
  if (!name.trim()) return "Name is required.";
  if (name.trim().length > MAX_NAME) return `Name must be ${MAX_NAME} characters or fewer.`;
  if (!email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
  if (!message.trim()) return "Message is required.";
  if (message.trim().length > MAX_MESSAGE) return `Message must be ${MAX_MESSAGE} characters or fewer.`;
  return null;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const clientError = validateContactFields(name, email, message);
    if (clientError) {
      setFormState("error");
      setStatusMessage(clientError);
      return;
    }

    setFormState("submitting");
    setStatusMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (res.ok && data.ok) {
        setFormState("success");
        setStatusMessage(
          "Thank you for your message. We typically respond within 1–2 business days.",
        );
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setFormState("error");
        setStatusMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setFormState("error");
      setStatusMessage("A network error occurred. Please check your connection and try again.");
    }
  }

  const inputBase =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-slate-700">
          Name <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          required
          maxLength={MAX_NAME}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={formState === "submitting" || formState === "success"}
          placeholder="Your name"
          className={inputBase}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={formState === "submitting" || formState === "success"}
          placeholder="you@example.com"
          className={inputBase}
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Message <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          maxLength={MAX_MESSAGE}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={formState === "submitting" || formState === "success"}
          placeholder="Your question, correction, or feedback..."
          className={`${inputBase} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-slate-400" aria-live="polite">
          {message.length}/{MAX_MESSAGE}
        </p>
      </div>

      {/* Status region — aria-live for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="min-h-[1.5rem]">
        {formState === "success" && (
          <p role="status" className="rounded-md bg-teal-50 px-4 py-3 text-sm text-teal-800 border border-teal-200">
            {statusMessage}
          </p>
        )}
        {formState === "error" && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {statusMessage}
          </p>
        )}
      </div>

      {/* Submit */}
      {formState !== "success" && (
        <button
          type="submit"
          disabled={formState === "submitting"}
          className={`inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50 ${FOCUS_RING}`}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {formState === "submitting" ? "Sending…" : "Send Message"}
        </button>
      )}
    </form>
  );
}

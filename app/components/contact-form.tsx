"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

type FieldName = "name" | "email" | "organisation" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;
type SubmissionState = "idle" | "sending" | "success" | "error" | "limited";

const contactEndpoint = "/api/contact";

function validate(values: Record<FieldName, string>): FieldErrors {
  const errors: FieldErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.name.trim()) {
    errors.name = "Enter your name.";
  } else if (values.name.trim().length > 100) {
    errors.name = "Keep your name to 100 characters or fewer.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter an email address in the format name@example.com.";
  }

  if (values.organisation.trim().length > 150) {
    errors.organisation = "Keep the organisation name to 150 characters or fewer.";
  }

  if (!values.message.trim()) {
    errors.message = "Describe what you would like to discuss.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Please add a little more detail (at least 10 characters).";
  } else if (values.message.trim().length > 4_000) {
    errors.message = "Keep your message to 4,000 characters or fewer.";
  }

  return errors;
}

function focusElement(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

export function ContactForm({ email }: { email: string }) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [copyStatus, setCopyStatus] = useState("");
  const submissionId = useRef<string | null>(null);

  function handleChange() {
    if (submissionState !== "sending") {
      submissionId.current = null;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionState === "sending") {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values: Record<FieldName, string> = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      organisation: String(formData.get("organisation") ?? ""),
      message: String(formData.get("message") ?? ""),
    };
    const errors = validate(values);

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmissionState("idle");
      focusElement("contact-error-summary");
      return;
    }

    setSubmissionState("sending");
    submissionId.current ??= crypto.randomUUID();

    try {
      const response = await fetch(contactEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          website: String(formData.get("website") ?? ""),
          submissionId: submissionId.current,
        }),
      });

      if (response.status === 202) {
        form.reset();
        submissionId.current = null;
        setFieldErrors({});
        setSubmissionState("success");
        focusElement("contact-submission-status");
        return;
      }

      setSubmissionState(response.status === 429 ? "limited" : "error");
      focusElement("contact-submission-status");
    } catch {
      setSubmissionState("error");
      focusElement("contact-submission-status");
    }
  }

  async function copyEmailAddress() {
    try {
      await navigator.clipboard.writeText(email);
      setCopyStatus("Email address copied.");
    } catch {
      setCopyStatus(
        "The address could not be copied. Select it and copy it manually.",
      );
    }
  }

  const errorEntries = Object.entries(fieldErrors) as [FieldName, string][];

  return (
    <div className="contact-form-panel">
      <div className="contact-form-heading">
        <h3>Send an enquiry</h3>
        <p>Fields marked * are required.</p>
      </div>

      {errorEntries.length > 0 ? (
        <div
          className="contact-error-summary"
          id="contact-error-summary"
          role="alert"
          tabIndex={-1}
        >
          <p>Please check the following:</p>
          <ul>
            {errorEntries.map(([field, error]) => (
              <li key={field}>
                <a href={`#contact-${field}`}>{error}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        action={contactEndpoint}
        method="post"
        noValidate
        aria-busy={submissionState === "sending"}
        onChange={handleChange}
        onSubmit={handleSubmit}
      >
        <div className="contact-form-fields">
          <div className="contact-field">
            <label htmlFor="contact-name">Name *</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
              aria-invalid={fieldErrors.name ? true : undefined}
            />
            {fieldErrors.name ? (
              <p className="contact-field-error" id="contact-name-error">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="contact-field">
            <label htmlFor="contact-email">Email address *</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              required
              aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
              aria-invalid={fieldErrors.email ? true : undefined}
            />
            {fieldErrors.email ? (
              <p className="contact-field-error" id="contact-email-error">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="contact-field contact-field-full">
            <label htmlFor="contact-organisation">Organisation (optional)</label>
            <input
              id="contact-organisation"
              name="organisation"
              type="text"
              autoComplete="organization"
              maxLength={150}
              aria-describedby={
                fieldErrors.organisation
                  ? "contact-organisation-error"
                  : undefined
              }
              aria-invalid={fieldErrors.organisation ? true : undefined}
            />
            {fieldErrors.organisation ? (
              <p className="contact-field-error" id="contact-organisation-error">
                {fieldErrors.organisation}
              </p>
            ) : null}
          </div>

          <div className="contact-field contact-field-full">
            <label htmlFor="contact-message">
              What would you like to discuss? *
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={8}
              minLength={10}
              maxLength={4_000}
              required
              aria-describedby={`contact-message-help${
                fieldErrors.message ? " contact-message-error" : ""
              }`}
              aria-invalid={fieldErrors.message ? true : undefined}
            />
            <p className="contact-form-help" id="contact-message-help">
              A short outline is enough. Please do not include confidential or
              sensitive information.
            </p>
            {fieldErrors.message ? (
              <p className="contact-field-error" id="contact-message-error">
                {fieldErrors.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="contact-honeypot" aria-hidden="true" hidden>
          <label htmlFor="contact-website">Leave this field empty</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <p className="contact-form-note">
          Agila uses your details to respond and protect this form from abuse. {" "}
          <Link href="/legal#privacy">Read the privacy notice.</Link>
        </p>

        <div
          className={`contact-submission-status contact-submission-${submissionState}`}
          id="contact-submission-status"
          role={submissionState === "error" || submissionState === "limited" ? "alert" : "status"}
          tabIndex={-1}
        >
          {submissionState === "success" ? (
            <>
              <strong>Enquiry submitted</strong>
              <span>
                Thank you. Your message has been submitted to Alejandro.
              </span>
            </>
          ) : null}
          {submissionState === "error" ? (
            <>
              <strong>We couldn&apos;t confirm your enquiry</strong>
              <span>
                Try again in a moment. If the problem continues, copy the email
                address below and contact Alejandro directly.
              </span>
            </>
          ) : null}
          {submissionState === "limited" ? (
            <>
              <strong>Please wait before trying again</strong>
              <span>
                We&apos;ve received too many enquiries from this connection. You
                can still copy Alejandro&apos;s email address below.
              </span>
            </>
          ) : null}
        </div>

        <button
          className="button button-light contact-submit"
          type="submit"
          disabled={submissionState === "sending"}
        >
          {submissionState === "sending" ? "Sending…" : "Send enquiry"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="contact-alternatives">
        <p>Email address</p>
        <div className="contact-alternative-actions">
          <span className="contact-address">{email}</span>
          <button type="button" onClick={copyEmailAddress}>
            Copy email address
          </button>
        </div>
        <p className="contact-copy-status" role="status">
          {copyStatus}
        </p>
      </div>
    </div>
  );
}

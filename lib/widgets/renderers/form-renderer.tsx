"use client";

import { useState } from "react";
import type { WidgetInstance, FormElementDefinition, SelectOption } from "../types";

export function FormRenderer({ widget }: { widget: WidgetInstance; pageId: string; fullPath: string }) {
  const {
    formTypeId = "",
    formName = "Form",
    submitButtonText = "Submit",
    successMessage = "Thank you for your submission!",
    elements = [],
  } = widget.props as {
    formTypeId: string;
    formName: string;
    submitButtonText: string;
    successMessage: string;
    elements: FormElementDefinition[];
  };

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/widgets/form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: widget.id,
          formTypeId,
          formName,
          pageId: widget.pageId,
          data: formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Submission failed.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-6 text-left">
        <p className="text-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 text-left">
      {formName && (
        <h3 className="text-lg font-semibold text-card-foreground">{formName}</h3>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {(elements as FormElementDefinition[]).map((el) => (
        <FormField
          key={el.id}
          element={el}
          value={formData[el.name] || el.defaultValue || ""}
          onChange={(val) => handleChange(el.name, val)}
        />
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : submitButtonText}
      </button>
    </form>
  );
}

function FormField({
  element,
  value,
  onChange,
}: {
  element: FormElementDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const baseInputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  switch (element.type) {
    case "text-input":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {element.label}{element.required && " *"}
          </label>
          <input
            type="text"
            name={element.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={element.placeholder}
            required={element.required}
            className={baseInputClass}
          />
        </div>
      );

    case "email-input":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {element.label}{element.required && " *"}
          </label>
          <input
            type="email"
            name={element.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={element.placeholder}
            required={element.required}
            className={baseInputClass}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {element.label}{element.required && " *"}
          </label>
          <textarea
            name={element.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={element.placeholder}
            required={element.required}
            rows={4}
            className={baseInputClass}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {element.label}{element.required && " *"}
          </label>
          <select
            name={element.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={element.required}
            className={baseInputClass}
          >
            <option value="">Select...</option>
            {(element.options || []).map((opt: SelectOption) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name={element.name}
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <label className="text-sm text-foreground">
            {element.label}{element.required && " *"}
          </label>
        </div>
      );

    case "radio":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {element.label}{element.required && " *"}
          </label>
          <div className="space-y-1">
            {(element.options || []).map((opt: SelectOption) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={element.name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case "submit":
      return null; // Submit handled by main form button

    default:
      return null;
  }
}

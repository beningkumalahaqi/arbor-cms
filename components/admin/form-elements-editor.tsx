"use client";

import { useState } from "react";
import { Button, Card, Badge, Input, Label } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { FormElementDefinition, FormElementType, SelectOption } from "@/lib/widgets/types";

interface FormElementsEditorProps {
  elements: FormElementDefinition[];
  onChange: (elements: FormElementDefinition[]) => void;
}

const ELEMENT_TYPES: { value: FormElementType; label: string }[] = [
  { value: "text-input", label: "Text Input" },
  { value: "email-input", label: "Email Input" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
];

function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function FormElementsEditor({ elements, onChange }: FormElementsEditorProps) {
  const [editingElement, setEditingElement] = useState<FormElementDefinition | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  function handleAdd(type: FormElementType) {
    const typeLabel = ELEMENT_TYPES.find((t) => t.value === type)?.label || type;
    const newElement: FormElementDefinition = {
      id: generateId(),
      type,
      label: typeLabel,
      name: type.replace("-", "_") + "_" + (elements.length + 1),
      placeholder: "",
      required: false,
      options: type === "select" || type === "radio" ? [{ label: "Option 1", value: "option_1" }] : undefined,
    };
    onChange([...elements, newElement]);
  }

  function handleRemove(index: number) {
    const updated = elements.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleMove(index: number, direction: "up" | "down") {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= elements.length) return;
    const updated = [...elements];
    [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
    onChange(updated);
  }

  function handleEditOpen(element: FormElementDefinition, index: number) {
    setEditingElement({ ...element, options: element.options ? [...element.options] : undefined });
    setEditingIndex(index);
  }

  function handleEditSave() {
    if (!editingElement || editingIndex < 0) return;
    const updated = [...elements];
    updated[editingIndex] = editingElement;
    onChange(updated);
    setEditingElement(null);
    setEditingIndex(-1);
  }

  return (
    <div className="space-y-3">
      {elements.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
          No form fields yet. Add fields below.
        </div>
      ) : (
        <div className="space-y-2">
          {elements.map((el, idx) => (
            <Card key={el.id} className="flex items-center gap-2 px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(idx, "up")}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button
                  onClick={() => handleMove(idx, "down")}
                  disabled={idx === elements.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{el.label}</span>
                  <Badge variant="secondary" className="text-xs">{el.type}</Badge>
                  {el.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">name: {el.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditOpen(el, idx)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Edit field"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                </button>
                <button
                  onClick={() => handleRemove(idx)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Remove field"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Field Buttons */}
      <div className="flex flex-wrap gap-2">
        {ELEMENT_TYPES.map((et) => (
          <Button key={et.value} variant="outline" size="sm" onClick={() => handleAdd(et.value)}>
            + {et.label}
          </Button>
        ))}
      </div>

      {/* Edit Field Dialog */}
      {editingElement && (
        <FormElementEditDialog
          element={editingElement}
          onElementChange={setEditingElement}
          onSave={handleEditSave}
          onClose={() => { setEditingElement(null); setEditingIndex(-1); }}
        />
      )}
    </div>
  );
}

// ─── Form Element Edit Dialog ─────────────────────────────────────────

function FormElementEditDialog({
  element,
  onElementChange,
  onSave,
  onClose,
}: {
  element: FormElementDefinition;
  onElementChange: (el: FormElementDefinition) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const hasOptions = element.type === "select" || element.type === "radio";

  function updateField<K extends keyof FormElementDefinition>(key: K, value: FormElementDefinition[K]) {
    onElementChange({ ...element, [key]: value });
  }

  function addOption() {
    const options = element.options || [];
    const num = options.length + 1;
    updateField("options", [...options, { label: `Option ${num}`, value: `option_${num}` }]);
  }

  function updateOption(index: number, field: keyof SelectOption, value: string) {
    const options = [...(element.options || [])];
    options[index] = { ...options[index], [field]: value };
    updateField("options", options);
  }

  function removeOption(index: number) {
    const options = (element.options || []).filter((_, i) => i !== index);
    updateField("options", options);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Form Field</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-auto pr-1">
          <div className="space-y-1">
            <Label>Field Type</Label>
            <Select
              value={element.type}
              onValueChange={(val) => {
                const newType = val as FormElementType;
                const needsOptions = newType === "select" || newType === "radio";
                onElementChange({
                  ...element,
                  type: newType,
                  options: needsOptions && !element.options
                    ? [{ label: "Option 1", value: "option_1" }]
                    : element.options,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ELEMENT_TYPES.map((et) => (
                  <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Label</Label>
            <Input
              value={element.label}
              onChange={(e) => updateField("label", e.target.value)}
              placeholder="Field label"
            />
          </div>

          <div className="space-y-1">
            <Label>Field Name</Label>
            <Input
              value={element.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="field_name"
            />
            <p className="text-xs text-muted-foreground">
              Used as the key in form submission data. Use snake_case.
            </p>
          </div>

          {element.type !== "checkbox" && (
            <div className="space-y-1">
              <Label>Placeholder</Label>
              <Input
                value={element.placeholder || ""}
                onChange={(e) => updateField("placeholder", e.target.value)}
                placeholder="Optional placeholder text"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={element.required || false}
              onChange={(e) => updateField("required", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-foreground">Required field</span>
          </label>

          {hasOptions && (
            <div className="space-y-2">
              <Label>Options</Label>
              {(element.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt.label}
                    onChange={(e) => updateOption(idx, "label", e.target.value)}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={opt.value}
                    onChange={(e) => updateOption(idx, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeOption(idx)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption}>
                + Add Option
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={onSave}>Save Field</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

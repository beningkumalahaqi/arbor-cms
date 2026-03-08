"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge, FormField, Input, Textarea } from "@/components/ui";
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
  DialogTrigger,
} from "@/components/ui";
import { ImageField } from "@/components/admin/image-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FormElementsEditor } from "@/components/admin/form-elements-editor";
import type {
  WidgetAreaDefinition,
  WidgetInstance,
  WidgetDefinition,
  WidgetPropDefinition,
  WidgetSlotDefinition,
  FormElementDefinition,
} from "@/lib/widgets/types";
import { getAllWidgets, getWidget, buildDefaultWidgetProps } from "@/lib/widgets";

interface WidgetEditorProps {
  pageId: string;
  areas: WidgetAreaDefinition[];
  widgets: WidgetInstance[];
  onWidgetsChange: (widgets: WidgetInstance[]) => void;
}

export function WidgetEditor({ pageId, areas, widgets, onWidgetsChange }: WidgetEditorProps) {
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingProps, setEditingProps] = useState<Record<string, unknown>>({});
  const [addingTarget, setAddingTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form reuse state
  const [formReuseOpen, setFormReuseOpen] = useState(false);
  const [formReuseContext, setFormReuseContext] = useState<{
    areaName: string;
    parentId?: string;
    slot?: string;
  } | null>(null);
  const [existingFormTypes, setExistingFormTypes] = useState<
    { id: string; name: string; elements: FormElementDefinition[] }[]
  >([]);
  const [loadingForms, setLoadingForms] = useState(false);

  // FormType validation state — tracks which form widgets have missing FormTypes
  const [missingFormTypes, setMissingFormTypes] = useState<Set<string>>(new Set());
  const [creatingFormType, setCreatingFormType] = useState(false);

  const allWidgetDefs = getAllWidgets();

  // Get top-level widgets for a given area (no parent)
  function getAreaWidgets(areaName: string): WidgetInstance[] {
    return widgets
      .filter((w) => w.area === areaName && !w.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Get child widgets for a specific parent and slot
  function getSlotWidgets(parentId: string, slotName: string): WidgetInstance[] {
    return widgets
      .filter((w) => w.parentId === parentId && w.slot === slotName)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function getAllowedWidgetsForArea(area: WidgetAreaDefinition): WidgetDefinition[] {
    if (!area.allowedWidgets || area.allowedWidgets.length === 0) {
      return allWidgetDefs;
    }
    return allWidgetDefs.filter((w) => area.allowedWidgets!.includes(w.type));
  }

  function getAllowedWidgetsForSlot(slot: WidgetSlotDefinition): WidgetDefinition[] {
    // Don't allow nesting containers inside containers (prevent infinite nesting)
    const nonContainers = allWidgetDefs.filter((w) => !w.isContainer);
    if (!slot.allowedWidgets || slot.allowedWidgets.length === 0) {
      return nonContainers;
    }
    return nonContainers.filter((w) => slot.allowedWidgets!.includes(w.type));
  }

  function canAddToArea(area: WidgetAreaDefinition): boolean {
    if (area.maxWidgets === undefined) return true;
    return getAreaWidgets(area.name).length < area.maxWidgets;
  }

  function canAddToSlot(slot: WidgetSlotDefinition, parentId: string): boolean {
    if (slot.maxWidgets === undefined) return true;
    return getSlotWidgets(parentId, slot.name).length < slot.maxWidgets;
  }

  function handleStartEdit(widget: WidgetInstance) {
    setEditingWidgetId(widget.id);
    setEditingProps({ ...widget.props });
  }

  function handleCancelEdit() {
    setEditingWidgetId(null);
    setEditingProps({});
  }

  function handleEditPropChange(name: string, value: unknown) {
    setEditingProps((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddWidget(
    areaName: string,
    widgetType: string,
    parentId?: string,
    slot?: string
  ) {
    // Intercept form widget — show reuse dialog with FormTypes
    if (widgetType === "form") {
      setFormReuseContext({ areaName, parentId, slot });
      setLoadingForms(true);
      setFormReuseOpen(true);
      try {
        const res = await fetch("/api/form-types");
        const data = await res.json();
        if (data.formTypes) {
          setExistingFormTypes(data.formTypes);
        }
      } catch {
        setExistingFormTypes([]);
      }
      setLoadingForms(false);
      setAddingTarget(null);
      return;
    }

    await createWidget(areaName, widgetType, undefined, parentId, slot);
  }

  async function handleFormReuseChoice(formType?: { id: string; name: string; elements: FormElementDefinition[] }) {
    if (!formReuseContext) return;
    const { areaName, parentId, slot } = formReuseContext;

    if (formType) {
      // Reuse existing FormType — link widget to it and copy elements
      await createWidget(areaName, "form", {
        formTypeId: formType.id,
        formName: formType.name,
        elements: formType.elements,
      }, parentId, slot);
    } else {
      // Create new form — will auto-create FormType on first submission
      // (or when user saves)
      await createWidget(areaName, "form", undefined, parentId, slot);
    }

    setFormReuseOpen(false);
    setFormReuseContext(null);
    setExistingFormTypes([]);
  }

  // Create a FormType from a widget's current form elements and link it
  async function handleCreateFormTypeForWidget(widgetId: string) {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    setCreatingFormType(true);
    try {
      const formName = String(widget.props.formName || "Unnamed Form");
      const elements = widget.props.elements || [];

      const res = await fetch("/api/form-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, elements }),
      });

      if (res.ok) {
        const data = await res.json();
        const newFormTypeId = data.formType.id;

        // Update the widget to link to the new FormType
        const updateRes = await fetch(`/api/widgets/${widgetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ props: { ...widget.props, formTypeId: newFormTypeId } }),
        });

        if (updateRes.ok) {
          const updateData = await updateRes.json();
          const updated = {
            ...updateData.widget,
            props: typeof updateData.widget.props === "string" ? JSON.parse(updateData.widget.props) : updateData.widget.props,
          };
          onWidgetsChange(widgets.map((w) => (w.id === widgetId ? updated : w)));

          // If we were editing this widget, update the editing props too
          if (editingWidgetId === widgetId) {
            setEditingProps((prev) => ({ ...prev, formTypeId: newFormTypeId }));
          }

          // Remove from missing set
          setMissingFormTypes((prev) => {
            const next = new Set(prev);
            next.delete(widgetId);
            return next;
          });
        }
      }
    } catch (err) {
      console.error("Failed to create FormType:", err);
    }
    setCreatingFormType(false);
  }

  // Validate FormType links for form widgets when widgets change
  async function validateFormTypeLinks() {
    const formWidgets = widgets.filter((w) => w.type === "form" && w.props.formTypeId);
    if (formWidgets.length === 0) return;

    try {
      const res = await fetch("/api/form-types");
      const data = await res.json();
      const existingIds = new Set((data.formTypes || []).map((ft: { id: string }) => ft.id));

      const missing = new Set<string>();
      for (const fw of formWidgets) {
        if (fw.props.formTypeId && !existingIds.has(String(fw.props.formTypeId))) {
          missing.add(fw.id);
        }
      }
      setMissingFormTypes(missing);
    } catch {
      // Can't validate — don't show errors
    }
  }

  // Run validation on mount and when widgets change
  useEffect(() => {
    validateFormTypeLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  async function createWidget(
    areaName: string,
    widgetType: string,
    overrideProps?: Record<string, unknown>,
    parentId?: string,
    slot?: string
  ) {
    const def = getWidget(widgetType);
    if (!def) return;

    const baseProps = buildDefaultWidgetProps(def.propSchema);
    const finalProps = overrideProps ? { ...baseProps, ...overrideProps } : baseProps;

    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          area: areaName,
          type: widgetType,
          props: finalProps,
          parentId: parentId || undefined,
          slot: slot || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.widget) {
        const newWidget = {
          ...data.widget,
          props: typeof data.widget.props === "string" ? JSON.parse(data.widget.props) : data.widget.props,
        };
        onWidgetsChange([...widgets, newWidget]);
        // Auto-open the editor for new top-level widgets only
        if (!parentId) {
          handleStartEdit(newWidget);
        }
      }
    } catch (err) {
      console.error("Failed to add widget:", err);
    }

    setAddingTarget(null);
  }

  async function handleSaveWidget() {
    if (!editingWidgetId) return;
    setSaving(true);

    let propsToSave = { ...editingProps };

    // For form widgets: auto-create a FormType if none is linked
    const currentWidget = widgets.find((w) => w.id === editingWidgetId);
    if (currentWidget?.type === "form" && !propsToSave.formTypeId) {
      try {
        const formName = String(propsToSave.formName || "Unnamed Form");
        const elements = propsToSave.elements || [];

        const ftRes = await fetch("/api/form-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, elements }),
        });

        if (ftRes.ok) {
          const ftData = await ftRes.json();
          propsToSave = { ...propsToSave, formTypeId: ftData.formType.id };
        }
      } catch {
        // If FormType creation fails, save without it
      }
    }

    try {
      const res = await fetch(`/api/widgets/${editingWidgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ props: propsToSave }),
      });

      const data = await res.json();
      if (res.ok && data.widget) {
        const updated = {
          ...data.widget,
          props: typeof data.widget.props === "string" ? JSON.parse(data.widget.props) : data.widget.props,
        };
        onWidgetsChange(widgets.map((w) => (w.id === editingWidgetId ? updated : w)));
      }
    } catch (err) {
      console.error("Failed to update widget:", err);
    }

    setSaving(false);
    setEditingWidgetId(null);
    setEditingProps({});
  }

  async function handleDeleteWidget(widgetId: string) {
    if (!confirm("Delete this widget?")) return;

    try {
      const res = await fetch(`/api/widgets/${widgetId}`, { method: "DELETE" });
      if (res.ok) {
        // Remove the widget and all its children from state
        onWidgetsChange(widgets.filter((w) => w.id !== widgetId && w.parentId !== widgetId));
        if (editingWidgetId === widgetId) {
          setEditingWidgetId(null);
          setEditingProps({});
        }
      }
    } catch (err) {
      console.error("Failed to delete widget:", err);
    }
  }

  async function handleMoveWidget(
    widgetId: string,
    direction: "up" | "down",
    siblings: WidgetInstance[]
  ) {
    const idx = siblings.findIndex((w) => w.id === widgetId);
    if (idx === -1) return;

    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];

    const widgetIds = reordered.map((w) => w.id);

    try {
      await fetch("/api/widgets/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetIds }),
      });

      const updatedWidgets = widgets.map((w) => {
        const newOrder = widgetIds.indexOf(w.id);
        if (newOrder !== -1) {
          return { ...w, sortOrder: newOrder };
        }
        return w;
      });
      onWidgetsChange(updatedWidgets);
    } catch (err) {
      console.error("Failed to reorder widgets:", err);
    }
  }

  // ─── Render a list of widgets (used for both areas and slots) ───────

  function renderWidgetList(
    widgetList: WidgetInstance[],
    areaName: string,
    isNested?: boolean
  ) {
    return (
      <div className="space-y-2">
        {widgetList.map((widget, idx) => {
          const isEditing = editingWidgetId === widget.id;
          const def = getWidget(widget.type);

          return (
            <div key={widget.id}>
              <WidgetCard
                widget={widget}
                index={idx}
                total={widgetList.length}
                isEditing={isEditing}
                isNested={!!isNested}
                hasWarning={widget.type === "form" && missingFormTypes.has(widget.id)}
                onEdit={() => isEditing ? handleCancelEdit() : handleStartEdit(widget)}
                onDelete={() => handleDeleteWidget(widget.id)}
                onMoveUp={() => handleMoveWidget(widget.id, "up", widgetList)}
                onMoveDown={() => handleMoveWidget(widget.id, "down", widgetList)}
              />
              {/* Inline Edit Panel */}
              {isEditing && def && (
                <Card className={`mt-1 space-y-4 rounded-t-none border-t-0 p-4 ${isNested ? "" : ""}`}>
                  {/* FormType error banner for form widgets */}
                  {widget.type === "form" && missingFormTypes.has(widget.id) ? (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-destructive"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-destructive">
                          Linked form type has been deleted
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This form widget needs to be linked to a form type for submissions to be grouped correctly.
                          Create a new form type from this widget&apos;s current settings.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateFormTypeForWidget(widget.id)}
                          disabled={creatingFormType}
                        >
                          {creatingFormType ? "Creating..." : "Create Form Type"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* FormType info badge for linked form widgets */}
                  {widget.type === "form" && editingProps.formTypeId && !missingFormTypes.has(widget.id) ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      <span className="text-xs text-muted-foreground">
                        Linked to form type
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {String(editingProps.formTypeId).slice(0, 8)}…
                      </Badge>
                    </div>
                  ) : null}

                  {def.propSchema
                    .filter((propDef) => {
                      // Hide formTypeId from manual editing — it's managed automatically
                      if (propDef.name === "formTypeId") return false;
                      return true;
                    })
                    .map((propDef) => (
                    <WidgetPropField
                      key={propDef.name}
                      definition={propDef}
                      value={editingProps[propDef.name]}
                      onChange={(val) => handleEditPropChange(propDef.name, val)}
                    />
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSaveWidget} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>

                  {/* Container Slots — shown below props when editing a container widget */}
                  {def.isContainer && def.slots && (
                    <div className="space-y-4 border-t pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Child Widgets
                      </p>
                      {def.slots.map((slot) => {
                        // For columns widget, hide column3 when layout is 2-column
                        if (def.type === "columns" && slot.name === "column3") {
                          const layout = String(editingProps.layout || "1-1");
                          const isThreeCol = layout.split("-").length === 3;
                          if (!isThreeCol) return null;
                        }

                        const slotWidgets = getSlotWidgets(widget.id, slot.name);
                        const canAdd = canAddToSlot(slot, widget.id);
                        const allowedForSlot = getAllowedWidgetsForSlot(slot);
                        const addKey = `${widget.id}:${slot.name}`;

                        return (
                          <div key={slot.name} className="space-y-2 rounded-md border bg-muted/30 p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{slot.label}</span>
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  {slotWidgets.length}{slot.maxWidgets ? `/${slot.maxWidgets}` : ""}
                                </Badge>
                              </div>
                              {canAdd && (
                                <AddWidgetDialog
                                  label={slot.label}
                                  allowed={allowedForSlot}
                                  open={addingTarget === addKey}
                                  onOpenChange={(open) => setAddingTarget(open ? addKey : null)}
                                  onAdd={(type) => handleAddWidget(areaName, type, widget.id, slot.name)}
                                />
                              )}
                            </div>
                            {slotWidgets.length === 0 ? (
                              <div className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
                                No widgets in this slot yet.
                              </div>
                            ) : (
                              renderWidgetList(slotWidgets, areaName, true)
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {areas.map((area) => {
        const areaWidgets = getAreaWidgets(area.name);
        const allowed = getAllowedWidgetsForArea(area);
        const canAdd = canAddToArea(area);
        const addKey = `area:${area.name}`;

        return (
          <div key={area.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{area.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {areaWidgets.length}{area.maxWidgets ? `/${area.maxWidgets}` : ""} widgets
                </Badge>
              </div>
              {canAdd && (
                <AddWidgetDialog
                  label={area.label}
                  allowed={allowed}
                  open={addingTarget === addKey}
                  onOpenChange={(open) => setAddingTarget(open ? addKey : null)}
                  onAdd={(type) => handleAddWidget(area.name, type)}
                />
              )}
            </div>

            {areaWidgets.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                No widgets yet. Click &quot;Add Widget&quot; to get started.
              </div>
            ) : (
              renderWidgetList(areaWidgets, area.name)
            )}
          </div>
        );
      })}

      {/* Form Reuse Dialog */}
      <Dialog open={formReuseOpen} onOpenChange={(open) => {
        if (!open) {
          setFormReuseOpen(false);
          setFormReuseContext(null);
          setExistingFormTypes([]);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Form Widget</DialogTitle>
          </DialogHeader>
          {loadingForms ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading form types...</p>
          ) : (
            <div className="space-y-4">
              {existingFormTypes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Use an existing form type</p>
                  <p className="text-xs text-muted-foreground">
                    Link to an existing form type to reuse its structure and collect submissions together.
                  </p>
                  <div className="max-h-48 space-y-1 overflow-auto">
                    {existingFormTypes.map((formType) => (
                      <button
                        key={formType.id}
                        onClick={() => handleFormReuseChoice(formType)}
                        className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-accent"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{formType.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formType.elements.length} field{formType.elements.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><polyline points="9 18 15 12 9 6" /></svg>
                      </button>
                    ))}
                  </div>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleFormReuseChoice()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Create New Form
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Add Widget Dialog ────────────────────────────────────────────────

function AddWidgetDialog({
  label,
  allowed,
  open,
  onOpenChange,
  onAdd,
}: {
  label: string;
  allowed: WidgetDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: string) => void;
}) {
  // Group by category
  const categories = new Map<string, WidgetDefinition[]>();
  for (const w of allowed) {
    const cat = w.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(w);
  }

  const categoryLabels: Record<string, string> = {
    content: "Content",
    media: "Media",
    layout: "Layout",
    interactive: "Interactive",
    advanced: "Advanced",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Widget to {label}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-auto">
          {Array.from(categories.entries()).map(([cat, defs]) => (
            <div key={cat}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {categoryLabels[cat] || cat}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {defs.map((def) => (
                  <button
                    key={def.type}
                    onClick={() => onAdd(def.type)}
                    className="flex items-center gap-2 rounded-md border p-3 text-left transition-colors hover:bg-accent"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-muted-foreground"
                    >
                      <path d={def.icon} />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{def.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{def.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Widget Card ──────────────────────────────────────────────────────

function WidgetCard({
  widget,
  index,
  total,
  isEditing,
  isNested,
  hasWarning,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  widget: WidgetInstance;
  index: number;
  total: number;
  isEditing: boolean;
  isNested?: boolean;
  hasWarning?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const def = getWidget(widget.type);
  const label = def?.label || widget.type;

  // Show a brief summary of the widget content
  function getSummary(): string {
    const p = widget.props;
    if (p.text && typeof p.text === "string") return p.text;
    if (p.title && typeof p.title === "string") return p.title;
    if (p.formName && typeof p.formName === "string") return p.formName;
    if (p.content && typeof p.content === "string") {
      return (p.content as string).replace(/<[^>]*>/g, "").slice(0, 60);
    }
    if (p.src && typeof p.src === "string") return p.src;
    return "";
  }

  const summary = getSummary();

  return (
    <Card className={`flex items-center gap-2 px-3 py-2 ${isEditing ? "rounded-b-none border-primary/50 bg-accent/50" : ""} ${isNested ? "border-dashed" : ""}`}>
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Move up"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Move down"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      </div>

      {def && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-muted-foreground"
        >
          <path d={def.icon} />
        </svg>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {def?.isContainer && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">container</Badge>
          )}
          {hasWarning && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              unlinked
            </Badge>
          )}
          {summary && (
            <span className="truncate text-xs text-muted-foreground">— {summary}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className={`rounded p-1 ${isEditing ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
          title={isEditing ? "Close editor" : "Edit widget"}
        >
          {isEditing ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
          )}
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete widget"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
      </div>
    </Card>
  );
}

// ─── Widget Prop Field ────────────────────────────────────────────────
// Renders the appropriate form field for a widget property definition.

function WidgetPropField({
  definition,
  value,
  onChange,
}: {
  definition: WidgetPropDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = `${definition.label}${definition.required ? " *" : ""}`;

  switch (definition.type) {
    case "text":
      return (
        <FormField label={label}>
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={definition.placeholder}
            required={definition.required}
          />
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "textarea":
      return (
        <FormField label={label}>
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={definition.placeholder}
            required={definition.required}
            rows={6}
          />
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "richText":
      return (
        <FormField label={label}>
          <RichTextEditor
            value={String(value ?? "")}
            onChange={(val) => onChange(val)}
            required={definition.required}
            rows={6}
          />
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "number":
      return (
        <FormField label={label}>
          <Input
            type="number"
            value={value !== undefined && value !== "" ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            min={definition.min}
            max={definition.max}
            placeholder={definition.placeholder}
            required={definition.required}
          />
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "select":
      return (
        <FormField label={label}>
          <Select value={String(value ?? "")} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(definition.options || []).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "image":
      return (
        <FormField label={label}>
          <ImageField
            value={String(value ?? "")}
            onChange={(val) => onChange(val)}
            required={definition.required}
          />
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "color":
      return (
        <FormField label={label}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(value || "#000000")}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border bg-background"
            />
            <Input
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000 or empty"
              className="flex-1"
            />
            {String(value ?? "") !== "" && (
              <Button variant="ghost" size="sm" onClick={() => onChange("")}>
                Clear
              </Button>
            )}
          </div>
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "url":
      return (
        <FormField label={label}>
          <Input
            type="url"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={definition.placeholder || "https://example.com"}
            required={definition.required}
          />
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "boolean":
      return (
        <FormField label="">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-foreground">{definition.label}</span>
          </label>
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    case "formElements":
      return (
        <FormField label={label}>
          <FormElementsEditor
            elements={(value || []) as FormElementDefinition[]}
            onChange={onChange}
          />
          {definition.helpText && (
            <p className="mt-1 text-xs text-muted-foreground">{definition.helpText}</p>
          )}
        </FormField>
      );

    default:
      return (
        <FormField label={label}>
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
        </FormField>
      );
  }
}

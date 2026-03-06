"use client";

import { useState, useEffect } from "react";
import { getAllPageTypes, type PageTypeDefinition } from "@/lib/page-types";
import { availableIcons, getIconByName } from "@/lib/icons";
import { PageLayout } from "@/components/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  PageTypeIcon,
} from "@/components/ui";

interface SettingsData {
  pageTypeName: string;
  icon: string;
  allowedChildren: string[];
}

export default function PageTypesPage() {
  const [pageTypes] = useState<PageTypeDefinition[]>(getAllPageTypes());
  const [settings, setSettings] = useState<Record<string, SettingsData>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editIcon, setEditIcon] = useState("");
  const [editAllowed, setEditAllowed] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/page-types/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const map: Record<string, SettingsData> = {};
          for (const s of data.settings) {
            map[s.pageTypeName] = {
              pageTypeName: s.pageTypeName,
              icon: s.icon,
              allowedChildren:
                typeof s.allowedChildren === "string"
                  ? JSON.parse(s.allowedChildren)
                  : s.allowedChildren,
            };
          }
          setSettings(map);
        }
      });
  }, []);

  function startEdit(typeName: string) {
    const current = settings[typeName];
    setEditIcon(current?.icon ?? "file");
    setEditAllowed(current?.allowedChildren ?? []);
    setEditing(typeName);
  }

  function toggleAllowed(typeName: string) {
    setEditAllowed((prev) =>
      prev.includes(typeName)
        ? prev.filter((t) => t !== typeName)
        : [...prev, typeName]
    );
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);

    const res = await fetch("/api/page-types/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageTypeName: editing,
        icon: editIcon,
        allowedChildren: editAllowed,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSettings((prev) => ({
        ...prev,
        [editing]: {
          pageTypeName: editing,
          icon: data.settings.icon,
          allowedChildren: data.settings.allowedChildren,
        },
      }));
      setEditing(null);
    }
    setSaving(false);
  }

  return (
    <PageLayout
      title="Page Types"
      description="Manage page type settings, icons, and allowed children."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {pageTypes.map((pt) => {
          const s = settings[pt.name];
          const iconDef = getIconByName(s?.icon ?? "file");
          const isEditing = editing === pt.name;

          return (
            <Card key={pt.name}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <PageTypeIcon
                      iconPath={iconDef?.path ?? ""}
                      size={20}
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{pt.label}</CardTitle>
                    <CardDescription>{pt.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Icon picker */}
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Icon
                    </p>
                    <div className="grid grid-cols-10 gap-1">
                      {availableIcons.map((icon) => (
                        <button
                          key={icon.name}
                          type="button"
                          onClick={() => setEditIcon(icon.name)}
                          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                            editIcon === icon.name
                              ? "bg-foreground text-background"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                          title={icon.label}
                        >
                          <PageTypeIcon iconPath={icon.path} size={14} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allowed children */}
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Allowed Children
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pageTypes.map((childType) => (
                        <button
                          key={childType.name}
                          type="button"
                          onClick={() => toggleAllowed(childType.name)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            editAllowed.includes(childType.name)
                              ? "bg-foreground text-background"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {childType.label}
                        </button>
                      ))}
                    </div>
                    {editAllowed.length === 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        No restrictions — all types allowed as children
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 px-2">
                  {/* Allowed children display */}
                  {s?.allowedChildren && s.allowedChildren.length > 0 && (
                    <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Allowed Children
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.allowedChildren.map((name) => {
                        const childType = pageTypes.find(
                          (t) => t.name === name
                        );
                        return (
                          <span
                            key={name}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {childType?.label ?? name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Properties */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Properties
                    </p>
                    <ul className="mt-1 space-y-1">
                      {pt.allowedProperties.map((prop) => (
                        <li
                          key={prop.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground/80">
                            {prop.label}
                          </span>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {prop.type}
                            {prop.required ? " • required" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startEdit(pt.name)}
                  >
                    Edit Settings
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ImageSelectorModal } from "@/components/admin/image-selector-modal";

interface ImageFieldProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function ImageField({ value, onChange, required }: ImageFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <div className="overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/storage/file/${value}`}
              alt="Selected"
              className="max-h-48 object-contain"
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {value}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">No image selected</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          {value ? "Change Image" : "Select Image"}
        </Button>
        {value && !required && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>

      <ImageSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={onChange}
        currentValue={value}
      />
    </div>
  );
}

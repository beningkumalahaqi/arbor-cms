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
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/storage/file/${value}`}
              alt="Selected"
              className="max-h-48 object-contain"
            />
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {value}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-400">No image selected</p>
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

-- Add nesting support to Widget table
ALTER TABLE "Widget" ADD COLUMN "parentId" TEXT;
ALTER TABLE "Widget" ADD COLUMN "slot" TEXT NOT NULL DEFAULT '';

-- Create index for parent lookups
CREATE INDEX "Widget_parentId_idx" ON "Widget"("parentId");

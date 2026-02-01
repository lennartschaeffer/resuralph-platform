-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "uploader" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "selectedText" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "positionData" JSONB NOT NULL,
    "isHighPriority" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_s3Key_key" ON "documents"("s3Key");

-- CreateIndex
CREATE INDEX "annotations_documentId_idx" ON "annotations"("documentId");

-- CreateIndex
CREATE INDEX "annotations_creatorId_idx" ON "annotations"("creatorId");

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

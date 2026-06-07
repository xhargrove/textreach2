-- CreateTable
CREATE TABLE "KeywordOptIn" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordOptIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordOptIn_keywordId_contactId_key" ON "KeywordOptIn"("keywordId", "contactId");

-- AddForeignKey
ALTER TABLE "KeywordOptIn" ADD CONSTRAINT "KeywordOptIn_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordOptIn" ADD CONSTRAINT "KeywordOptIn_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordOptIn" ADD CONSTRAINT "KeywordOptIn_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

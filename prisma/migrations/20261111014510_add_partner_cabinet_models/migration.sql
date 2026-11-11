-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "desiredDate" TIMESTAMP(3) NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'manager',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_venueId_idx" ON "WaitlistEntry"("venueId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_idx" ON "WaitlistEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_code_key" ON "Certificate"("code");

-- CreateIndex
CREATE INDEX "Certificate_partnerId_idx" ON "Certificate"("partnerId");

-- CreateIndex
CREATE INDEX "StaffMember_partnerId_idx" ON "StaffMember"("partnerId");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

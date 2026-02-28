-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('MULTIFAMILY', 'COMMERCIAL', 'MIXED_USE', 'INDUSTRIAL', 'FUND');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('RAISING', 'ACTIVE', 'DISTRIBUTING', 'SOLD');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXITED');

-- CreateEnum
CREATE TYPE "DistributionType" AS ENUM ('DIVIDEND', 'PREFERRED_RETURN', 'CAPITAL_RETURN', 'SPECIAL');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID');

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "targetReturn" DECIMAL(5,2),
    "totalRaised" DECIMAL(19,2),
    "totalUnits" INTEGER,
    "acquisitionDate" TIMESTAMP(3),
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "investedAmount" DECIMAL(19,2) NOT NULL,
    "currentValue" DECIMAL(19,2) NOT NULL,
    "shareCount" DECIMAL(19,6),
    "investmentDate" TIMESTAMP(3) NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributions" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amount" DECIMAL(19,2) NOT NULL,
    "distributionType" "DistributionType" NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "value" DECIMAL(19,2) NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'quarterly_report',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolios_userId_idx" ON "portfolios"("userId");

-- CreateIndex
CREATE INDEX "investments_portfolioId_idx" ON "investments"("portfolioId");

-- CreateIndex
CREATE INDEX "investments_propertyId_idx" ON "investments"("propertyId");

-- CreateIndex
CREATE INDEX "distributions_investmentId_idx" ON "distributions"("investmentId");

-- CreateIndex
CREATE INDEX "distributions_distributionDate_idx" ON "distributions"("distributionDate");

-- CreateIndex
CREATE INDEX "valuations_investmentId_valuationDate_idx" ON "valuations"("investmentId", "valuationDate");

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

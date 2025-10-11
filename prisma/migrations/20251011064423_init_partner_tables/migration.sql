/*
  Warnings:

  - You are about to drop the `Partner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerPhoto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerVideo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PartnerDocument" DROP CONSTRAINT "PartnerDocument_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PartnerPhoto" DROP CONSTRAINT "PartnerPhoto_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PartnerVideo" DROP CONSTRAINT "PartnerVideo_partnerId_fkey";

-- DropTable
DROP TABLE "public"."Partner";

-- DropTable
DROP TABLE "public"."PartnerDocument";

-- DropTable
DROP TABLE "public"."PartnerPhoto";

-- DropTable
DROP TABLE "public"."PartnerVideo";

-- DropEnum
DROP TYPE "public"."Status";

-- CreateTable
CREATE TABLE "tbl_partner" (
    "PartnerID" SERIAL NOT NULL,
    "BusinessName" TEXT NOT NULL,
    "ContactPerson" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Phone" TEXT NOT NULL,
    "Category" TEXT NOT NULL,
    "Subcategory" TEXT NOT NULL,
    "PhysicalAddress" TEXT NOT NULL,
    "MapLink" TEXT NOT NULL,
    "ShortDescription" TEXT NOT NULL,
    "OperatingHours" TEXT NOT NULL,
    "FullDescription" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Pending',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_partner_pkey" PRIMARY KEY ("PartnerID")
);

-- CreateTable
CREATE TABLE "tbl_partner_documents" (
    "DocumentID" SERIAL NOT NULL,
    "PartnerID" INTEGER NOT NULL,
    "FilePath" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_partner_documents_pkey" PRIMARY KEY ("DocumentID")
);

-- CreateTable
CREATE TABLE "tbl_partner_photos" (
    "PhotoID" SERIAL NOT NULL,
    "PartnerID" INTEGER NOT NULL,
    "FilePath" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_partner_photos_pkey" PRIMARY KEY ("PhotoID")
);

-- CreateTable
CREATE TABLE "tbl_partner_videos" (
    "VideoID" SERIAL NOT NULL,
    "PartnerID" INTEGER NOT NULL,
    "FilePath" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_partner_videos_pkey" PRIMARY KEY ("VideoID")
);

-- AddForeignKey
ALTER TABLE "tbl_partner_documents" ADD CONSTRAINT "tbl_partner_documents_PartnerID_fkey" FOREIGN KEY ("PartnerID") REFERENCES "tbl_partner"("PartnerID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_partner_photos" ADD CONSTRAINT "tbl_partner_photos_PartnerID_fkey" FOREIGN KEY ("PartnerID") REFERENCES "tbl_partner"("PartnerID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_partner_videos" ADD CONSTRAINT "tbl_partner_videos_PartnerID_fkey" FOREIGN KEY ("PartnerID") REFERENCES "tbl_partner"("PartnerID") ON DELETE CASCADE ON UPDATE CASCADE;

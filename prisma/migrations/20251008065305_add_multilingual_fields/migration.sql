/*
  Warnings:

  - You are about to drop the column `BannerTitle` on the `tbl_banner` table. All the data in the column will be lost.
  - You are about to drop the column `CmsText` on the `tbl_cms` table. All the data in the column will be lost.
  - Added the required column `CmsText_en` to the `tbl_cms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_banner" DROP COLUMN "BannerTitle",
ADD COLUMN     "BannerTitle_de" TEXT,
ADD COLUMN     "BannerTitle_en" TEXT,
ADD COLUMN     "BannerTitle_es" TEXT,
ADD COLUMN     "BannerTitle_fr" TEXT,
ADD COLUMN     "BannerTitle_zh" TEXT;

-- AlterTable
ALTER TABLE "tbl_cms" DROP COLUMN "CmsText",
ADD COLUMN     "CmsText_de" TEXT,
ADD COLUMN     "CmsText_en" TEXT NOT NULL,
ADD COLUMN     "CmsText_es" TEXT,
ADD COLUMN     "CmsText_fr" TEXT,
ADD COLUMN     "CmsText_zh" TEXT;

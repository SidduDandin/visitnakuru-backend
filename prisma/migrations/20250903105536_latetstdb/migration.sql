-- CreateTable
CREATE TABLE "tbl_admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_admin_username_key" ON "tbl_admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_admin_email_key" ON "tbl_admin"("email");

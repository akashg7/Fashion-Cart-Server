/*
  Warnings:

  - Made the column `description` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `products` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `products` MODIFY `description` VARCHAR(191) NOT NULL,
    MODIFY `category` VARCHAR(191) NOT NULL,
    MODIFY `image` VARCHAR(191) NOT NULL;

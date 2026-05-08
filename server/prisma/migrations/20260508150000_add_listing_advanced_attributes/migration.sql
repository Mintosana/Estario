-- CreateEnum
CREATE TYPE "FurnishingStatus" AS ENUM ('UNFURNISHED', 'PARTIAL', 'FURNISHED');

-- CreateEnum
CREATE TYPE "ParkingType" AS ENUM ('NONE', 'PARKING_SPOT', 'GARAGE');

-- CreateEnum
CREATE TYPE "HeatingType" AS ENUM ('OWN_CENTRAL', 'DISTRICT', 'ELECTRIC', 'GAS', 'OTHER');

-- CreateEnum
CREATE TYPE "BuildingCondition" AS ENUM ('NEW', 'RENOVATED', 'GOOD', 'NEEDS_RENOVATION');

-- CreateEnum
CREATE TYPE "EnergyClass" AS ENUM ('A', 'B', 'C', 'D', 'E', 'UNKNOWN');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "balcony" BOOLEAN,
ADD COLUMN "parking" "ParkingType",
ADD COLUMN "furnished" "FurnishingStatus",
ADD COLUMN "heatingType" "HeatingType",
ADD COLUMN "hasOwnCentralHeating" BOOLEAN,
ADD COLUMN "buildingCondition" "BuildingCondition",
ADD COLUMN "energyClass" "EnergyClass";

-- AlterTable
ALTER TABLE "saved_searches" ADD COLUMN "balcony" BOOLEAN,
ADD COLUMN "parking" "ParkingType",
ADD COLUMN "furnished" "FurnishingStatus",
ADD COLUMN "hasOwnCentralHeating" BOOLEAN;

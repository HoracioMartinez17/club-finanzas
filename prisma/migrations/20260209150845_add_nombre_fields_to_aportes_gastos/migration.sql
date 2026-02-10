-- DropForeignKey
ALTER TABLE "aportes" DROP CONSTRAINT "aportes_miembroId_fkey";

-- DropForeignKey
ALTER TABLE "gastos" DROP CONSTRAINT "gastos_quienPagoId_fkey";

-- AlterTable
ALTER TABLE "aportes" ADD COLUMN     "miembroNombre" TEXT,
ALTER COLUMN "miembroId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "quienPagoNombre" TEXT,
ALTER COLUMN "quienPagoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ingresos" ADD COLUMN     "miembroNombre" TEXT;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "miembros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_quienPagoId_fkey" FOREIGN KEY ("quienPagoId") REFERENCES "miembros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

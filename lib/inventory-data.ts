import type { ImageSourcePropType } from "react-native";
import { ALERT_LEAD_DAY_OPTIONS, coerceAlertLeadDays, dateFromKey, daysUntil, formatDate, formatDays, getLotTone, type AlertLeadDays } from "@/lib/inventory-utils";

export { ALERT_LEAD_DAY_OPTIONS, coerceAlertLeadDays, dateFromKey, daysUntil, formatDate, formatDays, getLotTone };
export type { AlertLeadDays };

export type Quality = "Bom estado" | "Deteriorado" | "Estragado" | "Vencido";
export type ArrivalStatus = "Normal" | "Validade crítica" | "Avariado";
export type MovementType = "Recebido" | "Conferido" | "Vendido" | "Avariado" | "Vencido" | "Estragado" | "Ajuste";

export type InventoryProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  volume: string;
  barcode: string;
  archived?: boolean;
  archivedAt?: string;
  image: ImageSourcePropType;
};

export type InventoryLot = {
  id: string;
  productId: string;
  code: string;
  expiryDate: string;
  receivedAt: string;
  initialQuantity: number;
  currentQuantity: number;
  quality: Quality;
  arrivalStatus: ArrivalStatus;
};

export type Movement = {
  id: string;
  lotId: string;
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  employee: string;
};

export type NewLotInput = Omit<InventoryLot, "id" | "productId"> & {
  product: Omit<InventoryProduct, "id" | "image" | "archived" | "archivedAt">;
  photoUri?: string;
};

export const PRODUCT_IMAGES = {
  assortment: require("@/assets/images/products/grocery-assortment.jpg"),
  box: require("@/assets/images/products/grocery-box.jpg"),
};

export const initialProducts: InventoryProduct[] = [];

export const initialLots: InventoryLot[] = [];

export const initialMovements: Movement[] = [];

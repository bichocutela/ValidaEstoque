import type { ImageSourcePropType } from "react-native";
import { dateFromKey, daysUntil, formatDate, formatDays, getLotTone } from "@/lib/inventory-utils";

export { dateFromKey, daysUntil, formatDate, formatDays, getLotTone };

export type Quality = "Bom estado" | "Deteriorado" | "Estragado" | "Vencido";
export type ArrivalStatus = "Normal" | "Validade crítica" | "Avariado";
export type MovementType = "Recebido" | "Vendido" | "Avariado" | "Vencido" | "Estragado" | "Ajuste";

export type InventoryProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  volume: string;
  barcode: string;
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
  product: Omit<InventoryProduct, "id" | "image">;
  photoUri?: string;
};

export const PRODUCT_IMAGES = {
  assortment: require("@/assets/images/products/grocery-assortment.jpg"),
  box: require("@/assets/images/products/grocery-box.jpg"),
};

export const initialProducts: InventoryProduct[] = [
  { id: "p-yogurt", name: "Iogurte Natural", brand: "Nestlé", category: "Laticínios", volume: "170 g", barcode: "7891000101001", image: PRODUCT_IMAGES.assortment },
  { id: "p-ham", name: "Presunto Cozido", brand: "Sadia", category: "Frios", volume: "200 g", barcode: "7893000202002", image: PRODUCT_IMAGES.assortment },
  { id: "p-milk", name: "Leite Integral", brand: "Piracanjuba", category: "Laticínios", volume: "1 L", barcode: "7894000303003", image: PRODUCT_IMAGES.assortment },
  { id: "p-cola", name: "Refrigerante Cola", brand: "Coca-Cola", category: "Bebidas", volume: "2 L", barcode: "7894900404004", image: PRODUCT_IMAGES.box },
  { id: "p-bread", name: "Pão de Forma", brand: "Plus Vita", category: "Padaria", volume: "500 g", barcode: "7896000505005", image: PRODUCT_IMAGES.box },
  { id: "p-apple", name: "Maçã Gala", brand: "Hortifruti", category: "Hortifruti", volume: "1 kg", barcode: "7897000606006", image: PRODUCT_IMAGES.box },
];

export const initialLots: InventoryLot[] = [
  { id: "l-yogurt-1", productId: "p-yogurt", code: "YG29011", expiryDate: "2026-08-15", receivedAt: "2026-08-12", initialQuantity: 8, currentQuantity: 8, quality: "Bom estado", arrivalStatus: "Validade crítica" },
  { id: "l-yogurt-2", productId: "p-yogurt", code: "YG29022", expiryDate: "2026-08-28", receivedAt: "2026-08-12", initialQuantity: 40, currentQuantity: 40, quality: "Bom estado", arrivalStatus: "Normal" },
  { id: "l-ham-1", productId: "p-ham", code: "SD7730", expiryDate: "2026-08-18", receivedAt: "2026-08-14", initialQuantity: 10, currentQuantity: 10, quality: "Bom estado", arrivalStatus: "Validade crítica" },
  { id: "l-milk-1", productId: "p-milk", code: "LP8032", expiryDate: "2026-09-04", receivedAt: "2026-08-15", initialQuantity: 70, currentQuantity: 70, quality: "Bom estado", arrivalStatus: "Normal" },
  { id: "l-cola-1", productId: "p-cola", code: "A781", expiryDate: "2026-09-12", receivedAt: "2026-08-10", initialQuantity: 48, currentQuantity: 48, quality: "Bom estado", arrivalStatus: "Normal" },
  { id: "l-cola-2", productId: "p-cola", code: "B921", expiryDate: "2026-09-02", receivedAt: "2026-08-10", initialQuantity: 52, currentQuantity: 52, quality: "Bom estado", arrivalStatus: "Normal" },
  { id: "l-cola-3", productId: "p-cola", code: "C840", expiryDate: "2026-08-13", receivedAt: "2026-08-10", initialQuantity: 6, currentQuantity: 6, quality: "Vencido", arrivalStatus: "Normal" },
  { id: "l-bread-1", productId: "p-bread", code: "PV1182", expiryDate: "2026-08-25", receivedAt: "2026-08-14", initialQuantity: 38, currentQuantity: 38, quality: "Bom estado", arrivalStatus: "Normal" },
  { id: "l-apple-1", productId: "p-apple", code: "HG4019", expiryDate: "2026-08-27", receivedAt: "2026-08-15", initialQuantity: 4, currentQuantity: 4, quality: "Deteriorado", arrivalStatus: "Avariado" },
];

export const initialMovements: Movement[] = [
  { id: "m-1", lotId: "l-milk-1", productId: "p-milk", type: "Recebido", quantity: 70, date: "2026-08-15T08:30:00", employee: "Mariana Costa" },
  { id: "m-2", lotId: "l-yogurt-1", productId: "p-yogurt", type: "Recebido", quantity: 8, date: "2026-08-12T11:10:00", employee: "Mariana Costa" },
  { id: "m-3", lotId: "l-cola-3", productId: "p-cola", type: "Vencido", quantity: 2, date: "2026-08-14T17:20:00", employee: "Caio Mendes" },
  { id: "m-4", lotId: "l-apple-1", productId: "p-apple", type: "Avariado", quantity: 1, date: "2026-08-15T09:05:00", employee: "Mariana Costa" },
];

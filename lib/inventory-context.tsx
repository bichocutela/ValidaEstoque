import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import {
  initialLots,
  initialMovements,
  initialProducts,
  PRODUCT_IMAGES,
  type ArrivalStatus,
  type InventoryLot,
  type InventoryProduct,
  type Movement,
  type MovementType,
  type NewLotInput,
  type Quality,
} from "@/lib/inventory-data";

type Snapshot = { products: InventoryProduct[]; lots: InventoryLot[]; movements: Movement[] };
type InventoryContextValue = Snapshot & {
  isReady: boolean;
  signedIn: boolean;
  employeeName: string;
  signIn: (name: string) => void;
  signOut: () => void;
  getProduct: (id: string) => InventoryProduct | undefined;
  getLot: (id: string) => InventoryLot | undefined;
  lotsForProduct: (productId: string) => InventoryLot[];
  addLot: (input: NewLotInput) => { lot: InventoryLot; isCritical: boolean };
  editLot: (lotId: string, updates: Partial<Pick<InventoryLot, "expiryDate" | "quality" | "arrivalStatus" | "currentQuantity">>) => void;
  createMovement: (lotId: string, type: MovementType, quantity: number) => void;
};

const STORAGE_KEY = "validaestoque-v1";
const InventoryContext = createContext<InventoryContextValue | null>(null);

function getSeed(): Snapshot {
  return { products: initialProducts, lots: initialLots, movements: initialMovements };
}

export function InventoryProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<Snapshot>(getSeed);
  const [isReady, setIsReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [employeeName, setEmployeeName] = useState("Mariana Costa");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as Snapshot;
        if (parsed.products?.length && parsed.lots && parsed.movements) {
          setSnapshot({
            products: parsed.products.map((product) => ({ ...product, image: PRODUCT_IMAGES.assortment })),
            lots: parsed.lots,
            movements: parsed.movements,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const serializable = { ...snapshot, products: snapshot.products.map(({ image: _image, ...product }) => product) };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable)).catch(() => undefined);
  }, [isReady, snapshot]);

  const signIn = useCallback((name: string) => {
    setEmployeeName(name.trim() || "Mariana Costa");
    setSignedIn(true);
  }, []);
  const signOut = useCallback(() => setSignedIn(false), []);

  const getProduct = useCallback((id: string) => snapshot.products.find((product) => product.id === id), [snapshot.products]);
  const getLot = useCallback((id: string) => snapshot.lots.find((lot) => lot.id === id), [snapshot.lots]);
  const lotsForProduct = useCallback((productId: string) => snapshot.lots.filter((lot) => lot.productId === productId), [snapshot.lots]);

  const addLot = useCallback((input: NewLotInput) => {
    const normalizedName = input.product.name.trim().toLowerCase();
    const existing = snapshot.products.find((product) => product.barcode === input.product.barcode || (product.name.toLowerCase() === normalizedName && product.brand === input.product.brand));
    const product: InventoryProduct = existing ?? {
      id: `p-${Date.now()}`,
      ...input.product,
      image: PRODUCT_IMAGES.assortment,
    };
    const lot: InventoryLot = {
      id: `l-${Date.now()}`,
      productId: product.id,
      code: input.code.trim() || "SEM-LOTE",
      expiryDate: input.expiryDate,
      receivedAt: input.receivedAt,
      initialQuantity: input.initialQuantity,
      currentQuantity: input.currentQuantity,
      quality: input.quality,
      arrivalStatus: input.arrivalStatus,
    };
    const movement: Movement = { id: `m-${Date.now()}`, lotId: lot.id, productId: product.id, type: "Recebido", quantity: lot.currentQuantity, date: new Date().toISOString(), employee: employeeName };
    setSnapshot((current) => ({ products: existing ? current.products : [...current.products, product], lots: [lot, ...current.lots], movements: [movement, ...current.movements] }));
    const isCritical = input.arrivalStatus === "Validade crítica";
    return { lot, isCritical };
  }, [employeeName, snapshot.products]);

  const editLot = useCallback((lotId: string, updates: Partial<Pick<InventoryLot, "expiryDate" | "quality" | "arrivalStatus" | "currentQuantity">>) => {
    setSnapshot((current) => ({ ...current, lots: current.lots.map((lot) => lot.id === lotId ? { ...lot, ...updates } : lot) }));
  }, []);

  const createMovement = useCallback((lotId: string, type: MovementType, quantity: number) => {
    setSnapshot((current) => {
      const lot = current.lots.find((item) => item.id === lotId);
      if (!lot || quantity <= 0 || quantity > lot.currentQuantity) return current;
      const changeQuality: Quality | undefined = type === "Vencido" ? "Vencido" : type === "Estragado" ? "Estragado" : type === "Avariado" ? "Deteriorado" : undefined;
      const changeArrival: ArrivalStatus | undefined = type === "Avariado" ? "Avariado" : undefined;
      const movement: Movement = { id: `m-${Date.now()}`, lotId, productId: lot.productId, type, quantity, date: new Date().toISOString(), employee: employeeName };
      return {
        ...current,
        lots: current.lots.map((item) => item.id === lotId ? { ...item, currentQuantity: item.currentQuantity - quantity, quality: changeQuality ?? item.quality, arrivalStatus: changeArrival ?? item.arrivalStatus } : item),
        movements: [movement, ...current.movements],
      };
    });
  }, [employeeName]);

  const value = useMemo(() => ({ ...snapshot, isReady, signedIn, employeeName, signIn, signOut, getProduct, getLot, lotsForProduct, addLot, editLot, createMovement }), [addLot, createMovement, editLot, employeeName, getLot, getProduct, isReady, lotsForProduct, signIn, signOut, signedIn, snapshot]);
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory deve ser usado dentro de InventoryProvider");
  return context;
}

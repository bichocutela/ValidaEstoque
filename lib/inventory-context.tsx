import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { accountEmailForRegistration, normalizeRegistrationNumber } from "@/lib/auth-rules";
import { loadEmployeeProfile, loadRemoteInventory, recordEmployeeEvent, synchronizeInventory } from "@/lib/inventory-sync";
import { supabase, type EmployeeProfile, type EmployeeRole } from "@/lib/supabase-client";
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

export type NotificationPreferences = { enabled: boolean; sameDay: boolean; days: number };
type Snapshot = { products: InventoryProduct[]; lots: InventoryLot[]; movements: Movement[]; notificationPreferences: NotificationPreferences };
type InventoryContextValue = Snapshot & {
  isReady: boolean;
  signedIn: boolean;
  employeeName: string;
  employeeRole: EmployeeRole | null;
  employeeProfile: EmployeeProfile | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerEmployee: (firstName: string, lastName: string, registrationNumber: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  getProduct: (id: string) => InventoryProduct | undefined;
  getLot: (id: string) => InventoryLot | undefined;
  lotsForProduct: (productId: string) => InventoryLot[];
  addLot: (input: NewLotInput) => { lot: InventoryLot; isCritical: boolean };
  editLot: (lotId: string, updates: Partial<Pick<InventoryLot, "expiryDate" | "quality" | "arrivalStatus" | "currentQuantity">>) => void;
  confirmLot: (lotId: string) => void;
  createMovement: (lotId: string, type: MovementType, quantity: number) => void;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
};

const STORAGE_KEY = "validaestoque-v1";
const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = { enabled: true, sameDay: true, days: 5 };
const InventoryContext = createContext<InventoryContextValue | null>(null);

function getSeed(): Snapshot {
  return { products: initialProducts, lots: initialLots, movements: initialMovements, notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES };
}

function isStoredSnapshot(value: unknown): value is Partial<Snapshot> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Snapshot>;
  return Array.isArray(candidate.products) && Array.isArray(candidate.lots) && Array.isArray(candidate.movements);
}

function makeInventoryId(prefix: "p" | "l" | "m") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function InventoryProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<Snapshot>(getSeed);
  const [isReady, setIsReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [employeeName, setEmployeeName] = useState("Administrador");
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored) as unknown;
          if (!isStoredSnapshot(parsed) || !parsed.products?.length || !parsed.lots || !parsed.movements) return;
          setSnapshot({
            products: parsed.products.map((product) => ({ ...product, image: PRODUCT_IMAGES.assortment })),
            lots: parsed.lots,
            movements: parsed.movements,
            notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed.notificationPreferences },
          });
        } catch {
          // Dados locais inválidos não interrompem a abertura do aplicativo; a rotina inicia com a base segura.
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

  const applyEmployeeSession = useCallback(async (userId: string) => {
    const profile = await loadEmployeeProfile(userId);
    if (profile.status !== "active") {
      await supabase.auth.signOut();
      return { success: false, message: "Este acesso está suspenso. Procure a administração." };
    }
    const remoteSnapshot = await loadRemoteInventory();
    if (remoteSnapshot) setSnapshot({ ...remoteSnapshot, products: remoteSnapshot.products.map((product) => ({ ...product, image: PRODUCT_IMAGES.assortment })) });
    setEmployeeProfile(profile);
    setEmployeeName(profile.full_name);
    setSignedIn(true);
    await recordEmployeeEvent(profile, "login").catch(() => undefined);
    return { success: true };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) await applyEmployeeSession(data.session.user.id).catch(() => undefined);
    }).catch(() => undefined);
  }, [applyEmployeeSession, isReady]);

  const signIn = useCallback(async (registrationNumber: string, password: string) => {
    const registration = normalizeRegistrationNumber(registrationNumber);
    const email = registration === "admin" ? "haydendanex@gmail.com" : accountEmailForRegistration(registration);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { success: false, message: "Matrícula ou senha inválida." };
    return applyEmployeeSession(data.user.id);
  }, [applyEmployeeSession]);

  const registerEmployee = useCallback(async (firstName: string, lastName: string, registrationNumber: string) => {
    const registration = normalizeRegistrationNumber(registrationNumber);
    const { data, error } = await supabase.auth.signUp({
      email: accountEmailForRegistration(registration),
      password: registrationNumber.trim(),
      options: { data: { full_name: `${firstName.trim()} ${lastName.trim()}`, registration_number: registration } },
    });
    if (error) return { success: false, message: error.message.includes("already") ? "Esta matrícula já possui cadastro. Entre usando a matrícula como senha." : error.message };
    if (!data.user) return { success: false, message: "Não foi possível concluir o cadastro." };
    const sessionResult = await applyEmployeeSession(data.user.id);
    return sessionResult.success ? { success: true, message: "Cadastro concluído e acesso liberado." } : { success: false, message: sessionResult.message ?? "Não foi possível iniciar a sessão." };
  }, []);

  const signOut = useCallback(async () => {
    if (employeeProfile) await recordEmployeeEvent(employeeProfile, "logout").catch(() => undefined);
    await supabase.auth.signOut();
    setEmployeeProfile(null);
    setEmployeeName("Administrador");
    setSignedIn(false);
  }, [employeeProfile]);

  useEffect(() => {
    if (!signedIn || !employeeProfile || !isReady) return;
    const timer = setTimeout(() => {
      void synchronizeInventory(employeeProfile, snapshot).catch(() => undefined);
    }, 900);
    return () => clearTimeout(timer);
  }, [employeeProfile, isReady, signedIn, snapshot]);

  useEffect(() => {
    if (!signedIn || !employeeProfile) return;
    const interval = setInterval(() => {
      void loadRemoteInventory().then((remoteSnapshot) => {
        if (remoteSnapshot) setSnapshot({ ...remoteSnapshot, products: remoteSnapshot.products.map((product) => ({ ...product, image: PRODUCT_IMAGES.assortment })) });
      }).catch(() => undefined);
    }, 20000);
    return () => clearInterval(interval);
  }, [employeeProfile, signedIn]);

  const getProduct = useCallback((id: string) => snapshot.products.find((product) => product.id === id), [snapshot.products]);
  const getLot = useCallback((id: string) => snapshot.lots.find((lot) => lot.id === id), [snapshot.lots]);
  const lotsForProduct = useCallback((productId: string) => snapshot.lots.filter((lot) => lot.productId === productId), [snapshot.lots]);

  const addLot = useCallback((input: NewLotInput) => {
    const normalizedName = input.product.name.trim().toLowerCase();
    const existing = snapshot.products.find((product) => product.barcode === input.product.barcode || (product.name.toLowerCase() === normalizedName && product.brand === input.product.brand));
    const product: InventoryProduct = existing ?? {
      id: makeInventoryId("p"),
      ...input.product,
      image: PRODUCT_IMAGES.assortment,
    };
    const lot: InventoryLot = {
      id: makeInventoryId("l"),
      productId: product.id,
      code: input.code.trim() || "SEM-LOTE",
      expiryDate: input.expiryDate,
      receivedAt: input.receivedAt,
      initialQuantity: input.initialQuantity,
      currentQuantity: input.currentQuantity,
      quality: input.quality,
      arrivalStatus: input.arrivalStatus,
    };
    const movement: Movement = { id: makeInventoryId("m"), lotId: lot.id, productId: product.id, type: "Recebido", quantity: lot.currentQuantity, date: new Date().toISOString(), employee: employeeName };
    setSnapshot((current) => ({ ...current, products: existing ? current.products : [...current.products, product], lots: [lot, ...current.lots], movements: [movement, ...current.movements] }));
    if (employeeProfile) {
      if (!existing) void recordEmployeeEvent(employeeProfile, "product_created", "product", product.id).catch(() => undefined);
      void recordEmployeeEvent(employeeProfile, "lot_created", "lot", lot.id).catch(() => undefined);
      void recordEmployeeEvent(employeeProfile, "movement_created", "movement", movement.id).catch(() => undefined);
    }
    const isCritical = input.arrivalStatus === "Validade crítica";
    return { lot, isCritical };
  }, [employeeName, employeeProfile, snapshot.products]);

  const editLot = useCallback((lotId: string, updates: Partial<Pick<InventoryLot, "expiryDate" | "quality" | "arrivalStatus" | "currentQuantity">>) => {
    setSnapshot((current) => ({ ...current, lots: current.lots.map((lot) => lot.id === lotId ? { ...lot, ...updates, currentQuantity: updates.currentQuantity === undefined ? lot.currentQuantity : Math.max(0, updates.currentQuantity) } : lot) }));
  }, []);

  const confirmLot = useCallback((lotId: string) => {
    setSnapshot((current) => {
      const lot = current.lots.find((item) => item.id === lotId);
      if (!lot) return current;
      const movement: Movement = { id: makeInventoryId("m"), lotId, productId: lot.productId, type: "Conferido", quantity: 0, date: new Date().toISOString(), employee: employeeName };
      return { ...current, movements: [movement, ...current.movements] };
    });
  }, [employeeName]);

  const createMovement = useCallback((lotId: string, type: MovementType, quantity: number) => {
    setSnapshot((current) => {
      const lot = current.lots.find((item) => item.id === lotId);
      if (!lot || quantity <= 0 || quantity > lot.currentQuantity) return current;
      const changeQuality: Quality | undefined = type === "Vencido" ? "Vencido" : type === "Estragado" ? "Estragado" : type === "Avariado" ? "Deteriorado" : undefined;
      const changeArrival: ArrivalStatus | undefined = type === "Avariado" ? "Avariado" : undefined;
      const movement: Movement = { id: `m-${Date.now()}`, lotId, productId: lot.productId, type, quantity, date: new Date().toISOString(), employee: employeeName };
      if (employeeProfile) void recordEmployeeEvent(employeeProfile, "movement_created", "movement", movement.id).catch(() => undefined);
      return {
        ...current,
        lots: current.lots.map((item) => item.id === lotId ? { ...item, currentQuantity: item.currentQuantity - quantity, quality: changeQuality ?? item.quality, arrivalStatus: changeArrival ?? item.arrivalStatus } : item),
        movements: [movement, ...current.movements],
      };
    });
  }, [employeeName, employeeProfile]);

  const updateNotificationPreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setSnapshot((current) => ({ ...current, notificationPreferences: { ...current.notificationPreferences, ...updates } }));
  }, []);

  const value = useMemo(() => ({ ...snapshot, isReady, signedIn, employeeName, employeeRole: employeeProfile?.role ?? null, employeeProfile, signIn, registerEmployee, signOut, getProduct, getLot, lotsForProduct, addLot, editLot, confirmLot, createMovement, updateNotificationPreferences }), [addLot, confirmLot, createMovement, editLot, employeeName, employeeProfile, getLot, getProduct, isReady, lotsForProduct, registerEmployee, signIn, signOut, signedIn, snapshot, updateNotificationPreferences]);
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory deve ser usado dentro de InventoryProvider");
  return context;
}

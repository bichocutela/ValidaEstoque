import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("A conexão institucional com o Supabase não foi configurada.");
}

export const supabase = createClient(url, key, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

export type EmployeeRole = "admin" | "manager" | "employee";
export type EmployeeStatus = "pending" | "active" | "suspended";

export type EmployeeProfile = {
  id: string;
  store_id: string;
  email: string;
  full_name: string;
  registration_number: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  last_login_at: string | null;
  created_at: string;
};

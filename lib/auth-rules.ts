export type RegistrationInput = { firstName: string; lastName: string; registrationNumber: string };

export function normalizeRegistrationNumber(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function accountEmailForRegistration(registrationNumber: string) {
  return `${normalizeRegistrationNumber(registrationNumber)}@nordestaomaisvoce.com.br`;
}

export function validateRegistration(input: RegistrationInput): string | null {
  if (input.firstName.trim().length < 2) return "Informe o nome do funcionário.";
  if (input.lastName.trim().length < 2) return "Informe o sobrenome do funcionário.";
  const registration = normalizeRegistrationNumber(input.registrationNumber);
  if (!/^[a-z0-9.-]{6,32}$/.test(registration)) return "A matrícula deve ter entre 6 e 32 letras, números, pontos ou hífens.";
  return null;
}

export function roleLabel(role: "admin" | "manager" | "employee") {
  return role === "admin" ? "Administrador" : role === "manager" ? "Gestor" : "Funcionário";
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(directory, "..");
const gradlePath = path.join(projectRoot, "android", "app", "build.gradle");

const requiredEnvironment = [
  "ANDROID_KEYSTORE_PATH",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
];

for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(
      `A variável ${name} é obrigatória para assinar o APK de release.`,
    );
  }
}

if (!fs.existsSync(gradlePath)) {
  throw new Error(
    "O projeto Android não foi encontrado. Execute o prebuild antes de configurar a assinatura.",
  );
}

let gradle = fs.readFileSync(gradlePath, "utf8");
const releaseSigningBlock = `
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }`;

if (!gradle.includes("signingConfigs.release")) {
  if (!gradle.includes("signingConfigs {")) {
    throw new Error(
      "Não foi possível localizar signingConfigs no Gradle gerado.",
    );
  }
  gradle = gradle.replace(
    "signingConfigs {",
    `signingConfigs {${releaseSigningBlock}`,
  );
}

const signedRelease = gradle.replace(
  /(release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/,
  "$1signingConfigs.release",
);

if (signedRelease === gradle) {
  throw new Error(
    "Não foi possível trocar a configuração de assinatura da variante release.",
  );
}

fs.writeFileSync(gradlePath, signedRelease);
console.log("Assinatura de release Android configurada.");

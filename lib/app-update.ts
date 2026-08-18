import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

import { type AppRelease } from "@/lib/app-update-core";

export { checkForUpdate, compareVersions, formatApkSize, parseAppRelease, type AppRelease } from "@/lib/app-update-core";

export async function downloadApk(release: AppRelease, onProgress: (ratio: number) => void) {
  if (Platform.OS !== "android") throw new Error("A instalação interna está disponível somente no Android.");
  const destination = `${FileSystem.cacheDirectory}validaestoque-${release.version}.apk`;
  await FileSystem.deleteAsync(destination, { idempotent: true });
  const task = FileSystem.createDownloadResumable(release.apkUrl, destination, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    const ratio = totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0;
    onProgress(Math.max(0, Math.min(1, ratio)));
  });
  const result = await task.downloadAsync();
  if (!result?.uri) throw new Error("O download do APK não foi concluído.");
  onProgress(1);
  return result.uri;
}

export async function openAndroidInstaller(apkUri: string) {
  if (Platform.OS !== "android") throw new Error("A instalação interna está disponível somente no Android.");
  const contentUri = await FileSystem.getContentUriAsync(apkUri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", { data: contentUri, type: "application/vnd.android.package-archive", flags: 1 });
}

import * as Crypto from "expo-crypto";
import { settingsRepo } from "../data/repos";
import { SETTINGS_KEYS } from "../providers/AppProviders";

const SALT = "kharcha_v1_salt_pin";

export const hashPin = async (pin: string): Promise<string> => {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${SALT}:${pin}`);
};

export const savePin = async (pin: string): Promise<void> => {
  const h = await hashPin(pin);
  await settingsRepo.set(SETTINGS_KEYS.pinHash, h);
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const stored = await settingsRepo.get(SETTINGS_KEYS.pinHash);
  if (!stored) return false;
  const h = await hashPin(pin);
  return h === stored;
};

export const clearPin = async (): Promise<void> => {
  await settingsRepo.delete(SETTINGS_KEYS.pinHash);
};

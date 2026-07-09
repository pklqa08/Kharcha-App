import * as Crypto from "expo-crypto";

import { ISettingsRepository } from "@/src/domain/interfaces/repositories";

const DEFAULT_SALT = "kharcha_v1_salt_pin";

export interface PinServiceConfig {
  pinHashKey: string;
  salt?: string;
}

export interface PinService {
  hashPin(pin: string): Promise<string>;
  savePin(pin: string): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;
  clearPin(): Promise<void>;
}

export const createPinService = (
  settingsRepository: ISettingsRepository,
  config: PinServiceConfig
): PinService => {
  const salt = config.salt ?? DEFAULT_SALT;

  const hashPin = async (pin: string): Promise<string> => {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${pin}`
    );
  };

  const savePin = async (pin: string): Promise<void> => {
    const hash = await hashPin(pin);
    await settingsRepository.set(config.pinHashKey, hash);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const stored = await settingsRepository.get(config.pinHashKey);
    if (!stored) {
      return false;
    }
    const hash = await hashPin(pin);
    return hash === stored;
  };

  const clearPin = async (): Promise<void> => {
    await settingsRepository.delete(config.pinHashKey);
  };

  return {
    hashPin,
    savePin,
    verifyPin,
    clearPin,
  };
};

import { pinService } from "@/src/application/services";

export const hashPin = (pin: string): Promise<string> => pinService.hashPin(pin);

export const savePin = (pin: string): Promise<void> => pinService.savePin(pin);

export const verifyPin = (pin: string): Promise<boolean> => pinService.verifyPin(pin);

export const clearPin = (): Promise<void> => pinService.clearPin();

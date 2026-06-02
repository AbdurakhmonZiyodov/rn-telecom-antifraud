import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  initialize(host: string): Promise<string>;
  isInitialized(): Promise<boolean>;
  setSslPinning(pins: string[]): Promise<string>;
  clearSslPinning(): Promise<string>;
  verifySmsCode(phoneNumber: string, smsCode: string): Promise<string>;
  confirmFace(birthDate: string, document: string): Promise<string>;
  makeOperation(): Promise<string>;
  detectFraud(smsCode: string): Promise<string>;
  logout(): Promise<string>;
  getApplicationId(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('RNTelecomAntiFraud');

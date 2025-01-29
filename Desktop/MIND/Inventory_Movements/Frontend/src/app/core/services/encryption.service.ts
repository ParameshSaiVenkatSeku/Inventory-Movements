import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private secretKey = 'akriviaautomation';
  constructor() {}

  encryptData(data: any): string {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      this.secretKey
    ).toString();
    return encrypted;
  }

  decryptData(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }
}

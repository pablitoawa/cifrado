import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';
import * as forge from 'node-forge';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  encryptionPassword: string = '';
  seedText: string = '';
  privateKey: string = '';
  publicKey: string = '';
  selectedFile: File | null = null;
  isDragging: boolean = false;
  isGeneratingKeys: boolean = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const files = element.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  encryptFile() {
    if (!this.selectedFile || !this.encryptionPassword) {
      alert('Por favor selecciona un archivo y proporciona una contraseña.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const fileContent = e.target.result;
      const encrypted = CryptoJS.AES.encrypt(
        fileContent,
        this.encryptionPassword
      ).toString();
      const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${this.selectedFile!.name}.catx`);
    };
    reader.readAsText(this.selectedFile);
  }

  generateKeys() {
    if (!this.seedText) {
      alert('Por favor ingresa un texto semilla para generar claves.');
      return;
    }

    this.isGeneratingKeys = true;

    // Simulate a delay to show the loading indicator
    setTimeout(() => {
      // Generar un hash SHA-256 del texto semilla
      const md = forge.md.sha256.create();
      md.update(this.seedText);
      const seed = md.digest().getBytes();

      // Inicializar el generador de números aleatorios de node-forge con la semilla
      const prng = forge.random.createInstance();
      prng.seedFileSync = () => seed; // Proporciona la semilla generada a prng

      // Generar claves RSA usando el generador de números aleatorios inicializado
      const rsa = forge.pki.rsa;
      const keypair = rsa.generateKeyPair({
        bits: 2048,
        e: 0x10001,
        prng: prng,
      });

      const privatePem = forge.pki.privateKeyToPem(keypair.privateKey);
      const publicPem = forge.pki.publicKeyToPem(keypair.publicKey);

      // Remove headers and footers
      this.privateKey = this.trimKeyPem(privatePem);
      this.publicKey = this.trimKeyPem(publicPem);

      this.isGeneratingKeys = false;
    }, 1000); // Simulating a 1-second delay for key generation
  }

  trimKeyPem(pem: string): string {
    return pem
      .replace(/-----BEGIN (.*)-----/, '')
      .replace(/-----END (.*)-----/, '')
      .replace(/[\n\r]/g, '');
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        alert('Se ha copiado al portapapeles');
      },
      (err) => {
        console.error('Error al copiar al portapapeles: ', err);
      }
    );
  }
}

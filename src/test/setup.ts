import '@testing-library/jest-dom'

// Mock for FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null
  error: DOMException | null = null
  readyState: number = 0
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null

  readAsArrayBuffer(file: File): void {
    // Mock implementation
    setTimeout(() => {
      this.result = new ArrayBuffer(0)
      this.readyState = 2
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>)
      }
    }, 0)
  }

  readAsText(file: File): void {
    // Mock implementation
    setTimeout(() => {
      this.result = ''
      this.readyState = 2
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>)
      }
    }, 0)
  }

  abort(): void {
    this.readyState = 2
  }
}

// Mock for btoa
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')

// Mock for TextEncoder
global.TextEncoder = class TextEncoder {
  encode(input: string): Uint8Array {
    return new Uint8Array(Buffer.from(input, 'utf8'))
  }
}

// Mock for ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

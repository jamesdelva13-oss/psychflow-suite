/** qr.ts — QR image generation for invitation URLs (PNG data URL + SVG for print). */
import QRCode from "qrcode";

export async function qrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: 600 });
}

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
}

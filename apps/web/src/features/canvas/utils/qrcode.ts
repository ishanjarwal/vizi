import QRCode from "qrcode";

/**
 * Generates a base64 Data URL for a QR code string.
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  },
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width ?? 200,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.darkColor ?? "#000000",
        light: options?.lightColor ?? "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    return "";
  }
}

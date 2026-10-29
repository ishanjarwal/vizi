"use client";

import * as React from "react";
import { Check, Copy, QrCode, Share2, Users, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import { generateQrDataUrl } from "../utils/qrcode";
import type { CollaborateModalProps as Props } from "../types";

export function CollaborateModal({
  isOpen,
  onClose,
  roomId,
  shareUrl,
  peers,
  selfUser,
  isConnected,
  isConnecting,
  onCreateRoom,
}: Props) {
  const [copied, setCopied] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");

  React.useEffect(() => {
    let isCancelled = false;

    if (shareUrl) {
      void generateQrDataUrl(shareUrl, {
        width: 180,
        margin: 2,
        darkColor: "#0f172a",
        lightColor: "#ffffff",
      }).then((dataUrl) => {
        if (!isCancelled) {
          setQrCodeUrl(dataUrl);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [shareUrl]);

  const handleCopyLink = React.useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Room link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Share2 className="size-4" />
            </div>
            <div>
              <DialogTitle>Live Collaboration</DialogTitle>
              <DialogDescription>
                Invite others to draw, edit, and collaborate in real time.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {roomId ? (
          <div className="flex flex-col gap-5 py-2">
            {/* Connection Status & Self Profile */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <Wifi className="size-3.5" />
                    Connected
                  </span>
                ) : isConnecting ? (
                  <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                    <Wifi className="size-3.5 animate-pulse" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <WifiOff className="size-3.5" />
                    Disconnected
                  </span>
                )}
              </div>

              {selfUser ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">You are:</span>
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: selfUser.color }}
                  />
                  <span className="font-semibold text-foreground">
                    {selfUser.name}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Share Link Field with Copy Button */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">
                Room Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-xs select-all"
                  aria-label="Room invite URL"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyLink()}
                  className="gap-1.5 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <QrCode className="size-4" />
                <span>Scan with phone or tablet</span>
              </div>
              {qrCodeUrl ? (
                <div className="overflow-hidden rounded-lg border border-border bg-white p-2 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR code to join room"
                    className="size-36"
                  />
                </div>
              ) : (
                <div className="flex size-36 items-center justify-center rounded-lg bg-muted/40 text-xs text-muted-foreground">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Connected Peers in Room */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="size-3.5" />
                  Connected Collaborators ({peers.length + 1})
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {/* Self */}
                {selfUser ? (
                  <div
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs shadow-xs"
                    style={{ borderColor: selfUser.color }}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: selfUser.color }}
                    />
                    <span className="font-medium text-foreground">
                      {selfUser.name} (You)
                    </span>
                  </div>
                ) : null}

                {/* Other Peers */}
                {peers.map((peer) => (
                  <div
                    key={peer.id}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs shadow-xs"
                    style={{ borderColor: peer.color }}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: peer.color }}
                    />
                    <span className="font-medium text-foreground">
                      {peer.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              Create a collaboration room to invite others to work with you in real time.
            </p>
            <Button
              type="button"
              onClick={() => void onCreateRoom()}
              disabled={isConnecting}
              className="w-full gap-2"
            >
              <Share2 className="size-4" />
              <span>{isConnecting ? "Creating Room..." : "Create Collaboration Room"}</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CollaborateModal;

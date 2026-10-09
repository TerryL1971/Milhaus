// src/components/paypal-cart-checkout-button.tsx
// Same pattern as paypal-checkout-button.tsx (PayPal's own Smart Button
// via their JS SDK), generalized to pay for the whole cart in one order
// instead of a single listing.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { capturePaypalOrderForCart, createPaypalOrderForCart } from "@/app/cart/actions";

type PaypalButtonsInstance = {
  render: (container: HTMLElement) => void;
  close?: () => Promise<void>;
};

type PaypalButtonsConfig = {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: unknown) => void;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PaypalButtonsConfig) => PaypalButtonsInstance;
    };
  }
}

// Module-scoped, not component state: React dev-mode Strict Mode double-
// invokes effects (mount -> cleanup -> mount) on first render, and this
// component can also remount across cart updates. Without a shared,
// one-time load, each mount injected its own <script>, re-executing
// PayPal's SDK mid-session — which is exactly what zoid (its component
// renderer) reports as "destroyed all components", and left no buttons
// rendered at all.
let sdkLoadPromise: Promise<void> | null = null;

function loadPaypalSdk(clientId: string): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkLoadPromise = null;
        reject(new Error("Failed to load the PayPal SDK"));
      };
      document.body.appendChild(script);
    });
  }
  return sdkLoadPromise;
}

export function PaypalCartCheckoutButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal isn't configured yet.");
      return;
    }

    let cancelled = false;
    let buttonsInstance: PaypalButtonsInstance | undefined;

    loadPaypalSdk(clientId)
      .then(() => {
        if (cancelled || !window.paypal || !containerRef.current) return;
        buttonsInstance = window.paypal.Buttons({
          createOrder: () => createPaypalOrderForCart(),
          onApprove: async (data) => {
            const result = await capturePaypalOrderForCart(data.orderID);
            if (result.ok) {
              router.push("/cart/success?provider=paypal");
            } else {
              setError("Payment didn't go through. Try again or use a different method.");
            }
          },
          onError: () => setError("Something went wrong with PayPal. Try again."),
        });
        buttonsInstance.render(containerRef.current);
      })
      .catch(() => setError("Couldn't load PayPal. Try again or use a different method."));

    return () => {
      cancelled = true;
      // Only tears down this mount's rendered button via zoid's own close
      // path — the SDK script itself is never removed, so a later remount
      // (cart updates, dev Strict Mode) reuses it instead of reloading it.
      buttonsInstance?.close?.().catch(() => {});
    };
  }, [router]);

  return (
    <div>
      <div ref={containerRef} />
      {error && <p className="mt-2 text-sm text-rust">{error}</p>}
    </div>
  );
}

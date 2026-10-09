// src/components/paypal-cart-checkout-button.tsx
// Same pattern as paypal-checkout-button.tsx (PayPal's own Smart Button
// via their JS SDK), generalized to pay for the whole cart in one order
// instead of a single listing.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { capturePaypalOrderForCart, createPaypalOrderForCart } from "@/app/cart/actions";

type PaypalButtonsConfig = {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: unknown) => void;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PaypalButtonsConfig) => {
        render: (container: HTMLElement) => void;
        close?: () => Promise<void>;
      };
    };
  }
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
    // zoid (PayPal's component renderer) needs to be told to close before
    // its container disappears — unmounting out from under it (e.g. the
    // cart hitting 0 items and swapping to the empty state) without this
    // makes it throw "zoid destroyed all components" into the console.
    let buttonsInstance: ReturnType<NonNullable<Window["paypal"]>["Buttons"]> | undefined;

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
    script.async = true;
    script.onload = () => {
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
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      // Best-effort: let zoid tear itself down gracefully first. Either
      // call can fail (instance never finished mounting, script already
      // gone via HMR, etc.) — none of that should surface as a crash.
      buttonsInstance?.close?.().catch(() => {});
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [router]);

  return (
    <div>
      <div ref={containerRef} />
      {error && <p className="mt-2 text-sm text-rust">{error}</p>}
    </div>
  );
}

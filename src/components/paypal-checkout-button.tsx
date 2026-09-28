// src/components/paypal-checkout-button.tsx
// Renders PayPal's own Smart Button via their JS SDK (loaded client-side
// with the public NEXT_PUBLIC_PAYPAL_CLIENT_ID) alongside the Stripe
// "pay with card" button on the checkout page. Order creation and capture
// both happen server-side (src/app/checkout/[listingId]/actions.ts) —
// this component only drives the SDK's UI and hands it those two calls.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { capturePaypalOrderAction, createPaypalOrderAction } from "@/app/checkout/[listingId]/actions";

type PaypalButtonsConfig = {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: unknown) => void;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PaypalButtonsConfig) => { render: (container: HTMLElement) => void };
    };
  }
}

export function PaypalCheckoutButton({ listingId }: { listingId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal isn't configured yet.");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
    script.async = true;
    script.onload = () => {
      if (!window.paypal || !containerRef.current) return;
      window.paypal
        .Buttons({
          createOrder: () => createPaypalOrderAction(listingId),
          onApprove: async (data) => {
            const result = await capturePaypalOrderAction(listingId, data.orderID);
            if (result.ok) {
              router.push(`/checkout/${listingId}/success?provider=paypal`);
            } else {
              setError("Payment didn't go through. Try again or use a different method.");
            }
          },
          onError: () => setError("Something went wrong with PayPal. Try again."),
        })
        .render(containerRef.current);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [listingId, router]);

  return (
    <div>
      <div ref={containerRef} />
      {error && <p className="mt-2 text-sm text-rust">{error}</p>}
    </div>
  );
}

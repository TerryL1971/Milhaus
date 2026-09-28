// src/lib/paypal.ts
// Server-only PayPal REST helpers for the dealer-posting checkout flow —
// same purpose as src/lib/stripe.ts. Sandbox base URL for now; swap to
// api-m.paypal.com only once real (non-sandbox) credentials are in use.
// Never import this from a "use client" component — it reads
// PAYPAL_CLIENT_SECRET, which must never reach the browser.

const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.access_token as string;
}

/** Creates a PayPal order for one listing's dealer posting fee. Returns
 * the order id the client-side PayPal buttons need to render approval. */
export async function createPaypalOrder(listingId: string, amountEur: number): Promise<string> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: listingId,
          description: "Milhaus dealer listing fee",
          amount: { currency_code: "EUR", value: amountEur.toFixed(2) },
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`PayPal order creation failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.id as string;
}

/** Captures an approved order — the buyer has already approved it via the
 * PayPal button on the client; this is the server-side step that
 * actually takes the payment and confirms it really happened. */
export async function capturePaypalOrder(orderId: string): Promise<{ status: string; amountEur: number | null }> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`PayPal capture failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: data.status as string,
    amountEur: capture?.amount?.value ? Number(capture.amount.value) : null,
  };
}

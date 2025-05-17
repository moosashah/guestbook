import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Initialize Stripe with your secret key from the environment
const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Map your package names to Stripe price IDs (replace with your actual price IDs from Stripe dashboard)
const PACKAGE_PRICE_IDS: Record<string, string> = {
  basic: "price_1RPrbKEQhBX7si7ZEz22L7Jm",
  premium: "price_1RPrbjEQhBX7si7ZLm24yiWf",
  deluxe: "price_1RPrc0EQhBX7si7ZaPo9owOL",
};

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

export async function POST(req: NextRequest) {
  //TODO: Add authentication
  try {
    const body = await req.json();
    console.log("[checkout-session] Incoming body:", body);
    const { package: packageType } = body;
    console.log("[checkout-session] Resolved packageType:", packageType);
    if (!packageType || !PACKAGE_PRICE_IDS[packageType]) {
      console.log("[checkout-session] Invalid package type:", packageType);
      return NextResponse.json(
        { error: "Invalid package type" },
        { status: 400 },
      );
    }

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: PACKAGE_PRICE_IDS[packageType],
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${BASE_URL}/create/success?session_id={CHECKOUT_SESSION_ID}`,
      //TODO: Create cancel url
      cancel_url: `${BASE_URL}/create/cancel`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

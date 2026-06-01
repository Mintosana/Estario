import { env } from "../config/env.js";
import {
  fulfillPromotionCheckoutSession,
  getStripeWebhookClient
} from "../services/promotion.service.js";

export async function stripeWebhookAction(req, res) {
  if (!env.stripe.webhookSecret) {
    return res.status(500).json({
      message: "Webhook-ul Stripe nu este configurat. Seteaza STRIPE_WEBHOOK_SECRET in backend."
    });
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({ message: "Lipseste semnatura Stripe." });
  }

  let event;

  try {
    event = getStripeWebhookClient().webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
  } catch {
    return res.status(400).json({ message: "Semnatura Stripe nu este valida." });
  }

  if (event.type === "checkout.session.completed") {
    await fulfillPromotionCheckoutSession(event.data.object);
  }

  return res.json({ received: true });
}

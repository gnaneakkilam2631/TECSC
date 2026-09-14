import dotenv from "dotenv";
dotenv.config();

// Notifications are optional: if Twilio credentials aren't set in .env,
// these functions just log a note and do nothing — the rest of the app
// works fine either way.
const enabled = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

let client = null;
if (enabled) {
  const twilio = await import("twilio");
  client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function send(to, body, channel) {
  if (!enabled || !to) return;
  const from = channel === "whatsapp" ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` : process.env.TWILIO_SMS_FROM;
  const toFormatted = channel === "whatsapp" ? `whatsapp:${to}` : to;
  try {
    await client.messages.create({ from, to: toFormatted, body });
  } catch (e) {
    console.error(`Failed to send ${channel} message:`, e.message);
  }
}

export async function notifyCustomerRepairReady(phone, customerName, device) {
  if (!phone) return;
  const body = `Hi ${customerName}, your ${device} is ready for pickup at TECSC. Thank you!`;
  await send(phone, body, "whatsapp");
}

export async function notifyAdminLowStock(itemName, qtyLeft) {
  const adminPhone = process.env.ADMIN_ALERT_PHONE;
  if (!adminPhone) return;
  await send(adminPhone, `TECSC stock alert: "${itemName}" is low — only ${qtyLeft} left.`, "whatsapp");
}

export async function notifyAdminStaffAbsent(staffName, date) {
  const adminPhone = process.env.ADMIN_ALERT_PHONE;
  if (!adminPhone) return;
  await send(adminPhone, `TECSC attendance: ${staffName} was marked absent on ${date}.`, "whatsapp");
}
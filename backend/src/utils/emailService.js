import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

let transporter;
if (user && pass) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendBookingEmail(userIdOrEmail, reservation) {
  // For now: we accept either an email string or userId.
  // In real usage, fetch user's email from DB. Here we assume it's an email.
  const to = typeof userIdOrEmail === "string" ? userIdOrEmail : null;

  if (!transporter || !to) {
    // transporter not configured or email not available — skip gracefully
    console.log("Email not sent (no transporter or email). Reservation:", reservation);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Reservation ${reservation.status}: Court ${reservation.court_id} (${reservation.date})`,
    text: `Your reservation is ${reservation.status}. Details:\nCourt: ${reservation.court_id}\nDate: ${reservation.date}\nTime: ${reservation.start_time} - ${reservation.end_time}`,
  };

  await transporter.sendMail(mailOptions);
}

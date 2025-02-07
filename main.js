import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import { createClient } from "redis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = createClient({
  url:process.env.REDIS_URL
});

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to process email queue
async function processEmailQueue() {
  try {
    const email = await client.lPop("emailQueue");

    if (!email) {
      return { success: false, message: "No emails in queue." };
    }

    console.log(`Sending email to: ${email}`);

    const mailOptions = {
      from: `jwoc.official.2025@gmail.com`,
      to: email,
      subject: "Urgent: Complete the Mentor Form to Confirm Your Assignment",
      text: `Dear Mentor,

We hope you're doing well!

To proceed with your mentor assignment, please fill out this Google Form as soon as possible: https://docs.google.com/forms/d/e/1FAIpQLSfKXaggTIsDDqKsNSqTc-1rOlcRQmjYK5J2IUOWBQgfP0NrcA/viewform?usp=sharing.

Without this, we won’t be able to assign you as a mentor. If you have any questions, feel free to reach out.

Thank you for your time and support!

Best regards,
JWoC Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);

    return { success: true, message: `Email sent successfully to ${email}` };
  } catch (error) {
    console.error("Error processing email queue:", error);
    return { success: false, message: "Failed to send email." };
  }
}

// HTTP endpoint to trigger email sending
app.post("/send-email", async (req, res) => {
  const result = await processEmailQueue();
  res.json(result);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

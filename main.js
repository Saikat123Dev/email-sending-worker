import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createClient } from "redis";

dotenv.config();

// Initialize Redis client
const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.error("Redis Client Error:", err));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to process email queue continuously
async function processEmailQueue() {
  console.log("🚀 Email worker started...");
  while (true) {
    try {
      const email = await client.lPop("emailQueue"); // Fetch and remove the oldest email

      if (!email) {
        console.log("📭 No emails in queue. Waiting...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
        continue;
      }

      console.log(`📧 Sending email to: ${email}`);

      const mailOptions = {
        from: `JWoC Team <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Urgent: Complete the Mentor Form to Confirm Your Assignment",
        text: `Dear Mentor,

I hope you're doing well!

To proceed with your mentor assignment, please complete the following Google Form as soon as possible:

https://docs.google.com/forms/d/e/1FAIpQLSfKXaggTIsDDqKsNSqTc-1rOlcRQmjYK5J2IUOWBQgfP0NrcA/viewform?usp=sharing

🔹 Important Note: We have noticed that some submissions contain incorrect or incomplete information. Please ensure that you carefully review your responses before submitting the form. In case you have already submitted incorrect details, kindly fill out the form again with the correct information.

Your accurate submission is essential for us to assign you as a mentor. If you have already filled out the form correctly, please disregard this message.

For any questions or clarifications, feel free to reach out. We truly appreciate your time and support in making this program a success!

Best regards,
JWoC Team`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${email}`);

    } catch (error) {
      console.error("❌ Error processing email queue:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Avoid rapid failures
    }
  }
}

// Start Redis and run the worker
async function startWorker() {
  try {
    await client.connect();
    console.log("🔗 Connected to Redis.");
    await processEmailQueue();
  } catch (err) {
    console.error("❌ Failed to start worker:", err);
  }
}

startWorker();

// Graceful shutdown on exit
process.on("SIGINT", async () => {
  console.log("⚠️ Shutting down worker...");
  await client.quit();
  process.exit(0);
});

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
        subject: "🚀 JWoC Coding Phase 1 Begins on 10th February 2025 – Join Our Official Discord Channel",
        text: `Dear Participant,

We are pleased to inform you that Coding Phase 1 of JWoC is scheduled to commence on 10th February 2025. As we embark on this exciting journey, we encourage you to join our official Discord channel to stay informed, connect with mentors, and access all necessary resources.

📌 Join our official Discord channel here:https://discord.gg/VW83TAydPx

Why should you join?

    Receive important updates and announcements in real time
    Engage with mentors and fellow participants
    Seek guidance and resolve queries promptly
    Participate in discussions, learning sessions, and community activities

Your active participation will be instrumental in making the most of this opportunity. Should you have any questions, please feel free to reach out.

We look forward to your enthusiastic involvement!

Best Regards,
JWoC Team
`,
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

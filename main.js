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

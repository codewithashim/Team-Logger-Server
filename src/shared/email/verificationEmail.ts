import config from "../../config";
import MailUtil from "../../utils/mail.util";



class VerificationEmailService {
  static async sendVerificationEmail(to: string, link: string) {
    const mailOptions = {
      from: `Team Logger <${config.google.appUser}>`,
      to,
      subject: "Email Verification",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .container {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 600px;
          }
          h1 {
            color: #333333;
          }
          p {
            color: #555555;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            color: white;
            background-color: #007BFF;
            border-radius: 5px;
            text-decoration: none;
          }
          a:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Email Verification</h1>
          <p>Please click the link below to verify your email:</p>
          <a style="color: white" href="${link}">Verify Email</a>
          <p>If you did not request email verification, please ignore this email or contact support if you have questions.</p>
        </div>
      </body>
      </html>
    `,
    };
    const info = await MailUtil.sendMail(mailOptions);
    return info;
  }
}

export default VerificationEmailService;

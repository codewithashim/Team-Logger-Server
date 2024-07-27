import nodemailer from "nodemailer";
import config from "../config";

class MailUtil {
  static createTransporter() {
    return nodemailer.createTransport({
      service: "gmail",
      secure: true,
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: config.google.appUser,
        pass: config.google.appPass,
      },
    });
  }

  static async sendMail(mailOptions: nodemailer.SendMailOptions) {
    const transporter = this.createTransporter();
    return transporter.sendMail(mailOptions);
  }
}

export default MailUtil;

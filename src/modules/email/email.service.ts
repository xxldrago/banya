"use strict";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  pool: boolean;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(to: string, template: EmailTemplate, options?: {
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    priority?: "high" | "normal" | "low";
  }): Promise<any> {
    // TODO: Implement real email sending using nodemailer or SendGrid
    console.log("[EMAIL]", {
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      options,
    });
    
    return {
      accepted: [to],
      rejected: [],
      response: "Mock email sent",
    };
  }

  async sendBookingConfirmation(userEmail: string, bookingDetails: any): Promise<any> {
    const template: EmailTemplate = {
      subject: `Подтверждение бронирования №${bookingDetails.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">Подтверждение бронирования</h2>
          
          <p>Здравствуйте, ${bookingDetails.user?.firstName || "клиент"}</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Детали бронирования</h3>
            <p><strong>Номер брони:</strong> ${bookingDetails.id}</p>
            <p><strong>Объект:</strong> ${bookingDetails.venue?.title}</p>
            <p><strong>Дата:</strong> ${new Date(bookingDetails.startsAt).toLocaleString("ru-RU")}</p>
            <p><strong>Продолжительность:</strong> ${bookingDetails.endsAt ? Math.round((new Date(bookingDetails.endsAt).getTime() - new Date(bookingDetails.startsAt).getTime()) / (1000 * 60 * 60)) : "N/A"} часов</p>
            <p><strong>Стоимость:</strong> ${bookingDetails.price} ₽</p>
          </div>
          
          <p>Ваше бронирование подтверждено и готово к посещению.</p>
          
          <p>Если у вас есть вопросы, свяжитесь с нами.</p>
          
          <p>С уважением,<br>Команда Banya.Sauna</p>
        </div>
      `,
      text: `
        Подтверждение бронирования №${bookingDetails.id}
        
        Здравствуйте, ${bookingDetails.user?.firstName || "клиент"}
        
        Детали бронирования:
        - Номер брони: ${bookingDetails.id}
        - Объект: ${bookingDetails.venue?.title}
        - Дата: ${new Date(bookingDetails.startsAt).toLocaleString("ru-RU")}
        - Продолжительность: ${bookingDetails.endsAt ? Math.round((new Date(bookingDetails.endsAt).getTime() - new Date(bookingDetails.startsAt).getTime()) / (1000 * 60 * 60)) : "N/A"} часов
        - Стоимость: ${bookingDetails.price} ₽
        
        Ваше бронирование подтверждено и готово к посещению.
        
        Если у вас есть вопросы, свяжитесь с нами.
        
        С уважением,
        Команда Banya.Sauna
      `,
    };

    return await this.sendEmail(userEmail, template, {
      priority: "high",
    });
  }

  async sendPaymentConfirmation(userEmail: string, paymentDetails: any, bookingDetails: any): Promise<any> {
    const template: EmailTemplate = {
      subject: `Платеж №${paymentDetails.id} подтвержден`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">Подтверждение оплаты</h2>
          
          <p>Здравствуйте, ${bookingDetails.user?.firstName || "клиент"}</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Детали платежа</h3>
            <p><strong>Номер платежа:</strong> ${paymentDetails.id}</p>
            <p><strong>Сумма:</strong> ${paymentDetails.amount} ₽</p>
            <p><strong>Статус:</strong> ${paymentDetails.status}</p>
            <p><strong>Дата:</strong> ${new Date(paymentDetails.createdAt).toLocaleString("ru-RU")}</p>
            <p><strong>Бронирование:</strong> ${bookingDetails.id} - ${bookingDetails.venue?.title}</p>
          </div>
          
          <p>Ваш платеж успешно обработан.</p>
          
          <p>С уважением,<br>Команда Banya.Sauna</p>
        </div>
      `,
    };

    return await this.sendEmail(userEmail, template, {
      priority: "high",
    });
  }

  async sendBookingReminder(userEmail: string, bookingDetails: any): Promise<any> {
    const template: EmailTemplate = {
      subject: `Напоминание о бронировании №${bookingDetails.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">Напоминание о бронировании</h2>
          
          <p>Здравствуйте, ${bookingDetails.user?.firstName || "клиент"}</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">Напоминание</h3>
            <p><strong>Бронирование:</strong> ${bookingDetails.id} - ${bookingDetails.venue?.title}</p>
            <p><strong>Дата и время:</strong> ${new Date(bookingDetails.startsAt).toLocaleString("ru-RU")}</p>
            <p><strong>Через:</strong> завтра в ${new Date(bookingDetails.startsAt).toLocaleTimeString("ru-RU")}</p>
          </div>
          
          <p>Не забудьте подготовиться к посещению баньки! 🎉</p>
          
          <p>С уважением,<br>Команда Banya.Sauna</p>
        </div>
      `,
    };

    return await this.sendEmail(userEmail, template, {
      priority: "normal",
    });
  }

  async sendCancellationNotification(userEmail: string, bookingDetails: any): Promise<any> {
    const template: EmailTemplate = {
      subject: `Бронирование №${bookingDetails.id} отменено`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc3545;">Отмена бронирования</h2>
          
          <p>Здравствуйте, ${bookingDetails.user?.firstName || "клиент"}</p>
          
          <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #721c24;">Отменено</h3>
            <p><strong>Бронирование:</strong> ${bookingDetails.id} - ${bookingDetails.venue?.title}</p>
            <p><strong>Дата:</strong> ${new Date(bookingDetails.startsAt).toLocaleString("ru-RU")}</p>
            <p><strong>Причина:</strong> ${bookingDetails.cancellationReason || "Нет причины"}</p>
          </div>
          
          <p>Ваше бронирование было отменено.</p>
          
          <p>С уважением,<br>Команда Banya.Sauna</p>
        </div>
      `,
    };

    return await this.sendEmail(userEmail, template, {
      priority: "normal",
    });
  }

  async sendReviewRequest(userEmail: string, bookingDetails: any): Promise<any> {
    const template: EmailTemplate = {
      subject: `Оставьте отзыв о вашем посещении`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">Оставьте отзыв</h2>
          
          <p>Здравствуйте, ${bookingDetails.user?.firstName || "клиент"}</p>
          
          <p>Мы надеемся, что ваше посещение баньки прошло замечательно! 🎉</p>
          
          <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">Ваше бронирование</h3>
            <p><strong>Дата посещения:</strong> ${new Date(bookingDetails.startsAt).toLocaleString("ru-RU")}</p>
            <p><strong>Объект:</strong> ${bookingDetails.venue?.title}</p>
          </div>
          
          <p>Оставьте отзыв о качестве обслуживания, комфорте и вашем опыте. Ваш отзыв поможет другим клиентам сделать лучший выбор!</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/reviews" 
             style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
            Оставить отзыв
          </a>
          
          <p>С уважением,<br>Команда Banya.Sauna</p>
        </div>
      `,
    };

    return await this.sendEmail(userEmail, template, {
      priority: "low",
    });
  }

  async getEmailStats(): Promise<any> {
    return {
      totalSent: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
    };
  }
}

export function createEmailService(config: EmailConfig): EmailService {
  return new EmailService(config);
}
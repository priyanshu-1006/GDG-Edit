import { Resend } from 'resend';
import EmailLog from '../models/EmailLog.js';
import {
    welcomeTemplate,
    registrationTemplate,
    qualificationTemplate,
    notificationTemplate
} from '../utils/emailTemplates.js';

class EmailService {
    constructor() {
        this.apiKey = process.env.RESEND_API_KEY;

        console.log('📧 Email Service Initializing...');
        console.log('   API Key present:', !!this.apiKey);
        console.log('   API Key prefix:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'N/A');

        // Check if API key is the placeholder or missing
        if (!this.apiKey || this.apiKey.includes('placeholder')) {
            console.warn('⚠️ Resend API Key is missing or invalid. Emails will be logged to console only.');
            this.resend = null;
        } else {
            console.log('✅ Resend API Key loaded, initializing Resend client...');
            this.resend = new Resend(this.apiKey);
        }

        this.fromEmail = 'support@gdg.mmmut.app';
        this.fromName = 'Google Developers Group On Campus MMMUT Gorakhpur';
        console.log('   From:', `${this.fromName} <${this.fromEmail}>`);
    }

    /**
     * Internal helper to send email via Resend or log if dev mode
     */
    async _send({ to, subject, html, type = 'other', metadata = {} }) {
        let status = 'sent';
        let messageId = null;
        let errorMsg = null;

        if (!this.resend) {
            console.log('📧 [MOCK EMAIL] To:', to);
            console.log('   Subject:', subject);
            console.log('   Content Preview:', html.substring(0, 100) + '...');
            messageId = 'mock_id_' + Date.now();
        } else {
            try {
                const data = await this.resend.emails.send({
                    from: `${this.fromName} <${this.fromEmail}>`,
                    to,
                    subject,
                    html,
                });
                console.log(`✅ Email sent to ${to}: ${data.data?.id}`);
                messageId = data.data?.id;
            } catch (error) {
                console.error(`❌ Error sending email to ${to}:`);
                console.error('   Error name:', error.name);
                console.error('   Error message:', error.message);
                if (error.statusCode) console.error('   Status code:', error.statusCode);
                if (error.response) console.error('   Response:', JSON.stringify(error.response));
                status = 'failed';
                errorMsg = error.message;
            }
        }

        // Log to Database
        try {
            await EmailLog.create({
                recipient: to,
                subject,
                status,
                messageId,
                error: errorMsg,
                type,
                metadata,
                sentAt: new Date()
            });
        } catch (logError) {
            console.error('Failed to save email log:', logError);
        }

        if (status === 'failed') {
            throw new Error(errorMsg || 'Failed to send email');
        }

        return { id: messageId };
    }

    /**
     * Send Welcome Email to new user
     */
    async sendWelcomeEmail(user) {
        const html = welcomeTemplate(user.name);
        return this._send({
            to: user.email,
            subject: 'Welcome to GDG MMMUT! 🚀',
            html,
            type: 'welcome'
        });
    }

    /**
     * Send Registration Confirmation
     */
    async sendRegistrationConfirmation(user, event, registrationId = null) {
        const html = registrationTemplate(
            user.name,
            event.name || event.title,
            event.startDate || event.date,
            registrationId
        );

        return this._send({
            to: user.email,
            subject: `Registration Confirmed: ${event.name || event.title} ✅`,
            html,
            type: 'registration',
            metadata: { eventId: event._id?.toString() }
        });
    }

    /**
     * Send Qualification Email
     */
    async sendQualificationEmail(user, eventName, roundName, nextRoundDetails) {
        const html = qualificationTemplate(user.name, eventName, roundName, nextRoundDetails);

        return this._send({
            to: user.email,
            subject: `Congratulations! You Qualified for ${roundName} 🏆`,
            html,
            type: 'qualification'
        });
    }

    /**
     * Send General Notification / Bulk Email
     */
    async sendNotification(user, title, message, actionUrl, actionText) {
        const html = notificationTemplate(title, message, { actionUrl, actionText });

        return this._send({
            to: user.email,
            subject: title,
            html,
            type: 'general'
        });
    }

    /**
     * Send Bulk Emails with rate limiting/chunking
     * @param {Array} recipients - Array of user objects { email, name }
     * @param {Object} content - { title, message, ... }
     */
    async sendBulkEmails(recipients, content) {
        console.log(`🚀 Starting bulk email send to ${recipients.length} recipients`);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process in chunks of 20 to avoid rate limits
        const CHUNK_SIZE = 20;

        for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
            const chunk = recipients.slice(i, i + CHUNK_SIZE);
            const promises = chunk.map(user => {
                // Map content type to specific template function or generic
                if (content.type === 'qualification') {
                    return this.sendQualificationEmail(user, content.eventName, content.roundName, content.details)
                        .then(() => ({ success: true }))
                        .catch(err => ({ success: false, email: user.email, error: err.message }));
                } else {
                    return this.sendNotification(user, content.title, content.message, content.actionUrl, content.actionText)
                        .then(() => ({ success: true }))
                        .catch(err => ({ success: false, email: user.email, error: err.message }));
                }
            });

            const chunkResults = await Promise.all(promises);

            chunkResults.forEach(r => {
                if (r.success) results.success++;
                else {
                    results.failed++;
                    results.errors.push(r);
                }
            });

            // Small delay between chunks
            if (i + CHUNK_SIZE < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`🏁 Bulk email finished. Success: ${results.success}, Failed: ${results.failed}`);
        return results;
    }
}

export default new EmailService();

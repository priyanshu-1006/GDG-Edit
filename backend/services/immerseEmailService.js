import { Resend } from 'resend';
import ImmerseEmailLog from '../models/ImmerseEmailLog.js';
import ImmerseContact from '../models/ImmerseContact.js';
import ImmerseEmailTemplate from '../models/ImmerseEmailTemplate.js';
import { transporter } from '../utils/unifiedEmail.js';

class ImmerseEmailService {
    constructor() {
        // Use the global Resend API key. Trim whitespace to prevent Vercel pasted errors.
        this.apiKey = process.env.RESEND_API_KEY?.trim();
        this.domain = 'gdg.mmmut.app';

        console.log('📧 Immerse Email Service Initializing...');
        console.log('   API Key present:', !!this.apiKey);
        console.log('   Domain:', this.domain);

        if (!this.apiKey) {
            console.warn('⚠️ Immerse Resend API Key is missing. Emails will be logged to console only.');
            this.resend = null;
        } else {
            console.log('✅ Immerse Resend API Key loaded, initializing client...');
            this.resend = new Resend(this.apiKey);
        }

        this.fromEmail = `team@${this.domain}`;
        this.fromName = 'IMMERSE 2026 - MMMUT';
        console.log('   From:', `${this.fromName} <${this.fromEmail}>`);
    }

    /**
     * Replace template variables with actual values
     */
    replaceVariables(template, variables) {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value || '');
        }
        return result;
    }

    /**
     * Internal helper to send email via Resend
     */
    async _send({ 
        to, 
        subject, 
        html, 
        category = 'general', 
        recipientName = null,
        recipientType = 'other',
        templateId = null,
        contactId = null,
        campaignId = null,
        campaignName = null,
        sentBy = null,
        metadata = {} 
    }) {
        let status = 'sent';
        let messageId = null;
        let errorMsg = null;

        if (!this.resend) {
            console.log('📧 [MOCK IMMERSE EMAIL] To:', to);
            console.log('   Subject:', subject);
            console.log('   Content Preview:', html.substring(0, 100) + '...');
            messageId = 'mock_immerse_' + Date.now();
        } else {
            try {
                const data = await this.resend.emails.send({
                    from: `${this.fromName} <${this.fromEmail}>`,
                    to,
                    subject,
                    html,
                });
                
                if (data.error) {
                    throw new Error(data.error.message || 'Resend returned an error response');
                }
                
                console.log(`✅ Immerse email sent via Resend to ${to}: ${data.data?.id}`);
                messageId = data.data?.id;
            } catch (error) {
                console.warn(`⚠️ Resend failed for Immerse email to ${to}, falling back to Nodemailer:`, error.message);
                try {
                    const info = await transporter.sendMail({
                        from: `${this.fromName} <${this.fromEmail}>`,
                        to,
                        subject,
                        html,
                    });
                    console.log(`✅ Immerse email sent via Nodemailer to ${to}: ${info.messageId}`);
                    messageId = info.messageId;
                } catch (fallbackError) {
                    console.error(`❌ Both Resend and Nodemailer failed for Immerse email to ${to}:`, fallbackError.message);
                    status = 'failed';
                    errorMsg = `Resend: ${error.message} | Nodemailer: ${fallbackError.message}`;
                }
            }
        }

        // Log to Database
        try {
            await ImmerseEmailLog.create({
                recipient: to,
                recipientName,
                recipientType,
                subject,
                htmlContent: html,
                status,
                messageId,
                error: errorMsg,
                category,
                templateUsed: templateId,
                contactRef: contactId,
                campaignId,
                campaignName,
                sentBy,
                metadata,
                sentAt: new Date()
            });

            // Update contact's email tracking if contactId provided
            if (contactId) {
                await ImmerseContact.findByIdAndUpdate(contactId, {
                    $inc: { emailsSent: 1 },
                    lastEmailSent: new Date()
                });
            }

            // Update template usage count
            if (templateId) {
                await ImmerseEmailTemplate.findByIdAndUpdate(templateId, {
                    $inc: { usageCount: 1 },
                    lastUsed: new Date()
                });
            }
        } catch (logError) {
            console.error('Failed to save Immerse email log:', logError);
        }

        if (status === 'failed') {
            throw new Error(errorMsg || 'Failed to send email');
        }

        return { id: messageId, status };
    }

    /**
     * Send single email
     */
    async sendEmail({ to, subject, html, category, recipientName, recipientType, sentBy, metadata }) {
        return this._send({
            to,
            subject,
            html,
            category,
            recipientName,
            recipientType,
            sentBy,
            metadata
        });
    }

    /**
     * Send email using template
     */
    async sendWithTemplate({ templateId, to, variables, recipientName, recipientType, contactId, sentBy }) {
        const template = await ImmerseEmailTemplate.findById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const subject = this.replaceVariables(template.subject, variables);
        const html = this.replaceVariables(template.htmlContent, variables);

        return this._send({
            to,
            subject,
            html,
            category: template.category,
            recipientName,
            recipientType,
            templateId,
            contactId,
            sentBy
        });
    }

    /**
     * Send bulk emails to multiple contacts
     */
    async sendBulkEmails({ 
        contacts, 
        subject, 
        html, 
        category = 'bulk',
        campaignName,
        sentBy,
        templateId = null,
        variables = {} 
    }) {
        const campaignId = `campaign_${Date.now()}`;
        const results = {
            success: [],
            failed: [],
            campaignId
        };

        for (const contact of contacts) {
            try {
                // Merge contact-specific variables
                const contactVariables = {
                    ...variables,
                    name: contact.name,
                    email: contact.email,
                    companyName: contact.companyName || '',
                    college: contact.college || '',
                    designation: contact.designation || ''
                };

                const finalSubject = this.replaceVariables(subject, contactVariables);
                const finalHtml = this.replaceVariables(html, contactVariables);

                await this._send({
                    to: contact.email,
                    subject: finalSubject,
                    html: finalHtml,
                    category,
                    recipientName: contact.name,
                    recipientType: contact.type,
                    templateId,
                    contactId: contact._id,
                    campaignId,
                    campaignName,
                    sentBy
                });

                results.success.push({
                    email: contact.email,
                    name: contact.name
                });

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.failed.push({
                    email: contact.email,
                    name: contact.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Send sponsor outreach email
     */
    async sendSponsorOutreach({ contact, subject, html, sentBy }) {
        return this._send({
            to: contact.email,
            subject,
            html,
            category: 'sponsor_outreach',
            recipientName: contact.name,
            recipientType: 'company',
            contactId: contact._id,
            sentBy
        });
    }

    /**
     * Send student notification
     */
    async sendStudentNotification({ contact, subject, html, sentBy }) {
        return this._send({
            to: contact.email,
            subject,
            html,
            category: 'student_notification',
            recipientName: contact.name,
            recipientType: 'student',
            contactId: contact._id,
            sentBy
        });
    }

    /**
     * Get email statistics
     */
    async getEmailStats(startDate = null, endDate = null) {
        const matchStage = {};
        if (startDate && endDate) {
            matchStage.sentAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await ImmerseEmailLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    sent: {
                        $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
                    },
                    delivered: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    opened: {
                        $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] }
                    }
                }
            }
        ]);

        const categoryStats = await ImmerseEmailLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            overview: stats[0] || { total: 0, sent: 0, delivered: 0, failed: 0, opened: 0 },
            byCategory: categoryStats
        };
    }
}

// Export singleton instance
const immerseEmailService = new ImmerseEmailService();
export default immerseEmailService;

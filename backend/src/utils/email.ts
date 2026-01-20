// Basic email service implementation
// In production, integrate with SendGrid, AWS SES, or similar service

interface EmailData {
  to: string | string[];
  subject: string;
  template: string;
  data?: Record<string, any>;
}

export const sendEmail = async (emailData: EmailData): Promise<void> => {
  console.log('Email service called:', emailData);

  // TODO: Implement actual email service
  // For now, just log the email that would be sent

  const emailContent = generateEmailContent(emailData.template, emailData.data);

  console.log(`
    ==================== EMAIL ===================
    To: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}
    Subject: ${emailData.subject}
    Template: ${emailData.template}
    
    ${emailContent}
    ==========================================
  `);
};

const generateEmailContent = (template: string, data?: Record<string, any>): string => {
  const templates: Record<string, string> = {
    'new-application': `
      New Application Received!
      
      Order: ${data?.orderTitle}
      Editor: ${data?.editorName}
      Email: ${data?.editorEmail}
      Deposit Amount: ₹${data?.depositAmount}
      Applied At: ${data?.appliedAt}
      
      View all applications in your dashboard: ${data?.dashboardUrl}
    `,

    'deposit-timeout': `
      Order: ${data?.orderTitle}
      
      Your application has been cancelled because the deposit was not provided within ${data?.hours} hours.
      
      Please apply again when you're ready to complete the deposit.
    `,

    'order-cancelled-no-apps': `
      Order: ${data?.orderTitle}
      
      Your order has been automatically cancelled because no editors applied within 72 hours.
      
      You can create a new order at any time.
    `,

    'editor-cancelled-no-work': `
      Order: ${data?.orderTitle}
      
      Your assignment has been cancelled because work was not started within 24 hours.
      
      Your deposit has been forfeited.
    `,

    'deadline-passed': `
      Order: ${data?.orderTitle}
      
      This order has been automatically cancelled because the deadline passed without submission.
      
      The creator has been refunded.
    `,

    'communication-gap': `
      Order: ${data?.orderTitle}
      
      This order has had no activity for ${data?.daysSinceActivity} days.
      
      Please communicate to move this order forward.
    `,

    'revision-limit-exceeded': `
      Order: ${data?.orderTitle}
      
      Maximum revisions (2) have been used.
      
      Additional revisions require a paid upgrade.
    `,

    'selection-expired': `
      Order: ${data?.orderTitle}

      Your job offer has expired because the security deposit was not paid within 12 hours.
      The order has been reopened for other editors.
    `,

    'selection-expired-creator': `
      Order: ${data?.orderTitle}

      Review: The selected editor (${data?.editorName}) failed to pay the security deposit within 12 hours.
      The order has been automatically reopened for new applications.
    `,
    'job-assigned': `
      CONGRATULATIONS! YOU HAVE BEEN HIRED! 
      
      Order: ${data?.orderTitle}
      Creator: ${data?.creatorName}
      Amount: ₹${data?.amount}
      Deadline: ${data?.deadline}
      
      You operate on strict timelines. 
      Please go to your dashboard and start the work immediately:
      ${data?.dashboardUrl}
      
      Important:
      1. Review the brief and raw files.
      2. Communicate with the creator if you have questions.
      3. Submit your first draft before the deadline.
    `
  };

  return templates[template] || 'Email template not found';
};

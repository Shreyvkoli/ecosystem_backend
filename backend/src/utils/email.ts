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
    `
  };
  
  return templates[template] || 'Email template not found';
};

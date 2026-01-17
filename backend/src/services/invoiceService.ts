
import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    clientName: string;
    clientEmail: string;
    items: { description: string; amount: number }[];
    total: number;
    currency: string;
}

export const generateInvoice = (data: InvoiceData, res: Response) => {
    const doc = new PDFDocument({ margin: 50 });

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${data.invoiceNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc
        .fontSize(20)
        .text('INVOICE', 50, 50)
        .fontSize(10)
        .text('Cutflow Inc.', 200, 50, { align: 'right' })
        .text('Support: support@cutflow.com', 200, 65, { align: 'right' })
        .moveDown();

    // Invoice Info
    doc
        .fontSize(10)
        .text(`Invoice Number: ${data.invoiceNumber}`, 50, 100)
        .text(`Date: ${data.date.toLocaleDateString()}`, 50, 115)
        .moveDown();

    // Bill To
    doc
        .text(`Bill To:`, 50, 150)
        .font('Helvetica-Bold')
        .text(data.clientName, 50, 165)
        .font('Helvetica')
        .text(data.clientEmail, 50, 180)
        .moveDown();

    // Table Header
    const tableTop = 230;
    doc
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Amount', 400, tableTop, { align: 'right' });

    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

    // Items
    let position = tableTop + 30;
    data.items.forEach(item => {
        doc
            .font('Helvetica')
            .text(item.description, 50, position)
            .text(`${data.currency} ${item.amount.toFixed(2)}`, 400, position, { align: 'right' });
        position += 20;
    });

    // Total
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, position + 10)
        .lineTo(550, position + 10)
        .stroke();

    doc
        .font('Helvetica-Bold')
        .text('Total:', 300, position + 25, { align: 'right', width: 100 }) // adjusted x
        .text(`${data.currency} ${data.total.toFixed(2)}`, 400, position + 25, { align: 'right' });

    // Footer
    doc
        .fontSize(10)
        .text(
            'Thank you for your business.',
            50,
            700,
            { align: 'center', width: 500 }
        );

    doc.end();
};

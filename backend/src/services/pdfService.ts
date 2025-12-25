import PDFDocument from 'pdfkit';
import { Submission } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Racing theme colors
const COLORS = {
  primary: '#E31837',    // PSL Red
  secondary: '#1a1a1a',  // Dark gray/black
  text: '#333333',       // Dark text
  lightGray: '#666666',  // Light gray for values
  accent: '#f5f5f5',     // Light background
};

export function generateSubmissionPDF(submission: Submission, userName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: `PSL Karting Setup - ${userName}`,
        Author: 'PSL Karting',
        Subject: 'Kart Setup Sheet',
      }
    });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    const pageWidth = doc.page.width - 80; // Account for margins

    // Racing stripe at top
    doc.rect(0, 0, doc.page.width, 8).fill(COLORS.primary);

    // Logo and Header
    const logoPath = path.join(__dirname, '../../assets/psl-logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 20, { width: 120 });
    }

    // Title section
    doc.fontSize(24)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text('SETUP SHEET', 180, 35, { align: 'left' });

    doc.fontSize(10)
      .fillColor(COLORS.lightGray)
      .font('Helvetica')
      .text(`Generated: ${new Date().toLocaleString()}`, 180, 65);

    // Driver info bar
    doc.rect(40, 95, pageWidth, 35).fill(COLORS.secondary);
    doc.fontSize(14)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(userName.toUpperCase(), 55, 105);
    doc.fontSize(10)
      .fillColor('#cccccc')
      .font('Helvetica')
      .text(`${submission.sessionType} | ${submission.track}`, 55, 120);

    // Date on the right
    doc.fontSize(10)
      .fillColor('#ffffff')
      .text(new Date(submission.createdAt).toLocaleDateString('en-GB'), 40, 105, {
        width: pageWidth,
        align: 'right'
      });

    let yPos = 145;

    // Helper function for section headers
    const drawSectionHeader = (title: string, y: number): number => {
      doc.rect(40, y, pageWidth, 25).fill(COLORS.primary);
      doc.fontSize(12)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text(title.toUpperCase(), 55, y + 7);
      return y + 30;
    };

    // Helper function for data rows (two columns)
    const drawDataRow = (label1: string, value1: string, label2?: string, value2?: string, y?: number): number => {
      const currentY = y || yPos;
      const colWidth = pageWidth / 2 - 10;

      // First column
      doc.fontSize(8)
        .fillColor(COLORS.text)
        .font('Helvetica-Bold')
        .text(label1.toUpperCase(), 55, currentY);
      doc.fontSize(11)
        .fillColor(COLORS.lightGray)
        .font('Helvetica')
        .text(value1 || '-', 55, currentY + 10);

      // Second column (if provided)
      if (label2 && value2 !== undefined) {
        doc.fontSize(8)
          .fillColor(COLORS.text)
          .font('Helvetica-Bold')
          .text(label2.toUpperCase(), 55 + colWidth, currentY);
        doc.fontSize(11)
          .fillColor(COLORS.lightGray)
          .font('Helvetica')
          .text(value2 || '-', 55 + colWidth, currentY + 10);
      }

      return currentY + 28;
    };

    // General Information Section
    yPos = drawSectionHeader('General Information', yPos);
    yPos = drawDataRow('Championship', submission.championship, 'Division', submission.division, yPos);
    yPos = drawDataRow('Class Code', submission.classCode, 'Session', submission.sessionType, yPos);
    yPos += 5;

    // Engine Setup Section
    yPos = drawSectionHeader('Engine Setup', yPos);
    yPos = drawDataRow('Engine Number', submission.engineNumber || '-', 'Carburator', submission.carburatorNumber || '-', yPos);
    if (submission.gearRatio) {
      yPos = drawDataRow('Gear Ratio', submission.gearRatio, '', '', yPos);
    } else {
      yPos = drawDataRow('Drive Sprocket', submission.driveSprocket || '-', 'Driven Sprocket', submission.drivenSprocket || '-', yPos);
    }
    yPos += 5;

    // Tyres Section
    yPos = drawSectionHeader('Tyres Data', yPos);
    yPos = drawDataRow('Tyre Model', submission.tyreModel, 'Tyre Age', submission.tyreAge, yPos);
    yPos = drawDataRow('Cold Pressure', submission.tyreColdPressure, '', '', yPos);
    yPos += 5;

    // Kart Setup Section
    yPos = drawSectionHeader('Kart Setup', yPos);
    yPos = drawDataRow('Chassis', submission.chassis, 'Axle', submission.axle, yPos);
    yPos = drawDataRow('Rear Hubs', `${submission.rearHubsMaterial} - ${submission.rearHubsLength}`, 'Front Hubs', submission.frontHubsMaterial || '-', yPos);
    yPos = drawDataRow('Front Height', submission.frontHeight, 'Back Height', submission.backHeight, yPos);
    yPos = drawDataRow('Front Bar', submission.frontBar, 'Spindle', submission.spindle, yPos);
    yPos = drawDataRow('Caster', submission.caster, 'Seat Position', `${submission.seatPosition} cm`, yPos);
    yPos += 5;

    // Conclusion Section (if applicable)
    if (submission.lapTime || submission.observation) {
      yPos = drawSectionHeader('Session Results', yPos);
      if (submission.lapTime) {
        yPos = drawDataRow('Lap Time', submission.lapTime, '', '', yPos);
      }
      if (submission.observation) {
        doc.fontSize(8)
          .fillColor(COLORS.text)
          .font('Helvetica-Bold')
          .text('NOTES', 55, yPos);
        doc.fontSize(10)
          .fillColor(COLORS.lightGray)
          .font('Helvetica')
          .text(submission.observation, 55, yPos + 12, { width: pageWidth - 30 });
      }
    }

    // Footer with racing stripe
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, doc.page.width, 8).fill(COLORS.primary);
    doc.fontSize(8)
      .fillColor(COLORS.lightGray)
      .text('Powered by Undercut Academy', 40, footerY - 15, {
        width: pageWidth,
        align: 'center'
      });

    doc.end();
  });
}

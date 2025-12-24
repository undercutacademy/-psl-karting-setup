import PDFDocument from 'pdfkit';
import { Submission } from '@prisma/client';

export function generateSubmissionPDF(submission: Submission, userName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('PSL Karting Setup', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Driver: ${userName}`, { align: 'center' });
    doc.text(`Date: ${new Date(submission.createdAt).toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // General Information
    doc.fontSize(16).text('General Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Session Type: ${submission.sessionType}`);
    doc.text(`Class Code: ${submission.classCode}`);
    doc.text(`Track: ${submission.track}`);
    doc.text(`Championship: ${submission.championship}`);
    doc.text(`Division: ${submission.division}`);
    doc.moveDown();

    // Engine Setup
    doc.fontSize(16).text('Engine Setup', { underline: true });
    doc.fontSize(12);
    doc.text(`Engine Number: ${submission.engineNumber}`);
    if (submission.gearRatio) {
      doc.text(`Gear Ratio: ${submission.gearRatio}`);
    }
    doc.text(`Drive Sprocket: ${submission.driveSprocket}`);
    doc.text(`Driven Sprocket: ${submission.drivenSprocket}`);
    doc.text(`Carburator Number: ${submission.carburatorNumber}`);
    doc.moveDown();

    // Tyres Data
    doc.fontSize(16).text('Tyres Data', { underline: true });
    doc.fontSize(12);
    doc.text(`Tyre Model: ${submission.tyreModel}`);
    doc.text(`Tyre Age: ${submission.tyreAge}`);
    doc.text(`Tyre Cold Pressure: ${submission.tyreColdPressure}`);
    doc.moveDown();

    // Kart Setup
    doc.fontSize(16).text('Kart Setup', { underline: true });
    doc.fontSize(12);
    doc.text(`Chassis: ${submission.chassis}`);
    doc.text(`Axle: ${submission.axle}`);
    doc.text(`Rear Hubs Material: ${submission.rearHubsMaterial}`);
    doc.text(`Rear Hubs Length: ${submission.rearHubsLength}`);
    doc.text(`Front Height: ${submission.frontHeight}`);
    doc.text(`Back Height: ${submission.backHeight}`);
    doc.text(`Front Hubs Material: ${submission.frontHubsMaterial}`);
    doc.text(`Front Bar: ${submission.frontBar}`);
    doc.text(`Spindle: ${submission.spindle}`);
    doc.text(`Caster: ${submission.caster}`);
    doc.text(`Seat Position: ${submission.seatPosition} cm`);
    doc.moveDown();

    // Conclusion
    if (submission.lapTime || submission.observation) {
      doc.fontSize(16).text('Conclusion', { underline: true });
      doc.fontSize(12);
      if (submission.lapTime) {
        doc.text(`Lap Time: ${submission.lapTime}`);
      }
      if (submission.observation) {
        doc.text(`Observation: ${submission.observation}`);
      }
    }

    doc.end();
  });
}


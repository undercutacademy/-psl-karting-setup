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

// Track Layout definitions matching the frontend
const TRACK_LAYOUTS: Record<string, { name: string; imageFile: string }[]> = {
  'Interlagos': [
    { name: 'Original', imageFile: '1.webp' },
    { name: 'Layout 2', imageFile: '2.webp' },
    { name: 'Layout 3', imageFile: '3.webp' },
    { name: 'Layout 4', imageFile: '4.webp' },
    { name: 'Reverse', imageFile: '5.webp' },
    { name: 'Layout 6', imageFile: '6.webp' },
    { name: 'Layout 7', imageFile: '7.webp' },
    { name: 'Layout 8', imageFile: '8.webp' },
  ],
};

// Translation maps for PDF section headers
const PDF_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    setupSheet: 'SETUP SHEET',
    generated: 'Generated',
    generalInfo: 'General Information',
    championship: 'Championship',
    division: 'Division',
    classCode: 'Class Code',
    session: 'Session',
    trackLayout: 'Track Layout',
    engineSetup: 'Engine Setup',
    engineNumber: 'Engine Number',
    carburator: 'Carburator',
    gearRatio: 'Gear Ratio',
    driveSprocket: 'Drive Sprocket',
    drivenSprocket: 'Driven Sprocket',
    tyresData: 'Tyres Data',
    tyreModel: 'Tyre Model',
    tyreAge: 'Tyre Age',
    coldPressure: 'Cold Pressure',
    kartSetup: 'Kart Setup',
    chassis: 'Chassis',
    axle: 'Axle',
    rearHubs: 'Rear Hubs',
    frontHubs: 'Front Hubs',
    frontHeight: 'Front Height',
    backHeight: 'Back Height',
    frontBar: 'Front Bar',
    spindle: 'Spindle',
    caster: 'Caster',
    seatPosition: 'Seat Position',
    sessionResults: 'Session Results',
    lapTime: 'Lap Time',
    notes: 'Notes',
    poweredBy: 'Powered by Overcut Academy',
  },
  pt: {
    setupSheet: 'FICHA DE CONFIGURAÇÃO',
    generated: 'Gerado',
    generalInfo: 'Informações Gerais',
    championship: 'Campeonato',
    division: 'Categoria',
    classCode: 'Código da Classe',
    session: 'Sessão',
    trackLayout: 'Traçado da Pista',
    engineSetup: 'Configuração do Motor',
    engineNumber: 'Número do Motor',
    carburator: 'Carburador',
    gearRatio: 'Relação de Marcha',
    driveSprocket: 'Pinhão (Motor)',
    drivenSprocket: 'Coroa (Eixo)',
    tyresData: 'Dados dos Pneus',
    tyreModel: 'Modelo do Pneu',
    tyreAge: 'Uso do Pneu',
    coldPressure: 'Pressão a Frio',
    kartSetup: 'Configuração do Kart',
    chassis: 'Chassi',
    axle: 'Eixo',
    rearHubs: 'Cubos Traseiros',
    frontHubs: 'Cubos Dianteiros',
    frontHeight: 'Altura Dianteira',
    backHeight: 'Altura Traseira',
    frontBar: 'Barra Dianteira',
    spindle: 'Manga de Eixo',
    caster: 'Caster',
    seatPosition: 'Posição do Banco',
    sessionResults: 'Resultados da Sessão',
    lapTime: 'Tempo de Volta',
    notes: 'Notas',
    poweredBy: 'Desenvolvido por Overcut Academy',
  },
  es: {
    setupSheet: 'HOJA DE CONFIGURACIÓN',
    generated: 'Generado',
    generalInfo: 'Información General',
    championship: 'Campeonato',
    division: 'Categoría',
    classCode: 'Código de Clase',
    session: 'Sesión',
    trackLayout: 'Trazado de Pista',
    engineSetup: 'Configuración del Motor',
    engineNumber: 'Número de Motor',
    carburator: 'Carburador',
    gearRatio: 'Relación de Transmisión',
    driveSprocket: 'Piñón (Motor)',
    drivenSprocket: 'Corona (Eje)',
    tyresData: 'Datos de Neumáticos',
    tyreModel: 'Modelo de Neumático',
    tyreAge: 'Uso de Neumático',
    coldPressure: 'Presión en Frío',
    kartSetup: 'Configuración del Kart',
    chassis: 'Chasis',
    axle: 'Eje',
    rearHubs: 'Masas Traseras',
    frontHubs: 'Masas Delanteras',
    frontHeight: 'Altura Delantera',
    backHeight: 'Altura Trasera',
    frontBar: 'Barra Delantera',
    spindle: 'Manguetas',
    caster: 'Caster',
    seatPosition: 'Posición del Asiento',
    sessionResults: 'Resultados de la Sesión',
    lapTime: 'Tiempo de Vuelta',
    notes: 'Notas',
    poweredBy: 'Desarrollado por Overcut Academy',
  },
};

// Find the layout image path for a given track string
function findLayoutImagePath(track: string): string | null {
  for (const [trackName, layouts] of Object.entries(TRACK_LAYOUTS)) {
    if (track.startsWith(trackName)) {
      const layoutName = track.substring(trackName.length).replace(/^ - /, '');
      const layout = layouts.find(l => l.name === layoutName);
      if (layout) {
        // The layout images are stored in the frontend public folder
        const imgPath = path.join(__dirname, '../../assets/layouts/interlagos', layout.imageFile.replace('.webp', '.png'));
        if (fs.existsSync(imgPath)) return imgPath;

        // Also check the frontend public directory
        const frontendPath = path.join(__dirname, '../../../frontend/public/layouts/interlagos', layout.imageFile.replace('.webp', '.png'));
        if (fs.existsSync(frontendPath)) return frontendPath;
      }
    }
  }
  return null;
}

function getLayoutName(track: string): string | null {
  for (const [trackName] of Object.entries(TRACK_LAYOUTS)) {
    if (track.startsWith(trackName)) {
      return track.substring(trackName.length).replace(/^ - /, '');
    }
  }
  return null;
}

export function generateSubmissionPDF(submission: Submission, userName: string, language: string = 'en'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const t = PDF_TRANSLATIONS[language] || PDF_TRANSLATIONS.en;

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: `${t.setupSheet} - ${userName}`,
        Author: 'Overcut Academy',
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
      .text(t.setupSheet, 180, 35, { align: 'left' });

    doc.fontSize(10)
      .fillColor(COLORS.lightGray)
      .font('Helvetica')
      .text(`${t.generated}: ${new Date().toLocaleString()}`, 180, 65);

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
    yPos = drawSectionHeader(t.generalInfo, yPos);
    yPos = drawDataRow(t.championship, submission.championship, t.division, submission.division, yPos);
    yPos = drawDataRow(t.classCode, submission.classCode, t.session, submission.sessionType, yPos);
    yPos += 5;

    // Track Layout Image (if available)
    const layoutImagePath = findLayoutImagePath(submission.track);
    const layoutName = getLayoutName(submission.track);
    if (layoutImagePath && layoutName) {
      yPos = drawSectionHeader(`${t.trackLayout}: ${layoutName}`, yPos);
      try {
        doc.image(layoutImagePath, 40 + (pageWidth - 200) / 2, yPos, { width: 200 });
        yPos += 130; // Image height + margin
      } catch (e) {
        console.error('Failed to embed track layout image in PDF:', e);
      }
      yPos += 5;
    }

    // Engine Setup Section
    yPos = drawSectionHeader(t.engineSetup, yPos);
    yPos = drawDataRow(t.engineNumber, submission.engineNumber || '-', t.carburator, submission.carburatorNumber || '-', yPos);
    if (submission.gearRatio) {
      yPos = drawDataRow(t.gearRatio, submission.gearRatio, '', '', yPos);
    } else {
      yPos = drawDataRow(t.driveSprocket, submission.driveSprocket || '-', t.drivenSprocket, submission.drivenSprocket || '-', yPos);
    }
    yPos += 5;

    // Tyres Section
    yPos = drawSectionHeader(t.tyresData, yPos);
    yPos = drawDataRow(t.tyreModel, submission.tyreModel || '-', t.tyreAge, submission.tyreAge || '-', yPos);
    yPos = drawDataRow(t.coldPressure, submission.tyreColdPressure || '-', '', '', yPos);
    yPos += 5;

    // Kart Setup Section
    yPos = drawSectionHeader(t.kartSetup, yPos);
    yPos = drawDataRow(t.chassis, submission.chassis || '-', t.axle, submission.axle || '-', yPos);
    yPos = drawDataRow(t.rearHubs, `${submission.rearHubsMaterial || '-'} - ${submission.rearHubsLength || '-'}`, t.frontHubs, submission.frontHubsMaterial || '-', yPos);
    yPos = drawDataRow(t.frontHeight, submission.frontHeight || '-', t.backHeight, submission.backHeight || '-', yPos);
    yPos = drawDataRow(t.frontBar, submission.frontBar || '-', t.spindle, submission.spindle || '-', yPos);
    yPos = drawDataRow(t.caster, submission.caster || '-', t.seatPosition, submission.seatPosition ? `${submission.seatPosition} cm` : '-', yPos);
    yPos += 5;

    // Conclusion Section (if applicable)
    if (submission.lapTime || submission.observation) {
      yPos = drawSectionHeader(t.sessionResults, yPos);
      if (submission.lapTime) {
        yPos = drawDataRow(t.lapTime, submission.lapTime, '', '', yPos);
      }
      if (submission.observation) {
        doc.fontSize(8)
          .fillColor(COLORS.text)
          .font('Helvetica-Bold')
          .text(t.notes.toUpperCase(), 55, yPos);
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
      .text(t.poweredBy, 40, footerY - 15, {
        width: pageWidth,
        align: 'center'
      });

    doc.end();
  });
}

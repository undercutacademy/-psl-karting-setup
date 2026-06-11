"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSubmissionPDF = generateSubmissionPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const weather_1 = require("../lib/weather");
// Static theme colors (non-team-specific)
const COLORS = {
    secondary: '#1a1a1a', // Dark gray/black
    text: '#333333', // Dark text
    lightGray: '#666666', // Light gray for values
    accent: '#f5f5f5', // Light background
};
// Track Layout definitions matching the frontend
const TRACK_LAYOUTS = {
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
const PDF_TRANSLATIONS = {
    en: {
        setupSheet: 'SETUP SHEET',
        generated: 'Generated',
        generalInfo: 'General Information',
        temperature: 'Temperature',
        humidity: 'Humidity',
        pressure: 'Pressure',
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
        sparkplugType: 'Sparkplug Type',
        sparkplugGap: 'Sparkplug Gap',
        frontWheelType: 'Front Wheel Type',
        caster: 'Caster',
        seatPosition: 'Seat Position',
        sessionResults: 'Session Results',
        lapTime: 'Lap Time',
        notes: 'Notes',
        dashSummary: 'Dash Summary',
        poweredBy: 'Powered by Overcut Academy',
    },
    pt: {
        setupSheet: 'FICHA DE CONFIGURAÇÃO',
        generated: 'Gerado',
        generalInfo: 'Informações Gerais',
        temperature: 'Temperatura',
        humidity: 'Umidade',
        pressure: 'Pressão',
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
        sparkplugType: 'Tipo de Vela',
        sparkplugGap: 'Abertura da Vela',
        frontWheelType: 'Tipo de Roda Dianteira',
        caster: 'Caster',
        seatPosition: 'Posição do Banco',
        sessionResults: 'Resultados da Sessão',
        lapTime: 'Tempo de Volta',
        notes: 'Notas',
        dashSummary: 'Resumo do Dash',
        poweredBy: 'Desenvolvido por Overcut Academy',
    },
    es: {
        setupSheet: 'HOJA DE CONFIGURACIÓN',
        generated: 'Generado',
        generalInfo: 'Información General',
        temperature: 'Temperatura',
        humidity: 'Humedad',
        pressure: 'Presión',
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
        sparkplugType: 'Tipo de Bujía',
        sparkplugGap: 'Separación de Bujía',
        frontWheelType: 'Tipo de Rueda Delantera',
        caster: 'Caster',
        seatPosition: 'Posición del Asiento',
        sessionResults: 'Resultados de la Sesión',
        lapTime: 'Tiempo de Vuelta',
        notes: 'Notas',
        dashSummary: 'Resumen del Dash',
        poweredBy: 'Desarrollado por Overcut Academy',
    },
};
// Find the layout image path for a given track string
function findLayoutImagePath(track) {
    for (const [trackName, layouts] of Object.entries(TRACK_LAYOUTS)) {
        if (track.startsWith(trackName)) {
            const layoutName = track.substring(trackName.length).replace(/^ - /, '');
            const layout = layouts.find(l => l.name === layoutName);
            if (layout) {
                // The layout images are stored in the frontend public folder
                const imgPath = path_1.default.join(__dirname, '../../assets/layouts/interlagos', layout.imageFile.replace('.webp', '.png'));
                if (fs_1.default.existsSync(imgPath))
                    return imgPath;
                // Also check the frontend public directory
                const frontendPath = path_1.default.join(__dirname, '../../../frontend/public/layouts/interlagos', layout.imageFile.replace('.webp', '.png'));
                if (fs_1.default.existsSync(frontendPath))
                    return frontendPath;
            }
        }
    }
    return null;
}
function getLayoutName(track) {
    for (const [trackName] of Object.entries(TRACK_LAYOUTS)) {
        if (track.startsWith(trackName)) {
            return track.substring(trackName.length).replace(/^ - /, '');
        }
    }
    return null;
}
function generateSubmissionPDF(submission, userName, language = 'en', teamBranding) {
    return new Promise((resolve, reject) => {
        const t = PDF_TRANSLATIONS[language] || PDF_TRANSLATIONS.en;
        const primaryColor = teamBranding?.primaryColor || '#E31837';
        const doc = new pdfkit_1.default({
            margin: 40,
            size: 'A4',
            info: {
                Title: `${t.setupSheet} - ${userName}`,
                Author: teamBranding?.teamName || 'Overcut Academy',
                Subject: 'Kart Setup Sheet',
            }
        });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);
        const pageWidth = doc.page.width - 80; // Account for margins
        // Racing stripe at top
        doc.rect(0, 0, doc.page.width, 8).fill(primaryColor);
        // Logo and Header - use team logo if available, fall back to PSL logo
        const logoFile = teamBranding?.logoPath || path_1.default.join(__dirname, '../../assets/psl-logo.png');
        if (logoFile && fs_1.default.existsSync(logoFile)) {
            doc.image(logoFile, 40, 20, { width: 120 });
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
        const drawSectionHeader = (title, y) => {
            doc.rect(40, y, pageWidth, 25).fill(primaryColor);
            doc.fontSize(12)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text(title.toUpperCase(), 55, y + 7);
            return y + 30;
        };
        // Helper function for data rows (two columns)
        const drawDataRow = (label1, value1, label2, value2, y) => {
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
        if (submission.weatherTempC != null ||
            submission.weatherHumidityPct != null ||
            submission.weatherPressureHpa != null) {
            yPos = drawDataRow(t.temperature, (0, weather_1.formatTemp)(submission.weatherTempC) || '-', t.humidity, (0, weather_1.formatHumidity)(submission.weatherHumidityPct) || '-', yPos);
            yPos = drawDataRow(t.pressure, (0, weather_1.formatPressure)(submission.weatherPressureHpa) || '-', '', '', yPos);
        }
        yPos += 5;
        // Track Layout Image (if available)
        const layoutImagePath = findLayoutImagePath(submission.track);
        const layoutName = getLayoutName(submission.track);
        if (layoutImagePath && layoutName) {
            yPos = drawSectionHeader(`${t.trackLayout}: ${layoutName}`, yPos);
            try {
                doc.image(layoutImagePath, 40 + (pageWidth - 200) / 2, yPos, { width: 200 });
                yPos += 130; // Image height + margin
            }
            catch (e) {
                console.error('Failed to embed track layout image in PDF:', e);
            }
            yPos += 5;
        }
        // Engine Setup Section
        yPos = drawSectionHeader(t.engineSetup, yPos);
        yPos = drawDataRow(t.engineNumber, submission.engineNumber || '-', t.carburator, submission.carburatorNumber || '-', yPos);
        if (submission.gearRatio) {
            yPos = drawDataRow(t.gearRatio, submission.gearRatio, '', '', yPos);
        }
        else {
            yPos = drawDataRow(t.driveSprocket, submission.driveSprocket || '-', t.drivenSprocket, submission.drivenSprocket || '-', yPos);
        }
        if (submission.sparkplugType || submission.sparkplugGap != null) {
            yPos = drawDataRow(t.sparkplugType, submission.sparkplugType || '-', t.sparkplugGap, submission.sparkplugGap != null ? String(submission.sparkplugGap) : '-', yPos);
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
        if (submission.frontWheelType) {
            yPos = drawDataRow(t.frontWheelType, submission.frontWheelType || '-', '', '', yPos);
        }
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
                // Move yPos past the wrapped observation text so the next section
                // doesn't overlap.
                const observationHeight = doc.heightOfString(submission.observation, { width: pageWidth - 30 });
                yPos += 12 + observationHeight + 10;
            }
            else {
                yPos += 5;
            }
        }
        // Dash Summary Photo (if provided)
        const dashPhoto = submission.dashSummaryPhoto;
        if (dashPhoto) {
            const photoWidth = 450;
            // Conservative vertical budget for heading + image (aspect-preserved,
            // so actual height varies). Trigger a page break if unlikely to fit.
            const estimatedNeeded = 30 + photoWidth * 0.75;
            const footerMargin = 60;
            if (yPos + estimatedNeeded > doc.page.height - footerMargin) {
                doc.addPage();
                yPos = 40;
            }
            yPos = drawSectionHeader(t.dashSummary, yPos);
            try {
                // pdfkit's image() accepts a Buffer of raw bytes. Strip the
                // data-URL prefix before decoding.
                const commaIdx = dashPhoto.indexOf(',');
                if (commaIdx !== -1) {
                    const b64 = dashPhoto.slice(commaIdx + 1);
                    const imgBuffer = Buffer.from(b64, 'base64');
                    const imgX = 40 + (pageWidth - photoWidth) / 2;
                    doc.image(imgBuffer, imgX, yPos, { width: photoWidth });
                }
            }
            catch (e) {
                console.error('Failed to embed dash summary photo in PDF:', e);
            }
        }
        // Footer with racing stripe
        const footerY = doc.page.height - 40;
        doc.rect(0, footerY, doc.page.width, 8).fill(primaryColor);
        doc.fontSize(8)
            .fillColor(COLORS.lightGray)
            .text(t.poweredBy, 40, footerY - 15, {
            width: pageWidth,
            align: 'center'
        });
        doc.end();
    });
}

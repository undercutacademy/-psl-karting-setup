import { Resend } from 'resend';
import { Submission, Team } from '@prisma/client';
import { formatTemp, formatHumidity, formatPressure } from '../lib/weather';

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Log configuration on startup
console.log('Email Service Configuration:');
console.log('  RESEND_API_KEY:', resendApiKey ? '(set)' : '(not set)');
console.log('  MANAGER_EMAIL:', process.env.MANAGER_EMAIL || '(not set)');

if (!resendApiKey) {
  console.warn('WARNING: RESEND_API_KEY not set. Emails will not be sent.');
}

// Parse a base64 image data URL into its mime type and raw base64 payload.
// Returns null if the input is missing or not a recognizable data URL.
function parsePhotoDataUrl(
  dataUrl: string | null | undefined
): { mime: string; base64: string; extension: string } | null {
  if (!dataUrl) return null;
  const match = /^data:(image\/(jpeg|png|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const extension = match[2].toLowerCase() === 'jpeg' ? 'jpg' : match[2].toLowerCase();
  return { mime, base64: match[3], extension };
}

// Identifier used to reference the inline photo from the HTML via cid:<id>.
const DASH_PHOTO_CONTENT_ID = 'dash-summary-photo';

// Pick white or dark text for best contrast against a hex background.
function getContrastText(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? '#1f2937' : '#ffffff';
}

// Build the submission notification HTML, styled with the team's primary color.
function buildSubmissionNotificationHtml(
  userName: string,
  submission: Submission & { team?: Team | null; dashSummaryPhoto?: string | null },
  hasPhotoAttachment: boolean
): string {
  const val = (v: any) => v || '-';
  const primary = submission.team?.primaryColor || '#dc2626';
  const textOnPrimary = getContrastText(primary);
  const border = '#e5e7eb';
  const teamSlug = submission.team?.slug || 'psl-karting';
  const dashPhotoSection = hasPhotoAttachment
    ? `
        <!-- Dash Summary Photo -->
        <h3 style="color: ${primary}; border-bottom: 2px solid ${border}; padding-bottom: 5px;">Dash Summary</h3>
        <div style="margin-bottom: 20px; text-align: center;">
          <img src="cid:${DASH_PHOTO_CONTENT_ID}" alt="Dash summary photo" style="max-width: 100%; height: auto; border: 1px solid ${border}; border-radius: 4px;" />
          <p style="font-size: 12px; color: #6b7280; margin-top: 6px;">(Also attached to this email as a file.)</p>
        </div>
    `
    : '';

  const weatherEntries: Array<[string, string | null]> = [
    ['Temperature', formatTemp(submission.weatherTempC)],
    ['Humidity', formatHumidity(submission.weatherHumidityPct)],
    ['Pressure', formatPressure(submission.weatherPressureHpa)],
  ];
  const conditionsLine = weatherEntries
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><strong>${label}:</strong> ${value}</div>`)
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #1f2937;">
      <div style="background-color: ${primary}; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: ${textOnPrimary}; margin: 0; text-transform: uppercase;">New Setup Submission</h2>
        <p style="color: ${textOnPrimary}; margin: 5px 0 0 0;">${userName} | ${new Date(submission.createdAt).toLocaleString()}</p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border: 1px solid ${border}; border-top: none;">

        <!-- General Info -->
        <h3 style="color: ${primary}; border-bottom: 2px solid ${border}; padding-bottom: 5px; margin-top: 0;">General Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div><strong>Session:</strong> ${val(submission.sessionType)}</div>
          <div><strong>Track:</strong> ${val(submission.track)}</div>
          <div><strong>Championship:</strong> ${val(submission.championship)}</div>
          <div><strong>Division:</strong> ${val(submission.division)}</div>
          ${conditionsLine}
        </div>

        <!-- Engine Setup -->
        <h3 style="color: ${primary}; border-bottom: 2px solid ${border}; padding-bottom: 5px;">Engine Setup</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div><strong>Engine Number:</strong> ${val(submission.engineNumber)}</div>
          <div><strong>Carburator:</strong> ${val(submission.carburatorNumber)}</div>
          <div><strong>Gear Ratio:</strong> ${val(submission.gearRatio)}</div>
          <div><strong>Drive Sprocket:</strong> ${val(submission.driveSprocket)}</div>
          <div><strong>Driven Sprocket:</strong> ${val(submission.drivenSprocket)}</div>
        </div>

        <!-- Tyres -->
        <h3 style="color: ${primary}; border-bottom: 2px solid ${border}; padding-bottom: 5px;">Tyres</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div><strong>Model:</strong> ${val(submission.tyreModel)}</div>
          <div><strong>Age:</strong> ${val(submission.tyreAge)}</div>
          <div><strong>Pr (Cold):</strong> ${val(submission.tyreColdPressure)}</div>
        </div>

        <!-- Chassis / Kart -->
        <h3 style="color: ${primary}; border-bottom: 2px solid ${border}; padding-bottom: 5px;">Chassis Setup</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div><strong>Chassis:</strong> ${val(submission.chassis)}</div>
          <div><strong>Axle:</strong> ${val(submission.axle)}</div>
          <div><strong>Rear Hubs:</strong> ${val(submission.rearHubsMaterial)} (${val(submission.rearHubsLength)})</div>
          <div><strong>Front Hubs:</strong> ${val(submission.frontHubsMaterial)}</div>
          <div><strong>Front Height:</strong> ${val(submission.frontHeight)}</div>
          <div><strong>Back Height:</strong> ${val(submission.backHeight)}</div>
          <div><strong>Front Bar:</strong> ${val(submission.frontBar)}</div>
          <div><strong>Spindle:</strong> ${val(submission.spindle)}</div>
          <div><strong>Caster:</strong> ${val(submission.caster)}</div>
          <div><strong>Seat Position:</strong> ${val(submission.seatPosition)}</div>
        </div>

        <!-- Conclusion -->
        <h3 style="color: ${primary}; border-bottom: 2px solid ${border}; padding-bottom: 5px;">Conclusion</h3>
        <div style="margin-bottom: 20px;">
          <div style="margin-bottom: 10px;"><strong>Lap Time:</strong> ${val(submission.lapTime)}</div>
          <div><strong>Observation:</strong><br/>
            <div style="background: #fff; padding: 10px; border: 1px solid ${border}; border-radius: 4px; margin-top: 5px; white-space: pre-wrap;">${val(submission.observation)}</div>
          </div>
        </div>
${dashPhotoSection}
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://setups.overcutacademy.com/${teamSlug}/manager/dashboard" style="background-color: ${primary}; color: ${textOnPrimary}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Dashboard</a>
        </div>
      </div>
    </div>
  `;
}

export async function sendUserConfirmationEmail(
  userEmail: string,
  userName: string,
  submission: Submission
): Promise<void> {
  // User emails are disabled as requested
  return;
}

// Build the Resend attachments array for the dash summary photo, if present.
// Embedded inline via contentId so Gmail/Apple Mail/Outlook render it in the
// body, AND surfaced as a downloadable file.
function buildDashPhotoAttachments(
  submission: Submission & { dashSummaryPhoto?: string | null }
) {
  const parsed = parsePhotoDataUrl(submission.dashSummaryPhoto);
  if (!parsed) return { attachments: undefined, hasPhoto: false };
  return {
    attachments: [
      {
        filename: `dash-summary.${parsed.extension}`,
        content: parsed.base64,
        contentType: parsed.mime,
        contentId: DASH_PHOTO_CONTENT_ID,
      },
    ],
    hasPhoto: true,
  };
}

// Send notification to a single manager
export async function sendManagerNotificationEmail(
  managerEmail: string,
  userName: string,
  submission: Submission & { team?: Team | null }
): Promise<void> {
  console.log(`Attempting to send email notification to: ${managerEmail}`);

  if (!resend) {
    console.error('Resend not initialized. RESEND_API_KEY is missing.');
    throw new Error('Email service not configured');
  }

  const { attachments, hasPhoto } = buildDashPhotoAttachments(submission);
  const htmlContent = buildSubmissionNotificationHtml(userName, submission, hasPhoto);

  try {
    const fromName = submission.team?.emailFromName || 'Setups - Overcut Academy';
    const cleanEmail = managerEmail.trim().toLowerCase();

    const { data, error } = await resend.emails.send({
      from: `${fromName} <setup@overcutacademy.com>`,
      to: cleanEmail,
      subject: `New Setup Submission from ${userName} - ${submission.track}`,
      html: htmlContent,
      ...(attachments ? { attachments } : {}),
    });

    if (error) {
      console.error(`Resend error sending to ${cleanEmail}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`Email sent successfully to ${cleanEmail}! ID: ${data?.id}${hasPhoto ? ' (with dash photo)' : ''}`);
  } catch (error) {
    console.error(`Error in sendManagerNotificationEmail for ${managerEmail}:`, error);
    throw error;
  }
}

// Send notification to multiple managers in a single email (batch)
export async function sendManagerNotificationEmailBatch(
  managerEmails: string[],
  userName: string,
  submission: Submission & { team?: Team | null }
): Promise<void> {
  console.log(`Attempting to send batch email notification to ${managerEmails.length} managers`);

  if (!resend) {
    console.error('Resend not initialized. RESEND_API_KEY is missing.');
    throw new Error('Email service not configured');
  }

  if (managerEmails.length === 0) {
    console.warn('No manager emails provided for batch notification');
    return;
  }

  const { attachments, hasPhoto } = buildDashPhotoAttachments(submission);
  const htmlContent = buildSubmissionNotificationHtml(userName, submission, hasPhoto);

  try {
    const fromName = submission.team?.emailFromName || 'Setups - Overcut Academy';
    const cleanEmails = managerEmails.map(email => email.trim().toLowerCase());

    console.log(`Sending batch email to: ${cleanEmails.join(', ')}`);

    // Send a single email to all managers
    const { data, error } = await resend.emails.send({
      from: `${fromName} <setup@overcutacademy.com>`,
      to: cleanEmails, // Resend supports arrays for multiple recipients
      subject: `New Setup Submission from ${userName} - ${submission.track}`,
      html: htmlContent,
      ...(attachments ? { attachments } : {}),
    });

    if (error) {
      console.error(`Resend error sending batch email:`, error);
      throw new Error(`Failed to send batch email: ${error.message}`);
    }

    console.log(`Batch email sent successfully to ${cleanEmails.length} managers! ID: ${data?.id}${hasPhoto ? ' (with dash photo)' : ''}`);
  } catch (error) {
    console.error(`Error in sendManagerNotificationEmailBatch:`, error);
    throw error;
  }
}

// Send welcome email to a newly created manager
export async function sendManagerWelcomeEmail(
  managerEmail: string,
  password: string,
  teamSlug: string,
  teamName: string,
  teamBranding?: { logoUrl?: string | null; primaryColor?: string | null; emailFromName?: string | null }
): Promise<void> {
  console.log(`Sending welcome email to new manager: ${managerEmail}`);

  if (!resend) {
    console.error('Resend not initialized. RESEND_API_KEY is missing.');
    throw new Error('Email service not configured');
  }

  const baseUrl = 'https://setups.overcutacademy.com';
  const loginUrl = `${baseUrl}/${teamSlug}/manager/login`;
  const primaryColor = teamBranding?.primaryColor || '#dc2626';
  // Team logos are designed for the app's dark theme (often white-on-transparent),
  // so they sit on a dark header band rather than the white email body.
  const headerContent = teamBranding?.logoUrl
    ? `<img src="${baseUrl}${teamBranding.logoUrl}" alt="${teamName}" style="max-height: 64px; max-width: 80%;" />`
    : `<span style="color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 1px;">${teamName}</span>`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <div style="background-color: ${primaryColor}; height: 6px; border-radius: 8px 8px 0 0;"></div>
      <div style="background-color: #0b0b0f; padding: 28px 24px; text-align: center;">
        ${headerContent}
      </div>

      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin: 0 0 20px;">Welcome! You've been added as a manager for <strong>${teamName}</strong> on <strong>setups.overcutacademy.com</strong>.</p>

        <p style="font-size: 14px; margin-bottom: 5px;">Here are your credentials:</p>

        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${managerEmail}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Password:</strong> ${password}</p>
        </div>

        <p style="margin: 20px 0;">
          <a href="${loginUrl}" style="background-color: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Click here to login and create your own password
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

        <p style="font-size: 14px; margin-bottom: 4px;"><strong>Lucas Nogueira</strong> — Founder</p>
        <span style="display: inline-block; background-color: #0b0b0f; border-radius: 8px; padding: 8px 14px;">
          <img src="${baseUrl}/overcut-academy-logo.png" alt="Overcut Academy" style="height: 36px; display: block;" />
        </span>
        <p style="font-size: 12px; color: #6b7280;">www.overcutacademy.com</p>
      </div>
    </div>
  `;

  try {
    const cleanEmail = managerEmail.trim().toLowerCase();
    const fromName = teamBranding?.emailFromName || 'Overcut Academy';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <setup@overcutacademy.com>`,
      to: cleanEmail,
      subject: `Welcome to ${teamName} Setups — Your Manager Credentials`,
      html: htmlContent,
    });

    if (error) {
      console.error(`Resend error sending welcome email to ${cleanEmail}:`, error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    console.log(`Welcome email sent successfully to ${cleanEmail}! ID: ${data?.id}`);
  } catch (error) {
    console.error(`Error in sendManagerWelcomeEmail for ${managerEmail}:`, error);
    throw error;
  }
}


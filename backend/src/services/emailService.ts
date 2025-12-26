import { Resend } from 'resend';
import { Submission } from '@prisma/client';

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

export async function sendUserConfirmationEmail(
  userEmail: string,
  userName: string,
  submission: Submission
): Promise<void> {
  // User emails are disabled as requested
  return;
}

export async function sendManagerNotificationEmail(
  managerEmail: string,
  userName: string,
  submission: Submission
): Promise<void> {
  console.log(`Attempting to send email notification to: ${managerEmail}`);

  if (!resend) {
    console.error('Resend not initialized. RESEND_API_KEY is missing.');
    throw new Error('Email service not configured');
  }

  // Helper to format values
  const val = (v: any) => v || '-';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #1f2937;">
      <div style="background-color: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; text-transform: uppercase;">New Setup Submission</h2>
        <p style="color: white; margin: 5px 0 0 0;">${userName} | ${new Date(submission.createdAt).toLocaleString()}</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        
        <!-- General Info -->
        <h3 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 5px; margin-top: 0;">General Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div><strong>Session:</strong> ${val(submission.sessionType)}</div>
          <div><strong>Track:</strong> ${val(submission.track)}</div>
          <div><strong>Championship:</strong> ${val(submission.championship)}</div>
          <div><strong>Division:</strong> ${val(submission.division)}</div>
        </div>

        <!-- Engine Setup -->
        <h3 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 5px;">Engine Setup</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div><strong>Engine Number:</strong> ${val(submission.engineNumber)}</div>
          <div><strong>Carburator:</strong> ${val(submission.carburatorNumber)}</div>
          <div><strong>Gear Ratio:</strong> ${val(submission.gearRatio)}</div>
          <div><strong>Drive Sprocket:</strong> ${val(submission.driveSprocket)}</div>
          <div><strong>Driven Sprocket:</strong> ${val(submission.drivenSprocket)}</div>
        </div>

        <!-- Tyres -->
        <h3 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 5px;">Tyres</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div><strong>Model:</strong> ${val(submission.tyreModel)}</div>
          <div><strong>Age:</strong> ${val(submission.tyreAge)}</div>
          <div><strong>Pr (Cold):</strong> ${val(submission.tyreColdPressure)}</div>
        </div>

        <!-- Chassis / Kart -->
        <h3 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 5px;">Chassis Setup</h3>
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
        <h3 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 5px;">Conclusion</h3>
        <div style="margin-bottom: 20px;">
          <div style="margin-bottom: 10px;"><strong>Lap Time:</strong> ${val(submission.lapTime)}</div>
          <div><strong>Observation:</strong><br/>
            <div style="background: #fff; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 5px; white-space: pre-wrap;">${val(submission.observation)}</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://setups.undercutacademy.com/psl-karting/manager/dashboard" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Dashboard</a>
        </div>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: 'PSL Karting Setups <noreply@undercutacademy.com>',
      to: managerEmail,
      subject: `New Setup Submission from ${userName} - ${submission.track}`,
      html: htmlContent,
    });

    console.log(`Email sent successfully! ID: ${result.data?.id}`);
  } catch (error) {
    console.error('Error sending manager notification email:', error);
    throw error;
  }
}

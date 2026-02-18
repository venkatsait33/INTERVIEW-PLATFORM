/**
 * Email Service
 * Handles all transactional email notifications using Nodemailer
 */

const nodemailer = require('nodemailer');
const { NotificationLog } = require('../models/Logs');
const logger = require('../utils/logger');

// ─────────────────────────────────────────
// Transporter Configuration
// ─────────────────────────────────────────

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ─────────────────────────────────────────
// HTML Email Templates
// ─────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Interview Platform</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 40px 32px; }
    .body h2 { color: #1a202c; margin-top: 0; font-size: 20px; }
    .body p { color: #4a5568; line-height: 1.6; font-size: 15px; }
    .info-card { background: #f7fafc; border-left: 4px solid #667eea; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; }
    .info-card p { margin: 6px 0; color: #2d3748; font-size: 14px; }
    .info-card strong { color: #1a202c; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 24px 0; letter-spacing: 0.3px; }
    .btn:hover { opacity: 0.9; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #856404; font-size: 14px; }
    .footer { background: #f7fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #718096; font-size: 13px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Interview Platform</h1>
      <p>Professional Interview Management</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This is an automated email from Interview Platform.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const templates = {
  scheduleInterview: ({ recipientName, interviewTitle, scheduledAt, duration, instructions, role }) => {
    const date = new Date(scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const time = new Date(scheduledAt).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    return baseTemplate(`
      <h2>📅 Interview Scheduled</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>An interview has been scheduled for you${role === 'interviewer' ? ' to conduct' : ' to attend'}.</p>
      <div class="info-card">
        <p><strong>Position:</strong> ${interviewTitle}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
      </div>
      ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ''}
      <p>Please ensure you are available at the scheduled time. You will receive a join link once the session begins.</p>
      <p>Best of luck!</p>
    `);
  },

  sessionStarted: ({ recipientName, interviewTitle, joinUrl, expiresAt }) => {
    const expiry = new Date(expiresAt).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

    return baseTemplate(`
      <h2>🚀 Your Interview Is Starting Now!</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>Your interview for <strong>${interviewTitle}</strong> is now active. Please join immediately.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${joinUrl}" class="btn">🎯 Join Interview Now</a>
      </div>
      <div class="warning">
        ⏰ <strong>Important:</strong> This link expires at ${expiry}. Please join as soon as possible.
      </div>
      <p>Once you click the link, you will enter a waiting lobby. The interviewer will admit you when ready.</p>
      <p><strong>Technical Requirements:</strong></p>
      <ul style="color: #4a5568; font-size: 14px; line-height: 1.8;">
        <li>Stable internet connection</li>
        <li>Working webcam and microphone</li>
        <li>Modern browser (Chrome, Firefox, Edge)</li>
        <li>Quiet environment</li>
      </ul>
      <p>If the button doesn't work, copy and paste this URL:</p>
      <p style="word-break: break-all; color: #667eea; font-size: 13px;">${joinUrl}</p>
    `);
  },

  resultNotification: ({ recipientName, interviewTitle, result, feedback }) => {
    const isHired = result === 'HIRED';
    const resultColor = isHired ? '#38a169' : '#e53e3e';
    const resultText = isHired ? '🎉 Congratulations! You have been selected!' : 'Thank you for your time and effort.';

    return baseTemplate(`
      <h2>📋 Interview Result</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>We have an update regarding your interview for <strong>${interviewTitle}</strong>.</p>
      <div style="background: ${isHired ? '#f0fff4' : '#fff5f5'}; border: 2px solid ${resultColor}; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        <p style="font-size: 28px; margin: 0;">${isHired ? '✅' : '❌'}</p>
        <p style="font-size: 20px; font-weight: 700; color: ${resultColor}; margin: 8px 0;">${result}</p>
        <p style="color: #4a5568; margin: 0;">${resultText}</p>
      </div>
      ${feedback ? `
        <div class="info-card">
          <p><strong>Feedback from Interviewer:</strong></p>
          <p style="font-style: italic;">"${feedback}"</p>
        </div>
      ` : ''}
      <p>Thank you for participating in our interview process.</p>
    `);
  },

  cancellation: ({ recipientName, interviewTitle, scheduledAt, reason }) => {
    const date = new Date(scheduledAt).toLocaleDateString('en-US', { dateStyle: 'long' });

    return baseTemplate(`
      <h2>❌ Interview Cancelled</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>We regret to inform you that the following interview has been cancelled:</p>
      <div class="info-card">
        <p><strong>Position:</strong> ${interviewTitle}</p>
        <p><strong>Originally Scheduled:</strong> ${date}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p>Our HR team will reach out to reschedule if applicable. We apologize for any inconvenience.</p>
    `);
  },
};

// ─────────────────────────────────────────
// Core Send Function
// ─────────────────────────────────────────

const sendEmail = async ({ to, subject, html, userId, interviewId, notificationType }) => {
  const logEntry = {
    user: userId,
    interview: interviewId,
    type: notificationType,
    recipient: to,
    subject,
    status: 'PENDING',
  };

  let notifLog;

  try {
    // Create pending log entry
    notifLog = await NotificationLog.create(logEntry);

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Interview Platform'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    // Update log to SENT
    await NotificationLog.findByIdAndUpdate(notifLog._id, { status: 'SENT' });
    logger.info(`Email sent successfully to ${to} [${notificationType}]`);

    return { success: true };
  } catch (error) {
    logger.error(`Email failed to ${to} [${notificationType}]:`, error.message);

    // Update log to FAILED
    if (notifLog) {
      await NotificationLog.findByIdAndUpdate(notifLog._id, {
        status: 'FAILED',
        errorMessage: error.message,
      });
    }

    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────
// Public Email Functions
// ─────────────────────────────────────────

/**
 * Notify interviewer and candidate when interview is scheduled
 */
const sendScheduleNotification = async (interview, interviewer, candidate) => {
  const promises = [
    sendEmail({
      to: interviewer.email,
      subject: `Interview Scheduled: ${interview.title}`,
      html: templates.scheduleInterview({
        recipientName: interviewer.name,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        role: 'interviewer',
      }),
      userId: interviewer._id,
      interviewId: interview._id,
      notificationType: 'SCHEDULE',
    }),
    sendEmail({
      to: candidate.email,
      subject: `Interview Scheduled: ${interview.title}`,
      html: templates.scheduleInterview({
        recipientName: candidate.name,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        role: 'candidate',
      }),
      userId: candidate._id,
      interviewId: interview._id,
      notificationType: 'SCHEDULE',
    }),
  ];

  return Promise.allSettled(promises);
};

/**
 * Send secure join link to candidate when session starts
 */
const sendSessionStartedNotification = async (interview, candidate, roomToken) => {
  const joinUrl = `${process.env.CLIENT_URL}/room/${interview._id}?token=${roomToken}`;
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  return sendEmail({
    to: candidate.email,
    subject: `Your Interview Is Starting Now - ${interview.title}`,
    html: templates.sessionStarted({
      recipientName: candidate.name,
      interviewTitle: interview.title,
      joinUrl,
      expiresAt,
    }),
    userId: candidate._id,
    interviewId: interview._id,
    notificationType: 'START',
  });
};

/**
 * Send result notification to candidate
 */
const sendResultNotification = async (interview, candidate) => {
  return sendEmail({
    to: candidate.email,
    subject: `Interview Result: ${interview.title}`,
    html: templates.resultNotification({
      recipientName: candidate.name,
      interviewTitle: interview.title,
      result: interview.result,
      feedback: interview.feedback,
    }),
    userId: candidate._id,
    interviewId: interview._id,
    notificationType: 'RESULT',
  });
};

/**
 * Send cancellation notification
 */
const sendCancellationNotification = async (interview, recipients, reason) => {
  const promises = recipients.map((user) =>
    sendEmail({
      to: user.email,
      subject: `Interview Cancelled: ${interview.title}`,
      html: templates.cancellation({
        recipientName: user.name,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        reason,
      }),
      userId: user._id,
      interviewId: interview._id,
      notificationType: 'CANCELLATION',
    })
  );

  return Promise.allSettled(promises);
};

module.exports = {
  sendScheduleNotification,
  sendSessionStartedNotification,
  sendResultNotification,
  sendCancellationNotification,
};

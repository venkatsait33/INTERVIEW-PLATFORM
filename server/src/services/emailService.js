/**
 * Email Service — ESM
 * Nodemailer with HTML templates
 */

import nodemailer from "nodemailer";
import { NotificationLog } from "../models/Logs.js";
import logger from "../utils/logger.js";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const base = (content) =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><style>body{margin:0;padding:0;background:#f4f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}.hd{background:linear-gradient(135deg,#667eea,#764ba2);padding:40px 32px;text-align:center}.hd h1{color:#fff;margin:0;font-size:24px;font-weight:700}.hd p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px}.bd{padding:40px 32px}.bd h2{color:#1a202c;margin-top:0}.bd p{color:#4a5568;line-height:1.6;font-size:15px}.info{background:#f7fafc;border-left:4px solid #667eea;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0}.info p{margin:6px 0;color:#2d3748;font-size:14px}.btn{display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;margin:24px 0}.warn{background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin:16px 0;color:#856404;font-size:14px}.ft{background:#f7fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0}.ft p{color:#718096;font-size:13px;margin:4px 0}</style></head><body><div class="wrap"><div class="hd"><h1>🎯 Interview Platform</h1><p>Professional Interview Management</p></div><div class="bd">${content}</div><div class="ft"><p>This is an automated email. Please do not reply.</p></div></div></body></html>`;

const templates = {
  schedule: ({
    recipientName,
    interviewTitle,
    scheduledAt,
    duration,
    role,
  }) => {
    const date = new Date(scheduledAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = new Date(scheduledAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return base(
      `<h2>📅 Interview Scheduled</h2><p>Hello <strong>${recipientName}</strong>,</p><p>An interview has been ${role === "interviewer" ? "assigned to you" : "scheduled for you"}.</p><div class="info"><p><strong>Position:</strong> ${interviewTitle}</p><p><strong>Date:</strong> ${date}</p><p><strong>Time:</strong> ${time}</p><p><strong>Duration:</strong> ${duration} minutes</p><p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p></div><p>You will receive a join link once the session begins. Good luck!</p>`,
    );
  },
  sessionStarted: ({ recipientName, interviewTitle, joinUrl, expiresAt }) => {
    const expiry = new Date(expiresAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return base(
      `<h2>🚀 Your Interview Is Starting!</h2><p>Hello <strong>${recipientName}</strong>,</p><p>Your interview for <strong>${interviewTitle}</strong> is now active.</p><div style="text-align:center;margin:32px 0"><a href="${joinUrl}" class="btn">🎯 Join Interview Now</a></div><div class="warn">⏰ This link expires at ${expiry}. Please join promptly.</div><p>You'll enter a waiting lobby — the interviewer will admit you when ready.</p><p style="word-break:break-all;color:#667eea;font-size:13px">${joinUrl}</p>`,
    );
  },
  result: ({ recipientName, interviewTitle, result, feedback }) => {
    const hired = result === "HIRED";
    return base(
      `<h2>📋 Interview Result</h2><p>Hello <strong>${recipientName}</strong>,</p><p>Your interview for <strong>${interviewTitle}</strong> has been reviewed.</p><div style="background:${hired ? "#f0fff4" : "#fff5f5"};border:2px solid ${hired ? "#38a169" : "#e53e3e"};border-radius:8px;padding:20px;text-align:center;margin:24px 0"><p style="font-size:28px;margin:0">${hired ? "✅" : "❌"}</p><p style="font-size:20px;font-weight:700;color:${hired ? "#38a169" : "#e53e3e"};margin:8px 0">${result}</p><p style="color:#4a5568;margin:0">${hired ? "🎉 Congratulations! You have been selected!" : "Thank you for your time and effort."}</p></div>${feedback ? `<div class="info"><p><strong>Feedback:</strong></p><p style="font-style:italic">"${feedback}"</p></div>` : ""}`,
    );
  },
  cancellation: ({ recipientName, interviewTitle, scheduledAt, reason }) => {
    const date = new Date(scheduledAt).toLocaleDateString("en-US", {
      dateStyle: "long",
    });
    return base(
      `<h2>❌ Interview Cancelled</h2><p>Hello <strong>${recipientName}</strong>,</p><p>The following interview has been cancelled:</p><div class="info"><p><strong>Position:</strong> ${interviewTitle}</p><p><strong>Originally Scheduled:</strong> ${date}</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}</div><p>Our HR team will be in touch regarding rescheduling. We apologise for the inconvenience.</p>`,
    );
  },
  noShow: ({
    recipientName,
    interviewTitle,
    scheduledAt,
    reporterRole,
    absentRole,
    waitedMinutes,
    isAbsentParty,
  }) => {
    const date = new Date(scheduledAt).toLocaleDateString("en-US", {
      dateStyle: "long",
    });
    const absentLabel =
      absentRole === "interviewer" ? "Interviewer" : "Candidate";
    const reporterLabel =
      reporterRole === "interviewer" ? "Interviewer" : "Candidate";
    return baseTemplate(`
      <h2>⚠️ No-Show Reported: ${interviewTitle}</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      ${
        isAbsentParty
          ? `
        <div class="alert">
          A no-show has been recorded against you for this interview.
        </div>
        <p>The ${reporterLabel} waited <strong>${waitedMinutes} minutes</strong> and you did not join the call.</p>
        <p>Please contact HR if there was an emergency or misunderstanding.</p>
      `
          : `
        <div class="info-card">
          <p>Your no-show report has been received and confirmed.</p>
          <p><strong>You waited:</strong> ${waitedMinutes} minutes</p>
          <p><strong>${absentLabel} did not join.</strong></p>
        </div>
        <p>The interview has been cancelled and HR has been notified.</p>
      `
      }
      <div class="info-card">
        <p><strong>Interview:</strong> ${interviewTitle}</p>
        <p><strong>Scheduled:</strong> ${date}</p>
        <p><strong>Reporter:</strong> ${reporterLabel}</p>
        <p><strong>Absent Party:</strong> ${absentLabel}</p>
        <p><strong>Wait Time:</strong> ${waitedMinutes} minutes</p>
      </div>
    `);
  },
};

const sendEmail = async ({
  to,
  subject,
  html,
  userId,
  interviewId,
  notificationType,
}) => {
  let notifLog;
  try {
    notifLog = await NotificationLog.create({
      user: userId,
      interview: interviewId,
      type: notificationType,
      recipient: to,
      subject,
      status: "PENDING",
    });
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Interview Platform"}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    await NotificationLog.findByIdAndUpdate(notifLog._id, { status: "SENT" });
    logger.info(`Email sent to ${to} [${notificationType}]`);
    return { success: true };
  } catch (error) {
    logger.error(`Email failed to ${to} [${notificationType}]:`, error.message);
    if (notifLog)
      await NotificationLog.findByIdAndUpdate(notifLog._id, {
        status: "FAILED",
        errorMessage: error.message,
      });
    return { success: false, error: error.message };
  }
};

export const sendScheduleNotification = async (
  interview,
  interviewer,
  candidate,
) => {
  return Promise.allSettled([
    sendEmail({
      to: interviewer.email,
      subject: `Interview Scheduled: ${interview.title}`,
      html: templates.schedule({
        recipientName: interviewer.name,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        role: "interviewer",
      }),
      userId: interviewer._id,
      interviewId: interview._id,
      notificationType: "SCHEDULE",
    }),
    sendEmail({
      to: candidate.email,
      subject: `Interview Scheduled: ${interview.title}`,
      html: templates.schedule({
        recipientName: candidate.name,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        role: "candidate",
      }),
      userId: candidate._id,
      interviewId: interview._id,
      notificationType: "SCHEDULE",
    }),
  ]);
};

export const sendSessionStartedNotification = async (
  interview,
  candidate,
  roomToken,
) => {
  const joinUrl = `${process.env.CLIENT_URL}/room/${interview._id}?token=${roomToken}`;
  const expiresAt = Date.now() + 15 * 60 * 1000;
  return sendEmail({
    to: candidate.email,
    subject: `Your Interview Is Starting — ${interview.title}`,
    html: templates.sessionStarted({
      recipientName: candidate.name,
      interviewTitle: interview.title,
      joinUrl,
      expiresAt,
    }),
    userId: candidate._id,
    interviewId: interview._id,
    notificationType: "START",
  });
};

export const sendResultNotification = async (interview, candidate) => {
  return sendEmail({
    to: candidate.email,
    subject: `Interview Result: ${interview.title}`,
    html: templates.result({
      recipientName: candidate.name,
      interviewTitle: interview.title,
      result: interview.result,
      feedback: interview.feedback,
    }),
    userId: candidate._id,
    interviewId: interview._id,
    notificationType: "RESULT",
  });
};

export const sendCancellationNotification = async (
  interview,
  recipients,
  reason,
) => {
  return Promise.allSettled(
    recipients.map((u) =>
      sendEmail({
        to: u.email,
        subject: `Interview Cancelled: ${interview.title}`,
        html: templates.cancellation({
          recipientName: u.name,
          interviewTitle: interview.title,
          scheduledAt: interview.scheduledAt,
          reason,
        }),
        userId: u._id,
        interviewId: interview._id,
        notificationType: "CANCELLATION",
      }),
    ),
  );
};

/**
 * Send no-show notifications to both parties.
 * @param {object} interview  - populated interview document
 * @param {object} reporter   - user who reported (was waiting)
 * @param {object} absentUser - user who didn't show up
 * @param {number} waitedMinutes
 */
export const sendNoShowNotification = async (
  interview,
  reporter,
  absentUser,
  waitedMinutes,
) => {
  const reporterRole =
    reporter._id.toString() === interview.interviewer._id.toString()
      ? "interviewer"
      : "candidate";
  const absentRole =
    reporterRole === "interviewer" ? "candidate" : "interviewer";

  return Promise.allSettled([
    // Email to the person who waited (reporter)
    sendEmail({
      to: reporter.email,
      subject: `No-Show Confirmed: ${interview.title}`,
      html: templates.noShow({
        recipientName: reporter.name,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        reporterRole,
        absentRole,
        waitedMinutes,
        isAbsentParty: false,
      }),
      userId: reporter._id,
      interviewId: interview._id,
      notificationType: "CANCELLATION",
    }),
    // Email to the person who didn't show
    sendEmail({
      to: absentUser.email,
      subject: `No-Show Recorded: ${interview.title}`,
      html: templates.noShow({
        recipientName: absentUser.name,
        interviewTitle: interview.title,
        scheduledAt: interview.scheduledAt,
        reporterRole,
        absentRole,
        waitedMinutes,
        isAbsentParty: true,
      }),
      userId: absentUser._id,
      interviewId: interview._id,
      notificationType: "CANCELLATION",
    }),
  ]);
};

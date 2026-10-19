// workers/mailQues.worker.js  (full replacement)
const { Queue, Worker } = require("bullmq");
const crypto = require("crypto");
const connection = require("../cbServices/redis/config");
const sendMailService = require("../cbServices/nodeMailer/sendMailService");

const mailQues = new Queue("mailQues", { connection ,  prefix: `${process.env.PROJECT_NAME}:bull`,});

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the unsubscribe URL for a recipient.
 * Generates (or reuses) a stable token stored on the user record.
 */
// AFTER — fixed
async function getUnsubscribeUrl(app, email) {
  const frontendUrl = process.env.FRONTEND_URL || process.env.REACT_APP_URL || "http://localhost:3000";
  try {
    const users = await app.service("users").find({ query: { email, $limit: 1 } });
    if (!users.data || users.data.length === 0) return null;

    const user = users.data[0];
    let unsubscribeToken = user.unsubscribeToken;

    // Generate a token if none exists yet
    if (!unsubscribeToken) {
      unsubscribeToken = crypto.randomBytes(32).toString("hex");
      await app.service("users").patch(user._id, { unsubscribeToken: unsubscribeToken });
    }

    // Guard — should never happen but prevents "token is not defined" crash
    if (!unsubscribeToken) return null;

    return frontendUrl + "/unsubscribe?token=" + unsubscribeToken;
  } catch (err) {
    console.error("getUnsubscribeUrl error:", err);
    return null;
  }
}

/**
 * Append an unsubscribe footer to an HTML email body.
 */
// AFTER — skip footer entirely if URL couldn't be built
function appendUnsubscribeFooter(html, unsubscribeUrl) {
  if (!unsubscribeUrl) return html;  // ← guard added

  const footer = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;
            font-size:12px;color:#9ca3af;text-align:center;font-family:sans-serif;">
  <p style="margin:0 0 4px;">
    You received this email because you have an account in
    <strong>${process.env.REACT_APP_PROJECT_LABEL || process.env.PROJECT_NAME || "our system"}</strong>.
  </p>
  <p style="margin:0;">
    <a href="${unsubscribeUrl}"
       style="color:#6b7280;text-decoration:underline;">
      Unsubscribe from system emails
    </a>
  </p>
</div>`;
  return html + footer;
}

const createMailQueWorker = (app) => {
  const superAdmin = "menakamohan1999@gmail.com";

  const worker = new Worker(
    "mailQues",
    async (job) => {
      const { data } = job;
      console.debug("job data", data);

      // ── 1. Filter out unsubscribed recipients ──────────────────────────
      const subscribedRecipients = [];
      for (const email of data.recipients) {
        try {
          const users = await app.service("users").find({ query: { email, $limit: 1 } });
          if (users.data && users.data.length > 0) {
            // Known user — respect their subscription preference
            if (users.data[0].emailSubscribed !== false) {
              subscribedRecipients.push(email);
            } else {
              console.debug(`Skipping unsubscribed user: ${email}`);
            }
          } else {
            // Unknown email (e.g. external) — send anyway
            subscribedRecipients.push(email);
          }
        } catch {
          subscribedRecipients.push(email); // fail-open
        }
      }

      if (subscribedRecipients.length === 0) {
        console.debug("All recipients are unsubscribed; skipping mail job.");
        return;
      }
      // ──────────────────────────────────────────────────────────────────

      // ── 2. Resolve template, or send the queued subject/content as-is ─
      let subject = data.subject;
      let body = data.content || data.body || "";
      let contentHTML = data.html;

      if (data.templateId) {
        const template = await app
          .service("templates")
          .find({ query: { name: data.templateId } });
        if (!template.data.length)
          throw new Error(`Template ${data.templateId} not found, please create.`);

        const templateContent = template.data[0];
        if (typeof templateContent === "undefined")
          throw new Error(`email template not found => ${data.templateId}`);

        subject = templateContent.subject;
        body = templateContent.body;

        if (data.data) {
          Object.entries(data.data).forEach(([k, v]) => {
            // Placeholders can appear multiple times in a template, and values may
            // contain `$` sequences that would otherwise be treated as replacement patterns.
            const placeholder = new RegExp(`\\{\\{\\s*${escapeRegExp(k)}\\s*\\}\\}`, "g");
            const value = v === null || typeof v === "undefined" ? "" : String(v);
            subject = subject.replace(placeholder, () => value);
            body = body.replace(placeholder, () => value);
          });
        }

        contentHTML = body;
      } else if (subject || body) {
        const escapeHtml = (value) =>
          String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

        contentHTML =
          contentHTML ||
          `<p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>`;
        body = body || subject;
        subject = subject || "Support request";
      } else {
        throw new Error("No templateId or email content was provided.");
      }
      // ──────────────────────────────────────────────────────────────────

      // ── 3. Append unsubscribe footer (use first recipient's token) ────
      const primaryEmail = subscribedRecipients[0];
   // AFTER — catches any unexpected error so it never breaks mail sending
try {
  const unsubscribeUrl = await getUnsubscribeUrl(app, primaryEmail);
  contentHTML = appendUnsubscribeFooter(contentHTML, unsubscribeUrl);
} catch (footerErr) {
  console.error("Failed to append unsubscribe footer:", footerErr);
  // Continue sending without footer rather than failing the job
}
      // ──────────────────────────────────────────────────────────────────

      app.service("mailQues").patch(job.data._id, {
        jobId: job.id,
        content: contentHTML,
      });

      job.data.resolvedSubject = subject;
      job.data.resolvedBody = contentHTML;

      try {
        await sendMailService(
          data.name,
          data.from,
          subscribedRecipients,   // ← filtered list
          subject,
          body,
          contentHTML,
          [],
        );
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    { connection,  prefix: `${process.env.PROJECT_NAME}:bull`, },
  );

  const writeMailLog = async (job, sentStatus, errorMessage) => {
    try {
      const data = job?.data || {};
      const recipients = data.recipients || [];
      const mailType = String(data.templateId || data.name || "system").trim();
      await app.service("mails").create({
        sentDateTime: new Date(),
        sentStatus,
        status: sentStatus,
        mailType: mailType.length >= 2 ? mailType.slice(0, 150) : "system",
        toHistory: recipients,
        subject: data.resolvedSubject || data.subject || "",
        body: data.resolvedBody || data.content || data.body || errorMessage || "",
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      });
    } catch (logError) {
      console.error("Failed to write mail log:", logError);
    }
  };

  // ── Worker events (unchanged) ────────────────────────────────────────
  worker.on("completed", (job) => {
    console.debug(`Mail ${job.id} completed successfully`);
    if (job.data) {
      app.service("mailQues").patch(job.data._id, {
        jobId: job.id,
        end: new Date(),
        status: true,
      });
      writeMailLog(job, true);
    }
  });

  worker.on("failed", async (job, err) => {
    console.error(`Mail ${job.id} failed with error ${err.message}`);
    if (job.data) {
      app.service("mailQues").patch(job.data._id, {
        jobId: job.id,
        end: new Date(),
        data: { ...job.data },
        errorMessage: err.message,
        status: false,
      });
      job.data["errors"] = err.message;
      job.data["project"] = process.env.PROJECT_NAME;
      job.data["env"] = process.env.ENV;
      await writeMailLog(job, false, err.message);
      await sendMailService(
        job.data.name,
        job.data.from,
        [superAdmin],
        `Failed - ${err.message}`,
        err.message,
        `<p><pre><code>${JSON.stringify(job.data, null, 4)}</code></pre></p>`,
        [],
      );
    }
    if (err.message === "job stalled more than allowable limit") {
      await job.remove().catch((e) =>
        console.error(`jobId: ${job.id}, remove error: ${e.message}, ${e.stack}`),
      );
    }
  });

  const mailQuesService = app.service("mailQues");
  mailQuesService.hooks({
    after: {
      create: async (context) => {
        const { result } = context;
        if (result.recipients.length > 0)
          if (typeof result.hook === "undefined")
            await mailQues.add("mailQues", result);
        return context;
      },
    },
  });
};

module.exports = { createMailQueWorker };
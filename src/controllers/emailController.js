const { google } = require('googleapis');
const { gmailOAuth2Client } = require('../config/google');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const extractEmailBody = (part) => {
  let body = '';
  if (part.mimeType === 'text/plain' && part.body && part.body.data) {
    return Buffer.from(part.body.data, 'base64').toString('utf-8');
  }
  if (part.parts) {
    for (const sub of part.parts) body += extractEmailBody(sub);
  }
  return body;
};

const initiateGoogleAuth = (req, res) => {
  const authUrl = gmailOAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://googleapis.com'],
    prompt: 'consent',
    state: req.user.id
  });
  res.redirect(authUrl);
};

const handleGoogleCallback = async (req, res, next) => {
  const { code, state: userId } = req.query;
  if (!code || !userId) return res.status(400).json({ success: false, message: 'Handshake parameters missing.' });

  try {
    const { tokens } = await gmailOAuth2Client.getToken(code);
    await pool.query(
      `INSERT INTO user_google_tokens (user_id, access_token, refresh_token, expiry_date, updated_at)
       VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (user_id) 
       DO UPDATE SET access_token=EXCLUDED.access_token, refresh_token=EXCLUDED.refresh_token, expiry_date=EXCLUDED.expiry_date, updated_at=NOW();`,
      [userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date]
    );
    res.status(200).send('Google configuration linked. You may securely close this window.');
  } catch (error) { next(error); }
};

const processUserInbox = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const dbResult = await pool.query('SELECT * FROM user_google_tokens WHERE user_id = $1 LIMIT 1;', [userId]);
    if (dbResult.rows.length === 0) return res.status(404).json({ success: false, message: 'OAuth credentials unlinked.' });

    const creds = dbResult.rows[0];
    gmailOAuth2Client.setCredentials({
      access_token: creds.access_token, refresh_token: creds.refresh_token, expiry_date: Number(creds.expiry_date)
    });

    gmailOAuth2Client.on('tokens', async (updatedTokens) => {
      if (updatedTokens.access_token) {
        await pool.query('UPDATE user_google_tokens SET access_token=$1, expiry_date=$2, updated_at=NOW() WHERE user_id=$3;',
          [updatedTokens.access_token, updatedTokens.expiry_date || Date.now() + 3600000, userId]);
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: gmailOAuth2Client });
    const list = await gmail.users.messages.list({ userId: 'me', maxResults: 1, q: 'is:unread' });
    
    if (!list.data.messages || list.data.messages.length === 0) {
      return res.status(200).json({ success: true, message: 'Inbox clean. No unread emails.' });
    }

    const msgId = list.data.messages[0].id;
    const mailData = await gmail.users.messages.get({ userId: 'me', id: msgId, format: 'full' });

    let emailText = mailData.data.snippet;
    if (mailData.data.payload) {
      const derivedText = extractEmailBody(mailData.data.payload);
      if (derivedText.trim()) emailText = derivedText;
    }

    return res.status(200).json({
      success: true,
      emailId: msgId,
      snippet: mailData.data.snippet,
      fullBody: emailText
    });
  } catch (error) { next(error); }
};

module.exports = { initiateGoogleAuth, handleGoogleCallback, processUserInbox };

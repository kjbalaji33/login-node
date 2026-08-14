const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { loginOAuth2Client } = require('../config/google');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const initiateGoogleLogin = (req, res) => {
  const authUrl = loginOAuth2Client.generateAuthUrl({
    access_type: 'online',
    scope: ['https://googleapis.com', 'https://googleapis.com'],
    prompt: 'select_account'
  });
  res.redirect(authUrl);
};

const handleGoogleLoginCallback = async (req, res, next) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ success: false, message: 'Google authentication code missing.' });

  try {
    const { tokens } = await loginOAuth2Client.getToken(code);
    loginOAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: loginOAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    const normalizedEmail = userInfo.data.email.toLowerCase().trim();

    const dbResult = await pool.query('SELECT id, email FROM users WHERE email = $1 LIMIT 1;', [normalizedEmail]);
    let user;

    if (dbResult.rows.length === 0) {
      const createRes = await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email;',
        [normalizedEmail, 'OAUTH_EXTERNAL_USER_HASH_PLACEHOLDER']
      );
      user = createRes.rows[0];
    } else {
      user = dbResult.rows[0];
    }

    const appToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    return res.redirect(`http://localhost:4200/login-callback?token=${appToken}`);
  } catch (error) {
    logger.error(`SSO Handshake crashed: ${error.message}`);
    return res.redirect('http://localhost:4200/login?error=oauth_failed');
  }
};

module.exports = { initiateGoogleLogin, handleGoogleLoginCallback };

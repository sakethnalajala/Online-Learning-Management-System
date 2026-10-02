const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: String(user._id), type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);

const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  issueTokens,
};

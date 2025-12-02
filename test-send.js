// test-send.js -- run locally to verify email sending
import dotenv from 'dotenv';
dotenv.config();

import { sendOtpEmail } from './utils/email.js';

(async()=>{
  const to = process.env.TEST_EMAIL || 'sonivedang7@gmail.com';
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const r = await sendOtpEmail(to, otp);
  console.log('RESULT:', r);
  process.exit(0);
})();

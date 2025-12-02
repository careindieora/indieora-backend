// test-send.js
import dotenv from 'dotenv';
dotenv.config();
import { sendOtpEmail } from './path/to/your/helper.js'; // point to the file where you defined sendOtpEmail

(async ()=>{
  try {
    const info = await sendOtpEmail('you@yourdomain.com', '123456'); // test recipient
    console.log('sent', info);
    process.exit(0);
  } catch (err) {
    console.error('send failed', err);
    process.exit(1);
  }
})();

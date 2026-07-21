import { Zalo } from 'zca-js';
import fs from 'fs';
import config from '../config.js';

async function test() {
  const credPath = config.zalo.credentialsPath;
  if (!fs.existsSync(credPath)) {
    console.error('No credentials file found.');
    return;
  }
  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  const zalo = new Zalo({ selfListen: false });
  const api = await zalo.login({
    cookie: credentials.cookies,
    imei: credentials.imei,
    userAgent: credentials.userAgent,
  });
  console.log('LoggedIn successfully!');

  const testId = config.zalo.adminId || '4158999347555777303';
  console.log(`Querying getUserInfo for: ${testId}`);
  try {
    const userInfo = await api.getUserInfo(testId);
    console.log('RESULT TYPE:', typeof userInfo);
    console.log('RESULT KEYS:', Object.keys(userInfo));
    console.log('RAW RESULT:', JSON.stringify(userInfo, null, 2));
  } catch (err) {
    console.error('Error fetching user info:', err);
  }
  process.exit(0);
}

test();

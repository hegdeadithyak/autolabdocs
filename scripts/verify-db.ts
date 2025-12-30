import { db } from '../lib/db';

async function main() {
  try {
    console.log("Connecting to DB...");
    const users = await db.user.count();
    console.log("Connection successful. User count:", users);
  } catch (e) {
    console.error("Connection failed:", e);
  }
}
main();

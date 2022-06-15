import "dotenv/config";
import { makeAdmin } from "../auth/queries";

(async () => {
  try {
    const email = process.argv[2];
    await makeAdmin(email);
    console.log(`${email} now all roles, including admin`);
  } catch (err) {
    console.error(err);
  }
})();

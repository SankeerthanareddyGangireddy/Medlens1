import { ensureDemoUser } from "../src/lib/users";
import { loadDemoPatient } from "../src/lib/services/demo";

async function main() {
  const user = await ensureDemoUser();
  await loadDemoPatient(user.id);
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});

/**
 * One-shot script: seed the Firestore `schools` collection with the canonical
 * Liberian schools list from the mobile app (`SCHOOLS_LIST` in
 * `artifacts/mobile/context/FeedContext.tsx` — 24 universities + 52 high schools).
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run seed-schools
 *
 * Idempotent: keyed on (lowercased name + county), so re-running won't create
 * duplicates. Existing docs are left untouched (so admin-edited counts/details
 * are preserved).
 *
 * Requires the FIREBASE_SERVICE_ACCOUNT secret (same one used by grant-admin).
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type SchoolType = "university" | "high_school";

interface SeedSchool {
  name: string;
  type: SchoolType;
  location: string;
  county: string;
}

// Mirror of SCHOOLS_LIST from artifacts/mobile/context/FeedContext.tsx,
// split into `location` (city) and `county` to match the Firestore schema.
const SCHOOLS: SeedSchool[] = [
  // ─── Universities & Colleges ───────────────────────────────────────────────
  { name: "University of Liberia", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Cuttington University", type: "university", location: "Suakoko", county: "Bong" },
  { name: "United Methodist University", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "African Methodist Episcopal University (AMEU)", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "African Methodist Episcopal Zion University (AMEZU)", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Stella Maris Polytechnic", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Starz University", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Adventist University of West Africa (AUWA)", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Benson Votech University", type: "university", location: "Kakata", county: "Margibi" },
  { name: "A.M. Dogliotti College of Medicine", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "William V.S. Tubman University", type: "university", location: "Harper", county: "Maryland" },
  { name: "Telcom University of Liberia", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Diaconia University", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Lofa Community College", type: "university", location: "Voinjama", county: "Lofa" },
  { name: "Bong County Technical College", type: "university", location: "Gbarnga", county: "Bong" },
  { name: "Nimba County Community College", type: "university", location: "Sanniquellie", county: "Nimba" },
  { name: "Grand Bassa Community College", type: "university", location: "Buchanan", county: "Grand Bassa" },
  { name: "Liberia Baptist Theological Seminary", type: "university", location: "Paynesville", county: "Montserrado" },
  { name: "Mother Patern College of Health Sciences", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Don Bosco Polytechnic Institute", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "Smythe Institute of Management & Technology", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "BlueCrest University College", type: "university", location: "Monrovia", county: "Montserrado" },
  { name: "African Bible College University", type: "university", location: "Yekepa", county: "Nimba" },
  { name: "LICOSESS — Liberia International Christian College", type: "university", location: "Ganta", county: "Nimba" },

  // ─── High Schools — Montserrado County ─────────────────────────────────────
  { name: "College of West Africa (CWA)", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Monrovia Consolidated School System (MCSS)", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Capitol Hill High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "St. Patrick's High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "St. Teresa's Convent High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "St. Gregory Catholic School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "B.W. Harris Episcopal High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "New Testament High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Buduburam Community School", type: "high_school", location: "Buduburam", county: "Montserrado" },
  { name: "G.W. Gibson High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "D. Twe Memorial High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "William V.S. Tubman High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "G.W. Harley High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Haywood Mission High School", type: "high_school", location: "Arthington", county: "Montserrado" },
  { name: "Bishop John Collins High School", type: "high_school", location: "Caldwell", county: "Montserrado" },
  { name: "Effort Baptist High School", type: "high_school", location: "Paynesville", county: "Montserrado" },
  { name: "Ricks Institute", type: "high_school", location: "Virginia", county: "Montserrado" },
  { name: "Carver Mission School", type: "high_school", location: "Brewerville", county: "Montserrado" },
  { name: "Liberia Christian High School", type: "high_school", location: "Paynesville", county: "Montserrado" },
  { name: "Cathedral Catholic High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "St. Mary's Catholic High School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Christ the King Catholic School", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Lutheran Training Institute", type: "high_school", location: "Salayea", county: "Lofa" },
  { name: "Daniel E. Howard Memorial High", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Doe Community High School", type: "high_school", location: "Paynesville", county: "Montserrado" },

  // ─── High Schools — Margibi County ─────────────────────────────────────────
  { name: "Booker Washington Institute (BWI)", type: "high_school", location: "Kakata", county: "Margibi" },
  { name: "Kakata Rural Teacher Training Institute", type: "high_school", location: "Kakata", county: "Margibi" },
  { name: "C.H. Rennie Hospital High School", type: "high_school", location: "Kakata", county: "Margibi" },
  { name: "Firestone High School", type: "high_school", location: "Harbel", county: "Margibi" },

  // ─── High Schools — Bong County ────────────────────────────────────────────
  { name: "Bong Mines High School", type: "high_school", location: "Bong Mines", county: "Bong" },
  { name: "Gbarnga Central High School", type: "high_school", location: "Gbarnga", county: "Bong" },
  { name: "C.H. Henries Memorial High School", type: "high_school", location: "Gbarnga", county: "Bong" },

  // ─── High Schools — Nimba County ───────────────────────────────────────────
  { name: "Sanniquellie Central High School", type: "high_school", location: "Sanniquellie", county: "Nimba" },
  { name: "Ganta United Methodist High School", type: "high_school", location: "Ganta", county: "Nimba" },
  { name: "ELWA Academy", type: "high_school", location: "Monrovia", county: "Montserrado" },
  { name: "Yekepa LAMCO High School", type: "high_school", location: "Yekepa", county: "Nimba" },
  { name: "Tappita Central High School", type: "high_school", location: "Tappita", county: "Nimba" },

  // ─── High Schools — Lofa County ────────────────────────────────────────────
  { name: "Voinjama Multilateral High School", type: "high_school", location: "Voinjama", county: "Lofa" },
  { name: "Zorzor Central High School", type: "high_school", location: "Zorzor", county: "Lofa" },
  { name: "Foya Central High School", type: "high_school", location: "Foya", county: "Lofa" },

  // ─── High Schools — Grand Gedeh ────────────────────────────────────────────
  { name: "Zwedru Multilateral High School", type: "high_school", location: "Zwedru", county: "Grand Gedeh" },
  { name: "Tubman Wilson Institute", type: "high_school", location: "Zwedru", county: "Grand Gedeh" },

  // ─── High Schools — Bomi, Grand Cape Mount, Gbarpolu, Grand Bassa ─────────
  { name: "Tubmanburg Central High School", type: "high_school", location: "Tubmanburg", county: "Bomi" },
  { name: "Robertsport Central High School", type: "high_school", location: "Robertsport", county: "Grand Cape Mount" },
  { name: "Bopolu High School", type: "high_school", location: "Bopolu", county: "Gbarpolu" },
  { name: "Buchanan Central High School", type: "high_school", location: "Buchanan", county: "Grand Bassa" },
  { name: "St. Peter Claver Catholic High", type: "high_school", location: "Buchanan", county: "Grand Bassa" },

  // ─── High Schools — Maryland, Grand Kru, River Gee, Sinoe, River Cess ─────
  { name: "Cape Palmas High School", type: "high_school", location: "Harper", county: "Maryland" },
  { name: "Barclayville Central High", type: "high_school", location: "Barclayville", county: "Grand Kru" },
  { name: "Fish Town Central High", type: "high_school", location: "Fish Town", county: "River Gee" },
  { name: "Greenville Multilateral High", type: "high_school", location: "Greenville", county: "Sinoe" },
  { name: "Cestos City Central High", type: "high_school", location: "Cestos City", county: "River Cess" },
];

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  fail(
    "FIREBASE_SERVICE_ACCOUNT environment variable is not set.\n" +
      "Add it as a secret with the JSON contents of your Firebase service account key."
  );
}

let serviceAccount: Record<string, unknown>;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {
  fail(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${(err as Error).message}`);
}

if (getApps().length === 0) {
  initializeApp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credential: cert(serviceAccount as any),
  });
}

// Match the mobile/admin convention: explicitly use the "default" database.
const db = getFirestore("default");

function key(name: string, county: string): string {
  return `${name.trim().toLowerCase()}|${county.trim().toLowerCase()}`;
}

async function main() {
  console.log(`\nSeeding ${SCHOOLS.length} Liberian schools into Firestore…\n`);

  const col = db.collection("schools");
  const existingSnap = await col.get();
  const existingKeys = new Set<string>();
  for (const d of existingSnap.docs) {
    const data = d.data();
    const n = typeof data.name === "string" ? data.name : "";
    const c = typeof data.county === "string" ? data.county : "";
    if (n) existingKeys.add(key(n, c));
  }
  console.log(`Found ${existingKeys.size} existing schools.`);

  let created = 0;
  let skipped = 0;

  // Use batched writes (max 500 per batch — well within limits here).
  let batch = db.batch();
  let inBatch = 0;

  for (const s of SCHOOLS) {
    if (existingKeys.has(key(s.name, s.county))) {
      skipped++;
      continue;
    }
    const ref = col.doc();
    batch.set(ref, {
      name: s.name,
      type: s.type,
      location: s.location,
      county: s.county,
      userCount: 0,
      createdAt: new Date(),
    });
    created++;
    inBatch++;
    if (inBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }

  if (inBatch > 0) await batch.commit();

  console.log(`\n✓ Seed complete: ${created} created, ${skipped} skipped (already existed).\n`);
}

main().catch((err) => {
  console.error("\n✗ Unexpected error:", err);
  process.exit(1);
});

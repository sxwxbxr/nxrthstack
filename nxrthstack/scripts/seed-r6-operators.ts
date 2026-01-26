import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Common R6 Siege Attachments
const commonSights = ["Red Dot A", "Red Dot B", "Red Dot C", "Holo A", "Holo B", "Holo C", "Holo D", "Reflex A", "Reflex B", "Reflex C"];
const magnifiedSights = ["1.5x Scope", "2.0x Scope", "2.5x Scope A", "2.5x Scope B", "3.0x Scope"];
const sniperSights = ["3.0x Scope", "4.0x Scope", "5.0x Scope", "12.0x Scope"];
const commonBarrels = ["Flash Hider", "Compensator", "Muzzle Brake", "Suppressor", "Extended Barrel"];
const commonGrips = ["Vertical Grip", "Angled Grip"];
const commonUnderbarrels = ["Laser"];

// Rainbow Six Siege Operators Data (as of Year 9)
const operators = [
  // ATTACKERS
  {
    name: "Sledge",
    role: "attacker",
    primaryWeapons: ["M590A1", "L85A2"],
    secondaryWeapons: ["P226 Mk 25", "SMG-11"],
    gadgets: ["Frag Grenade", "Stun Grenade"],
  },
  {
    name: "Thatcher",
    role: "attacker",
    primaryWeapons: ["AR33", "L85A2", "M590A1"],
    secondaryWeapons: ["P226 Mk 25"],
    gadgets: ["Breach Charge", "Claymore"],
  },
  {
    name: "Ash",
    role: "attacker",
    primaryWeapons: ["G36C", "R4-C"],
    secondaryWeapons: ["5.7 USG", "M45 MEUSOC"],
    gadgets: ["Breach Charge", "Claymore"],
  },
  {
    name: "Thermite",
    role: "attacker",
    primaryWeapons: ["M1014", "556xi"],
    secondaryWeapons: ["5.7 USG", "M45 MEUSOC"],
    gadgets: ["Smoke Grenade", "Stun Grenade"],
  },
  {
    name: "Twitch",
    role: "attacker",
    primaryWeapons: ["F2", "417", "SG-CQB"],
    secondaryWeapons: ["P9", "LFP586"],
    gadgets: ["Smoke Grenade", "Claymore"],
  },
  {
    name: "Montagne",
    role: "attacker",
    primaryWeapons: ["Le Roc Shield"],
    secondaryWeapons: ["P9", "LFP586"],
    gadgets: ["Smoke Grenade", "Hard Breach Charge"],
  },
  {
    name: "Glaz",
    role: "attacker",
    primaryWeapons: ["OTs-03"],
    secondaryWeapons: ["PMM", "GSH-18"],
    gadgets: ["Smoke Grenade", "Frag Grenade"],
  },
  {
    name: "Fuze",
    role: "attacker",
    primaryWeapons: ["AK-12", "6P41", "Ballistic Shield"],
    secondaryWeapons: ["PMM", "GSH-18"],
    gadgets: ["Breach Charge", "Hard Breach Charge"],
  },
  {
    name: "Blitz",
    role: "attacker",
    primaryWeapons: ["G52-Tactical Shield"],
    secondaryWeapons: ["P12"],
    gadgets: ["Smoke Grenade", "Breach Charge"],
  },
  {
    name: "IQ",
    role: "attacker",
    primaryWeapons: ["AUG A2", "552 Commando", "G8A1"],
    secondaryWeapons: ["P12"],
    gadgets: ["Breach Charge", "Claymore", "Frag Grenade"],
  },
  {
    name: "Buck",
    role: "attacker",
    primaryWeapons: ["C8-SFW", "CAMRS"],
    secondaryWeapons: ["MK1 9mm", "Gonne-6"],
    gadgets: ["Stun Grenade", "Hard Breach Charge"],
  },
  {
    name: "Blackbeard",
    role: "attacker",
    primaryWeapons: ["MK17 CQB", "SR-25"],
    secondaryWeapons: ["D-50"],
    gadgets: ["Breach Charge", "Stun Grenade"],
  },
  {
    name: "Capitão",
    role: "attacker",
    primaryWeapons: ["PARA-308", "M249"],
    secondaryWeapons: ["PRB92", "Gonne-6"],
    gadgets: ["Claymore", "Hard Breach Charge"],
  },
  {
    name: "Hibana",
    role: "attacker",
    primaryWeapons: ["TYPE-89", "SUPERNOVA"],
    secondaryWeapons: ["P229", "Bearing 9"],
    gadgets: ["Stun Grenade", "Breach Charge"],
  },
  {
    name: "Jackal",
    role: "attacker",
    primaryWeapons: ["C7E", "PDW9", "ITA12L"],
    secondaryWeapons: ["USP40", "ITA12S"],
    gadgets: ["Smoke Grenade", "Claymore"],
  },
  {
    name: "Ying",
    role: "attacker",
    primaryWeapons: ["T-95 LSW", "SIX12"],
    secondaryWeapons: ["Q-929"],
    gadgets: ["Hard Breach Charge", "Smoke Grenade"],
  },
  {
    name: "Zofia",
    role: "attacker",
    primaryWeapons: ["LMG-E", "M762"],
    secondaryWeapons: ["RG15"],
    gadgets: ["Breach Charge", "Claymore"],
  },
  {
    name: "Dokkaebi",
    role: "attacker",
    primaryWeapons: ["Mk 14 EBR", "BOSG.12.2"],
    secondaryWeapons: ["C75 Auto", "SMG-12", "Gonne-6"],
    gadgets: ["Smoke Grenade", "Stun Grenade"],
  },
  {
    name: "Lion",
    role: "attacker",
    primaryWeapons: ["V308", "417", "SG-CQB"],
    secondaryWeapons: ["P9", "LFP586", "Gonne-6"],
    gadgets: ["Stun Grenade", "Claymore"],
  },
  {
    name: "Finka",
    role: "attacker",
    primaryWeapons: ["Spear .308", "6P41", "SASG-12"],
    secondaryWeapons: ["PMM", "GSH-18", "Gonne-6"],
    gadgets: ["Hard Breach Charge", "Stun Grenade"],
  },
  {
    name: "Maverick",
    role: "attacker",
    primaryWeapons: ["AR-15.50", "M4"],
    secondaryWeapons: ["1911 TACOPS"],
    gadgets: ["Stun Grenade", "Claymore"],
  },
  {
    name: "Nomad",
    role: "attacker",
    primaryWeapons: ["AK-74M", "ARX200"],
    secondaryWeapons: [".44 Mag Semi-Auto"],
    gadgets: ["Breach Charge", "Stun Grenade"],
  },
  {
    name: "Gridlock",
    role: "attacker",
    primaryWeapons: ["F90", "M249 SAW"],
    secondaryWeapons: ["Super Shorty", "SDP 9mm"],
    gadgets: ["Smoke Grenade", "Breach Charge"],
  },
  {
    name: "Nøkk",
    role: "attacker",
    primaryWeapons: ["FMG-9", "SIX12 SD"],
    secondaryWeapons: ["5.7 USG", "D-50"],
    gadgets: ["Hard Breach Charge", "Frag Grenade"],
  },
  {
    name: "Amaru",
    role: "attacker",
    primaryWeapons: ["G8A1", "SUPERNOVA"],
    secondaryWeapons: ["SMG-11", "ITA12S", "Gonne-6"],
    gadgets: ["Hard Breach Charge", "Stun Grenade"],
  },
  {
    name: "Kali",
    role: "attacker",
    primaryWeapons: ["CSRX 300"],
    secondaryWeapons: ["SPSMG9", "C75 Auto"],
    gadgets: ["Breach Charge", "Claymore"],
  },
  {
    name: "Iana",
    role: "attacker",
    primaryWeapons: ["ARX200", "G36C"],
    secondaryWeapons: ["MK1 9mm", "Gonne-6"],
    gadgets: ["Frag Grenade", "Smoke Grenade"],
  },
  {
    name: "Ace",
    role: "attacker",
    primaryWeapons: ["AK-12", "M1014"],
    secondaryWeapons: ["P9"],
    gadgets: ["Breach Charge", "Claymore"],
  },
  {
    name: "Zero",
    role: "attacker",
    primaryWeapons: ["SC3000K", "MP7"],
    secondaryWeapons: ["5.7 USG", "Gonne-6"],
    gadgets: ["Hard Breach Charge", "Claymore"],
  },
  {
    name: "Flores",
    role: "attacker",
    primaryWeapons: ["AR-33", "SR-25"],
    secondaryWeapons: ["GSH-18"],
    gadgets: ["Stun Grenade", "Claymore"],
  },
  {
    name: "Osa",
    role: "attacker",
    primaryWeapons: ["556xi", "PDW9"],
    secondaryWeapons: ["PMM"],
    gadgets: ["Smoke Grenade", "Claymore"],
  },
  {
    name: "Sens",
    role: "attacker",
    primaryWeapons: ["POF-9", "417"],
    secondaryWeapons: ["SDP 9mm", "Gonne-6"],
    gadgets: ["Hard Breach Charge", "Claymore"],
  },
  {
    name: "Grim",
    role: "attacker",
    primaryWeapons: ["552 Commando", "SG-CQB"],
    secondaryWeapons: ["P229", "Bailiff 410"],
    gadgets: ["Breach Charge", "Claymore"],
  },
  {
    name: "Brava",
    role: "attacker",
    primaryWeapons: ["PARA-308", "CAMRS"],
    secondaryWeapons: ["Super Shorty", "USP40"],
    gadgets: ["Smoke Grenade", "Claymore"],
  },
  {
    name: "Ram",
    role: "attacker",
    primaryWeapons: ["R4-C", "LMG-E"],
    secondaryWeapons: ["ITA12S", "MK1 9mm"],
    gadgets: ["Smoke Grenade", "Stun Grenade"],
  },
  {
    name: "Deimos",
    role: "attacker",
    primaryWeapons: ["AK-74M", "M590A1"],
    secondaryWeapons: [".44 Mag Semi-Auto"],
    gadgets: ["Hard Breach Charge", "Frag Grenade"],
  },

  // DEFENDERS
  {
    name: "Smoke",
    role: "defender",
    primaryWeapons: ["FMG-9", "M590A1"],
    secondaryWeapons: ["P226 Mk 25", "SMG-11"],
    gadgets: ["Deployable Shield", "Barbed Wire"],
  },
  {
    name: "Mute",
    role: "defender",
    primaryWeapons: ["MP5K", "M590A1"],
    secondaryWeapons: ["P226 Mk 25", "SMG-11"],
    gadgets: ["Nitro Cell", "Bulletproof Camera"],
  },
  {
    name: "Castle",
    role: "defender",
    primaryWeapons: ["UMP45", "M1014"],
    secondaryWeapons: ["5.7 USG", "Super Shorty"],
    gadgets: ["Bulletproof Camera", "Proximity Alarm"],
  },
  {
    name: "Pulse",
    role: "defender",
    primaryWeapons: ["UMP45", "M1014"],
    secondaryWeapons: ["5.7 USG", "M45 MEUSOC"],
    gadgets: ["Nitro Cell", "Deployable Shield"],
  },
  {
    name: "Doc",
    role: "defender",
    primaryWeapons: ["MP5", "P90", "SG-CQB"],
    secondaryWeapons: ["P9", "LFP586", "Bailiff 410"],
    gadgets: ["Bulletproof Camera", "Barbed Wire"],
  },
  {
    name: "Rook",
    role: "defender",
    primaryWeapons: ["MP5", "P90", "SG-CQB"],
    secondaryWeapons: ["P9", "LFP586"],
    gadgets: ["Impact Grenade", "Proximity Alarm"],
  },
  {
    name: "Kapkan",
    role: "defender",
    primaryWeapons: ["9x19VSN", "SASG-12"],
    secondaryWeapons: ["PMM", "GSH-18"],
    gadgets: ["Impact Grenade", "Nitro Cell"],
  },
  {
    name: "Tachanka",
    role: "defender",
    primaryWeapons: ["DP27", "9x19VSN"],
    secondaryWeapons: ["GSH-18", "PMM", "Bearing 9"],
    gadgets: ["Barbed Wire", "Deployable Shield"],
  },
  {
    name: "Jäger",
    role: "defender",
    primaryWeapons: ["416-C Carbine", "M870"],
    secondaryWeapons: ["P12"],
    gadgets: ["Bulletproof Camera", "Barbed Wire"],
  },
  {
    name: "Bandit",
    role: "defender",
    primaryWeapons: ["MP7", "M870"],
    secondaryWeapons: ["P12"],
    gadgets: ["Barbed Wire", "Nitro Cell"],
  },
  {
    name: "Frost",
    role: "defender",
    primaryWeapons: ["9mm C1", "Super 90"],
    secondaryWeapons: ["MK1 9mm", "ITA12S"],
    gadgets: ["Bulletproof Camera", "Deployable Shield"],
  },
  {
    name: "Valkyrie",
    role: "defender",
    primaryWeapons: ["MPX", "SPAS-12"],
    secondaryWeapons: ["D-50"],
    gadgets: ["Impact Grenade", "Nitro Cell"],
  },
  {
    name: "Caveira",
    role: "defender",
    primaryWeapons: ["M12", "SPAS-15"],
    secondaryWeapons: ["Luison"],
    gadgets: ["Impact Grenade", "Proximity Alarm"],
  },
  {
    name: "Echo",
    role: "defender",
    primaryWeapons: ["MP5SD", "SUPERNOVA"],
    secondaryWeapons: ["P229", "Bearing 9"],
    gadgets: ["Impact Grenade", "Deployable Shield"],
  },
  {
    name: "Mira",
    role: "defender",
    primaryWeapons: ["Vector .45 ACP", "ITA12L"],
    secondaryWeapons: ["USP40", "ITA12S"],
    gadgets: ["Proximity Alarm", "Nitro Cell"],
  },
  {
    name: "Lesion",
    role: "defender",
    primaryWeapons: ["T-5 SMG", "SIX12 SD"],
    secondaryWeapons: ["Q-929"],
    gadgets: ["Impact Grenade", "Bulletproof Camera"],
  },
  {
    name: "Ela",
    role: "defender",
    primaryWeapons: ["Scorpion EVO 3 A1", "FO-12"],
    secondaryWeapons: ["RG15"],
    gadgets: ["Deployable Shield", "Barbed Wire"],
  },
  {
    name: "Vigil",
    role: "defender",
    primaryWeapons: ["K1A", "BOSG.12.2"],
    secondaryWeapons: ["C75 Auto", "SMG-12"],
    gadgets: ["Bulletproof Camera", "Impact Grenade"],
  },
  {
    name: "Maestro",
    role: "defender",
    primaryWeapons: ["ALDA 5.56", "ACS12"],
    secondaryWeapons: ["Bailiff 410", "Keratos .357"],
    gadgets: ["Barbed Wire", "Impact Grenade"],
  },
  {
    name: "Alibi",
    role: "defender",
    primaryWeapons: ["Mx4 Storm", "ACS12"],
    secondaryWeapons: ["Bailiff 410", "Keratos .357"],
    gadgets: ["Proximity Alarm", "Observation Blocker"],
  },
  {
    name: "Clash",
    role: "defender",
    primaryWeapons: ["CCE Shield"],
    secondaryWeapons: ["Super Shorty", "SPSMG9", "P-10C"],
    gadgets: ["Barbed Wire", "Impact Grenade"],
  },
  {
    name: "Kaid",
    role: "defender",
    primaryWeapons: ["AUG A3", "TCSG12"],
    secondaryWeapons: [".44 Mag Semi-Auto"],
    gadgets: ["Nitro Cell", "Barbed Wire"],
  },
  {
    name: "Mozzie",
    role: "defender",
    primaryWeapons: ["Commando 9", "P10 RONI"],
    secondaryWeapons: ["SDP 9mm"],
    gadgets: ["Barbed Wire", "Nitro Cell"],
  },
  {
    name: "Warden",
    role: "defender",
    primaryWeapons: ["M590A1", "MPX"],
    secondaryWeapons: ["P-10C", "SMG-12"],
    gadgets: ["Deployable Shield", "Nitro Cell"],
  },
  {
    name: "Goyo",
    role: "defender",
    primaryWeapons: ["Vector .45 ACP", "TCSG12"],
    secondaryWeapons: ["P229"],
    gadgets: ["Nitro Cell", "Proximity Alarm"],
  },
  {
    name: "Wamai",
    role: "defender",
    primaryWeapons: ["AUG A2", "MP5K"],
    secondaryWeapons: ["P12", "Keratos .357"],
    gadgets: ["Impact Grenade", "Proximity Alarm"],
  },
  {
    name: "Oryx",
    role: "defender",
    primaryWeapons: ["T-5 SMG", "SPAS-12"],
    secondaryWeapons: ["Bailiff 410", "USP40"],
    gadgets: ["Barbed Wire", "Proximity Alarm"],
  },
  {
    name: "Melusi",
    role: "defender",
    primaryWeapons: ["MP5", "Super 90"],
    secondaryWeapons: ["RG15"],
    gadgets: ["Bulletproof Camera", "Impact Grenade"],
  },
  {
    name: "Aruni",
    role: "defender",
    primaryWeapons: ["P10 RONI", "Mk 14 EBR"],
    secondaryWeapons: ["PRB92"],
    gadgets: ["Barbed Wire", "Bulletproof Camera"],
  },
  {
    name: "Thunderbird",
    role: "defender",
    primaryWeapons: ["Spear .308", "SPAS-15"],
    secondaryWeapons: ["Bearing 9", "Q-929"],
    gadgets: ["Impact Grenade", "Nitro Cell"],
  },
  {
    name: "Thorn",
    role: "defender",
    primaryWeapons: ["UZK50GI", "M870"],
    secondaryWeapons: ["1911 TACOPS", "C75 Auto"],
    gadgets: ["Deployable Shield", "Barbed Wire"],
  },
  {
    name: "Azami",
    role: "defender",
    primaryWeapons: ["9x19VSN", "ACS12"],
    secondaryWeapons: ["D-50"],
    gadgets: ["Impact Grenade", "Barbed Wire"],
  },
  {
    name: "Solis",
    role: "defender",
    primaryWeapons: ["P90", "ITA12L"],
    secondaryWeapons: ["SMG-11"],
    gadgets: ["Bulletproof Camera", "Impact Grenade"],
  },
  {
    name: "Fenrir",
    role: "defender",
    primaryWeapons: ["MP7", "SASG-12"],
    secondaryWeapons: ["Bailiff 410", "5.7 USG"],
    gadgets: ["Bulletproof Camera", "Barbed Wire"],
  },
  {
    name: "Tubarão",
    role: "defender",
    primaryWeapons: ["MPX", "AR-15.50"],
    secondaryWeapons: ["P226 Mk 25"],
    gadgets: ["Nitro Cell", "Proximity Alarm"],
  },
  {
    name: "Skopos",
    role: "defender",
    primaryWeapons: ["MP5", "M1014"],
    secondaryWeapons: ["P12", "Bailiff 410"],
    gadgets: ["Observation Blocker", "Impact Grenade"],
  },
];

// Get attachments based on operator role and weapons
function getOperatorAttachments(op: typeof operators[0]) {
  // Attackers generally have access to magnified sights
  const sights = op.role === "attacker"
    ? [...commonSights, ...magnifiedSights]
    : commonSights;

  // Special cases for snipers (Glaz, Kali)
  const isSniperOp = ["Glaz", "Kali"].includes(op.name);
  const finalSights = isSniperOp ? [...sights, ...sniperSights] : sights;

  // Shield operators have limited attachments
  const isShieldOp = ["Montagne", "Blitz", "Fuze", "Clash"].includes(op.name) &&
    op.primaryWeapons.some(w => w.includes("Shield"));

  if (isShieldOp) {
    return {
      sights: [],
      barrels: [],
      grips: [],
      underbarrels: ["Laser"],
    };
  }

  return {
    sights: finalSights,
    barrels: commonBarrels,
    grips: commonGrips,
    underbarrels: commonUnderbarrels,
  };
}

async function seed() {
  console.log("Seeding R6 operators...");

  for (const op of operators) {
    try {
      const attachments = getOperatorAttachments(op);

      await db
        .insert(schema.r6Operators)
        .values({
          name: op.name,
          role: op.role,
          primaryWeapons: op.primaryWeapons,
          secondaryWeapons: op.secondaryWeapons,
          gadgets: op.gadgets,
          sights: attachments.sights,
          barrels: attachments.barrels,
          grips: attachments.grips,
          underbarrels: attachments.underbarrels,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: schema.r6Operators.name,
          set: {
            role: op.role,
            primaryWeapons: op.primaryWeapons,
            secondaryWeapons: op.secondaryWeapons,
            gadgets: op.gadgets,
            sights: attachments.sights,
            barrels: attachments.barrels,
            grips: attachments.grips,
            underbarrels: attachments.underbarrels,
          },
        });

      console.log(`  ✓ ${op.name}`);
    } catch (error) {
      console.error(`  ✗ ${op.name}:`, error);
    }
  }

  console.log("\nSeeding complete!");
  console.log(`Total operators: ${operators.length}`);
  console.log(
    `Attackers: ${operators.filter((o) => o.role === "attacker").length}`
  );
  console.log(
    `Defenders: ${operators.filter((o) => o.role === "defender").length}`
  );
}

seed().catch(console.error);

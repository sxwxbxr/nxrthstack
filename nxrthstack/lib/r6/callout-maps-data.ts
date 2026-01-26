export interface Callout {
  id: string;
  name: string;
  shortName?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  floor: number; // 0 = basement, 1 = ground, 2 = second, etc.
  type: "room" | "hallway" | "stairway" | "outside" | "objective";
  description?: string;
}

export interface R6Map {
  id: string;
  name: string;
  floors: number;
  floorNames: string[];
  imagePrefix: string; // for future image support
  callouts: Callout[];
}

// Note: Coordinates are approximate percentages for a standardized map layout
// In production, you'd adjust these based on actual map images

export const r6Maps: R6Map[] = [
  {
    id: "bank",
    name: "Bank",
    floors: 3,
    floorNames: ["Basement", "Ground Floor", "Second Floor"],
    imagePrefix: "bank",
    callouts: [
      // Basement
      { id: "bank-vault", name: "Vault", shortName: "Vault", x: 45, y: 55, floor: 0, type: "objective" },
      { id: "bank-lockers", name: "Lockers", shortName: "Lock", x: 30, y: 50, floor: 0, type: "room" },
      { id: "bank-cctv", name: "CCTV Room", shortName: "CCTV", x: 60, y: 40, floor: 0, type: "room" },
      { id: "bank-server", name: "Server Room", shortName: "Servers", x: 70, y: 55, floor: 0, type: "room" },
      { id: "bank-garage", name: "Garage", shortName: "Garage", x: 20, y: 70, floor: 0, type: "room" },
      { id: "bank-blue", name: "Blue Stairs", shortName: "Blue", x: 15, y: 30, floor: 0, type: "stairway" },
      { id: "bank-red", name: "Red Stairs", shortName: "Red", x: 85, y: 30, floor: 0, type: "stairway" },
      // Ground Floor
      { id: "bank-lobby", name: "Main Lobby", shortName: "Lobby", x: 50, y: 30, floor: 1, type: "room" },
      { id: "bank-tellers", name: "Tellers", shortName: "Tellers", x: 50, y: 50, floor: 1, type: "objective" },
      { id: "bank-archives", name: "Archives", shortName: "Arch", x: 30, y: 60, floor: 1, type: "objective" },
      { id: "bank-office", name: "Open Area Office", shortName: "Open", x: 70, y: 50, floor: 1, type: "room" },
      { id: "bank-admin", name: "Admin Office", shortName: "Admin", x: 70, y: 70, floor: 1, type: "room" },
      { id: "bank-front", name: "Front Door", shortName: "Front", x: 50, y: 10, floor: 1, type: "outside" },
      // Second Floor
      { id: "bank-ceo", name: "CEO Office", shortName: "CEO", x: 40, y: 40, floor: 2, type: "objective" },
      { id: "bank-exec", name: "Executive Hallway", shortName: "Exec", x: 50, y: 30, floor: 2, type: "hallway" },
      { id: "bank-conf", name: "Conference Room", shortName: "Conf", x: 65, y: 50, floor: 2, type: "room" },
      { id: "bank-janitor", name: "Janitor", shortName: "Jan", x: 80, y: 30, floor: 2, type: "room" },
      { id: "bank-stock", name: "Stock Room", shortName: "Stock", x: 25, y: 55, floor: 2, type: "room" },
    ],
  },
  {
    id: "clubhouse",
    name: "Clubhouse",
    floors: 3,
    floorNames: ["Basement", "Ground Floor", "Second Floor"],
    imagePrefix: "clubhouse",
    callouts: [
      // Basement
      { id: "club-church", name: "Church", shortName: "Church", x: 35, y: 55, floor: 0, type: "objective" },
      { id: "club-arsenal", name: "Arsenal Room", shortName: "Arsenal", x: 55, y: 55, floor: 0, type: "objective" },
      { id: "club-blue", name: "Blue Tunnel", shortName: "Blue", x: 20, y: 40, floor: 0, type: "hallway" },
      { id: "club-memorial", name: "Memorial Room", shortName: "Memorial", x: 70, y: 35, floor: 0, type: "room" },
      { id: "club-oil", name: "Oil Pit", shortName: "Oil", x: 45, y: 70, floor: 0, type: "room" },
      // Ground Floor
      { id: "club-bar", name: "Bar", shortName: "Bar", x: 35, y: 40, floor: 1, type: "objective" },
      { id: "club-stage", name: "Stage", shortName: "Stage", x: 35, y: 60, floor: 1, type: "room" },
      { id: "club-stock", name: "Stock Room", shortName: "Stock", x: 55, y: 45, floor: 1, type: "objective" },
      { id: "club-garage", name: "Garage", shortName: "Garage", x: 70, y: 55, floor: 1, type: "room" },
      { id: "club-lobby", name: "Central Hallway", shortName: "Central", x: 45, y: 35, floor: 1, type: "hallway" },
      { id: "club-strip", name: "Strip Club", shortName: "Strip", x: 25, y: 50, floor: 1, type: "room" },
      // Second Floor
      { id: "club-cash", name: "Cash Room", shortName: "Cash", x: 35, y: 40, floor: 2, type: "objective" },
      { id: "club-cctv", name: "CCTV", shortName: "CCTV", x: 55, y: 40, floor: 2, type: "objective" },
      { id: "club-bedroom", name: "Bedroom", shortName: "Bed", x: 40, y: 60, floor: 2, type: "room" },
      { id: "club-gym", name: "Gym", shortName: "Gym", x: 65, y: 55, floor: 2, type: "room" },
      { id: "club-bath", name: "Bathroom", shortName: "Bath", x: 50, y: 70, floor: 2, type: "room" },
      { id: "club-logistic", name: "Logistics Office", shortName: "Log", x: 70, y: 35, floor: 2, type: "room" },
    ],
  },
  {
    id: "oregon",
    name: "Oregon",
    floors: 3,
    floorNames: ["Basement", "Ground Floor", "Second Floor"],
    imagePrefix: "oregon",
    callouts: [
      // Basement
      { id: "oregon-laundry", name: "Laundry Room", shortName: "Laundry", x: 30, y: 50, floor: 0, type: "objective" },
      { id: "oregon-supply", name: "Supply Room", shortName: "Supply", x: 50, y: 50, floor: 0, type: "objective" },
      { id: "oregon-blue", name: "Blue Bunker", shortName: "Blue", x: 70, y: 40, floor: 0, type: "room" },
      { id: "oregon-freezer", name: "Freezer", shortName: "Freezer", x: 25, y: 35, floor: 0, type: "room" },
      { id: "oregon-electric", name: "Electric Room", shortName: "Elec", x: 60, y: 60, floor: 0, type: "room" },
      // Ground Floor
      { id: "oregon-kitchen", name: "Kitchen", shortName: "Kitchen", x: 30, y: 40, floor: 1, type: "objective" },
      { id: "oregon-dining", name: "Dining Hall", shortName: "Dining", x: 45, y: 45, floor: 1, type: "objective" },
      { id: "oregon-meeting", name: "Meeting Hall", shortName: "Meeting", x: 60, y: 35, floor: 1, type: "room" },
      { id: "oregon-lobby", name: "Lobby", shortName: "Lobby", x: 50, y: 25, floor: 1, type: "room" },
      { id: "oregon-tower", name: "Tower", shortName: "Tower", x: 20, y: 60, floor: 1, type: "stairway" },
      { id: "oregon-big", name: "Big Tower", shortName: "Big", x: 75, y: 55, floor: 1, type: "stairway" },
      // Second Floor
      { id: "oregon-dorm", name: "Kids Dorms", shortName: "Dorms", x: 35, y: 45, floor: 2, type: "objective" },
      { id: "oregon-attic", name: "Attic", shortName: "Attic", x: 55, y: 40, floor: 2, type: "objective" },
      { id: "oregon-armory", name: "Armory", shortName: "Armory", x: 70, y: 50, floor: 2, type: "room" },
      { id: "oregon-master", name: "Master Bedroom", shortName: "Master", x: 25, y: 55, floor: 2, type: "room" },
      { id: "oregon-walk", name: "Walk-in", shortName: "Walk", x: 30, y: 35, floor: 2, type: "room" },
    ],
  },
  {
    id: "kafe",
    name: "Kafe Dostoyevsky",
    floors: 3,
    floorNames: ["Ground Floor", "Second Floor", "Third Floor"],
    imagePrefix: "kafe",
    callouts: [
      // Ground Floor
      { id: "kafe-bakery", name: "Bakery", shortName: "Bakery", x: 25, y: 45, floor: 0, type: "room" },
      { id: "kafe-kitchen", name: "Kitchen", shortName: "Kitchen", x: 40, y: 55, floor: 0, type: "objective" },
      { id: "kafe-prep", name: "Kitchen Prep", shortName: "Prep", x: 55, y: 55, floor: 0, type: "room" },
      { id: "kafe-coal", name: "Coal Room", shortName: "Coal", x: 25, y: 70, floor: 0, type: "room" },
      { id: "kafe-white", name: "White Stairs", shortName: "White", x: 70, y: 40, floor: 0, type: "stairway" },
      { id: "kafe-red", name: "Red Stairs", shortName: "Red", x: 35, y: 30, floor: 0, type: "stairway" },
      // Second Floor
      { id: "kafe-train", name: "Train Room", shortName: "Train", x: 30, y: 45, floor: 1, type: "objective" },
      { id: "kafe-fireplace", name: "Fireplace Hall", shortName: "Fire", x: 45, y: 40, floor: 1, type: "objective" },
      { id: "kafe-mining", name: "Mining Room", shortName: "Mining", x: 60, y: 50, floor: 1, type: "room" },
      { id: "kafe-reading", name: "Reading Room", shortName: "Reading", x: 70, y: 35, floor: 1, type: "objective" },
      { id: "kafe-piano", name: "Piano Room", shortName: "Piano", x: 25, y: 60, floor: 1, type: "room" },
      // Third Floor
      { id: "kafe-bar", name: "Bar", shortName: "Bar", x: 35, y: 45, floor: 2, type: "objective" },
      { id: "kafe-cocktail", name: "Cocktail Lounge", shortName: "Cocktail", x: 55, y: 45, floor: 2, type: "objective" },
      { id: "kafe-cigar", name: "Cigar Shop", shortName: "Cigar", x: 70, y: 55, floor: 2, type: "room" },
      { id: "kafe-freezer", name: "Freezer", shortName: "Freezer", x: 25, y: 55, floor: 2, type: "room" },
      { id: "kafe-white3", name: "White Stairs", shortName: "White", x: 75, y: 35, floor: 2, type: "stairway" },
    ],
  },
  {
    id: "consulate",
    name: "Consulate",
    floors: 3,
    floorNames: ["Basement", "Ground Floor", "Second Floor"],
    imagePrefix: "consulate",
    callouts: [
      // Basement
      { id: "con-garage", name: "Garage", shortName: "Garage", x: 30, y: 50, floor: 0, type: "objective" },
      { id: "con-cafeteria", name: "Cafeteria", shortName: "Cafe", x: 55, y: 45, floor: 0, type: "objective" },
      { id: "con-archives", name: "Archives", shortName: "Arch", x: 70, y: 55, floor: 0, type: "room" },
      { id: "con-yellow", name: "Yellow Stairs", shortName: "Yellow", x: 40, y: 30, floor: 0, type: "stairway" },
      { id: "con-spiral", name: "Spiral Stairs", shortName: "Spiral", x: 80, y: 35, floor: 0, type: "stairway" },
      // Ground Floor
      { id: "con-lobby", name: "Main Lobby", shortName: "Lobby", x: 50, y: 35, floor: 1, type: "room" },
      { id: "con-visa", name: "Visa Office", shortName: "Visa", x: 30, y: 50, floor: 1, type: "room" },
      { id: "con-tellers", name: "Tellers", shortName: "Tellers", x: 45, y: 55, floor: 1, type: "objective" },
      { id: "con-press", name: "Press Room", shortName: "Press", x: 70, y: 45, floor: 1, type: "room" },
      { id: "con-service", name: "Service Stairs", shortName: "Service", x: 25, y: 35, floor: 1, type: "stairway" },
      // Second Floor
      { id: "con-consul", name: "Consul Office", shortName: "Consul", x: 35, y: 45, floor: 2, type: "objective" },
      { id: "con-meeting", name: "Meeting Room", shortName: "Meeting", x: 55, y: 45, floor: 2, type: "objective" },
      { id: "con-admin", name: "Admin Office", shortName: "Admin", x: 70, y: 55, floor: 2, type: "room" },
      { id: "con-copy", name: "Copy Room", shortName: "Copy", x: 25, y: 55, floor: 2, type: "room" },
      { id: "con-balcony", name: "Front Balcony", shortName: "Balc", x: 50, y: 20, floor: 2, type: "outside" },
    ],
  },
  {
    id: "chalet",
    name: "Chalet",
    floors: 3,
    floorNames: ["Basement", "Ground Floor", "Second Floor"],
    imagePrefix: "chalet",
    callouts: [
      // Basement
      { id: "chalet-wine", name: "Wine Cellar", shortName: "Wine", x: 35, y: 50, floor: 0, type: "objective" },
      { id: "chalet-snowmobile", name: "Snowmobile Garage", shortName: "Snow", x: 55, y: 50, floor: 0, type: "objective" },
      { id: "chalet-blue", name: "Blue Stairs", shortName: "Blue", x: 25, y: 35, floor: 0, type: "stairway" },
      { id: "chalet-car", name: "Car Garage", shortName: "Car", x: 70, y: 55, floor: 0, type: "room" },
      // Ground Floor
      { id: "chalet-bar", name: "Bar", shortName: "Bar", x: 30, y: 45, floor: 1, type: "objective" },
      { id: "chalet-gaming", name: "Gaming Room", shortName: "Gaming", x: 50, y: 45, floor: 1, type: "objective" },
      { id: "chalet-kitchen", name: "Kitchen", shortName: "Kitchen", x: 35, y: 60, floor: 1, type: "room" },
      { id: "chalet-dining", name: "Dining Room", shortName: "Dining", x: 60, y: 60, floor: 1, type: "room" },
      { id: "chalet-main", name: "Main Entrance", shortName: "Main", x: 50, y: 25, floor: 1, type: "room" },
      { id: "chalet-mud", name: "Mudroom", shortName: "Mud", x: 70, y: 35, floor: 1, type: "room" },
      // Second Floor
      { id: "chalet-master", name: "Master Bedroom", shortName: "Master", x: 35, y: 45, floor: 2, type: "objective" },
      { id: "chalet-office", name: "Office", shortName: "Office", x: 55, y: 45, floor: 2, type: "objective" },
      { id: "chalet-library", name: "Library", shortName: "Library", x: 40, y: 30, floor: 2, type: "room" },
      { id: "chalet-trophy", name: "Trophy Room", shortName: "Trophy", x: 65, y: 55, floor: 2, type: "room" },
      { id: "chalet-mezzanine", name: "Mezzanine", shortName: "Mezz", x: 50, y: 60, floor: 2, type: "hallway" },
    ],
  },
  {
    id: "border",
    name: "Border",
    floors: 2,
    floorNames: ["Ground Floor", "Second Floor"],
    imagePrefix: "border",
    callouts: [
      // Ground Floor
      { id: "border-workshop", name: "Workshop", shortName: "Work", x: 25, y: 45, floor: 0, type: "objective" },
      { id: "border-supply", name: "Supply Room", shortName: "Supply", x: 40, y: 45, floor: 0, type: "room" },
      { id: "border-customs", name: "Customs", shortName: "Customs", x: 55, y: 50, floor: 0, type: "objective" },
      { id: "border-ventilation", name: "Ventilation Room", shortName: "Vent", x: 70, y: 40, floor: 0, type: "objective" },
      { id: "border-tellers", name: "Tellers", shortName: "Tellers", x: 50, y: 30, floor: 0, type: "room" },
      { id: "border-passport", name: "Passport Check", shortName: "Pass", x: 35, y: 25, floor: 0, type: "room" },
      { id: "border-east", name: "East Stairs", shortName: "East", x: 80, y: 30, floor: 0, type: "stairway" },
      { id: "border-west", name: "West Stairs", shortName: "West", x: 20, y: 30, floor: 0, type: "stairway" },
      // Second Floor
      { id: "border-armory", name: "Armory Lockers", shortName: "Armory", x: 30, y: 45, floor: 1, type: "objective" },
      { id: "border-archives", name: "Archives", shortName: "Arch", x: 45, y: 45, floor: 1, type: "objective" },
      { id: "border-offices", name: "Offices", shortName: "Offices", x: 60, y: 50, floor: 1, type: "room" },
      { id: "border-break", name: "Break Room", shortName: "Break", x: 75, y: 45, floor: 1, type: "room" },
      { id: "border-fountain", name: "Fountain", shortName: "Fount", x: 50, y: 25, floor: 1, type: "room" },
      { id: "border-waiting", name: "Waiting Room", shortName: "Wait", x: 35, y: 60, floor: 1, type: "room" },
    ],
  },
  {
    id: "coastline",
    name: "Coastline",
    floors: 2,
    floorNames: ["Ground Floor", "Second Floor"],
    imagePrefix: "coastline",
    callouts: [
      // Ground Floor
      { id: "coast-kitchen", name: "Kitchen", shortName: "Kitchen", x: 30, y: 45, floor: 0, type: "objective" },
      { id: "coast-service", name: "Service Entrance", shortName: "Service", x: 45, y: 50, floor: 0, type: "objective" },
      { id: "coast-blue", name: "Blue Bar", shortName: "Blue", x: 60, y: 40, floor: 0, type: "objective" },
      { id: "coast-sunrise", name: "Sunrise Bar", shortName: "Sunrise", x: 75, y: 45, floor: 0, type: "room" },
      { id: "coast-pool", name: "Pool Entrance", shortName: "Pool", x: 50, y: 25, floor: 0, type: "room" },
      { id: "coast-lobby", name: "Main Lobby", shortName: "Lobby", x: 35, y: 30, floor: 0, type: "room" },
      { id: "coast-cool", name: "Cool Vibes", shortName: "Cool", x: 20, y: 50, floor: 0, type: "room" },
      // Second Floor
      { id: "coast-hookah", name: "Hookah Lounge", shortName: "Hookah", x: 35, y: 45, floor: 1, type: "objective" },
      { id: "coast-billiards", name: "Billiards Room", shortName: "Billiards", x: 50, y: 45, floor: 1, type: "objective" },
      { id: "coast-theater", name: "Theater", shortName: "Theater", x: 65, y: 50, floor: 1, type: "objective" },
      { id: "coast-aqua", name: "Aquarium", shortName: "Aqua", x: 55, y: 30, floor: 1, type: "room" },
      { id: "coast-penthouse", name: "Penthouse", shortName: "Pent", x: 75, y: 35, floor: 1, type: "objective" },
      { id: "coast-vip", name: "VIP Lounge", shortName: "VIP", x: 25, y: 55, floor: 1, type: "room" },
      { id: "coast-hall", name: "Hall of Fame", shortName: "Hall", x: 40, y: 60, floor: 1, type: "hallway" },
    ],
  },
];

export function getMapById(id: string): R6Map | undefined {
  return r6Maps.find((m) => m.id === id);
}

export function getCalloutsByFloor(map: R6Map, floor: number): Callout[] {
  return map.callouts.filter((c) => c.floor === floor);
}

export function searchCallouts(query: string): Array<{ map: R6Map; callout: Callout }> {
  const lowerQuery = query.toLowerCase();
  const results: Array<{ map: R6Map; callout: Callout }> = [];

  r6Maps.forEach((map) => {
    map.callouts.forEach((callout) => {
      if (
        callout.name.toLowerCase().includes(lowerQuery) ||
        callout.shortName?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ map, callout });
      }
    });
  });

  return results;
}

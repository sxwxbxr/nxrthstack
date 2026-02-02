// Constants that can be used in both client and server components

export const GAME_OPTIONS = [
  { value: "r6", label: "Rainbow Six Siege" },
  { value: "minecraft", label: "Minecraft" },
  { value: "pokemon", label: "Pokemon" },
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "Counter-Strike 2" },
  { value: "apex", label: "Apex Legends" },
  { value: "other", label: "Other" },
] as const;

export const ACTIVITY_OPTIONS = [
  { value: "1v1", label: "1v1 Match" },
  { value: "tournament", label: "Tournament" },
  { value: "casual", label: "Casual Play" },
  { value: "ranked", label: "Ranked" },
  { value: "custom", label: "Custom Game" },
  { value: "practice", label: "Practice/Training" },
] as const;

export const RSVP_STATUS = ["going", "maybe", "not_going", "pending"] as const;
export type RsvpStatus = (typeof RSVP_STATUS)[number];

export interface Constellation {
  id: string;
  name: string;
  color: string;
  group: string;
}

export const CONSTELLATIONS: Constellation[] = [
  {
    id: "stations",
    name: "Space Stations",
    color: "#ffffff",
    group: "stations",
  },
  {
    id: "starlink",
    name: "Starlink",
    color: "#ff6b6b",
    group: "starlink",
  },
  {
    id: "gps",
    name: "GPS",
    color: "#4dabf7",
    group: "gps-ops",
  },
  {
    id: "oneweb",
    name: "OneWeb",
    color: "#51cf66",
    group: "oneweb",
  },
  {
    id: "iridium",
    name: "Iridium NEXT",
    color: "#748ffc",
    group: "iridium-NEXT",
  },
  {
    id: "kuiper",
    name: "Kuiper",
    color: "#146eb4",
    group: "kuiper",
  },
  {
    id: "galileo",
    name: "Galileo",
    color: "#ffd43b",
    group: "galileo",
  },
  {
    id: "glo",
    name: "GLONASS",
    color: "#da77f2",
    group: "glo-ops",
  },
  {
    id: "beidou",
    name: "BeiDou",
    color: "#ff922b",
    group: "beidou",
  },
];

export const CONSTELLATION_BY_ID = Object.fromEntries(
  CONSTELLATIONS.map((c) => [c.id, c]),
) as Record<string, Constellation>;
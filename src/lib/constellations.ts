export interface Constellation {
  id: string;
  name: string;
  color: string;
  group: string;
  defaultVisible: boolean;
}

export const CONSTELLATIONS: Constellation[] = [
  {
    id: "stations",
    name: "Space Stations",
    color: "#ffffff",
    group: "stations",
    defaultVisible: true,
  },
  {
    id: "starlink",
    name: "Starlink",
    color: "#ff6b6b",
    group: "starlink",
    defaultVisible: true,
  },
  {
    id: "gps",
    name: "GPS",
    color: "#4dabf7",
    group: "gps-ops",
    defaultVisible: true,
  },
  {
    id: "oneweb",
    name: "OneWeb",
    color: "#51cf66",
    group: "oneweb",
    defaultVisible: true,
  },
  {
    id: "galileo",
    name: "Galileo",
    color: "#ffd43b",
    group: "galileo",
    defaultVisible: true,
  },
  {
    id: "glo",
    name: "GLONASS",
    color: "#da77f2",
    group: "glo-ops",
    defaultVisible: true,
  },
  {
    id: "beidou",
    name: "BeiDou",
    color: "#ff922b",
    group: "beidou",
    defaultVisible: true,
  },
];

export const CONSTELLATION_BY_ID = Object.fromEntries(
  CONSTELLATIONS.map((c) => [c.id, c]),
) as Record<string, Constellation>;
// The ten Kin. Right now they are only templates to pick: blueprints, faction effects and starting setups arrive in later milestones.
export interface KinInfo {
  id: string;
  name: string;
  // The "Color:" line of the Kin's rulebook file.
  color: string;
}

export const KINS: readonly KinInfo[] = [
  { id: "ethereal", name: "The Ethereal", color: "pink" },
  { id: "hanshu", name: "Dynasty of Hanshu", color: "brown" },
  { id: "wanderers", name: "Wanderers", color: "light blue" },
  { id: "lumon", name: "Pride of Lumon", color: "yellow" },
  { id: "beastmen", name: "Beastmen Tribes", color: "dark red" },
  { id: "ark", name: "Archive Ark", color: "grey" },
  { id: "hammers", name: "Hammers of the Ash", color: "black" },
  { id: "syndicate", name: "Seven Streams Syndicate", color: "blue" },
  { id: "tree", name: "Children of the Great Tree", color: "dark green" },
  { id: "deepones", name: "Deep Ones", color: "purple" }
];

export const kinById = (id: unknown) => KINS.find(kin => kin.id === id);

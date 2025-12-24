export enum SessionType {
  Practice1 = 'Practice1',
  Practice2 = 'Practice2',
  Practice3 = 'Practice3',
  Practice4 = 'Practice4',
  Practice5 = 'Practice5',
  Practice6 = 'Practice6',
  HappyHour = 'HappyHour',
  WarmUp = 'WarmUp',
  Qualifying = 'Qualifying',
  Race1 = 'Race1',
  Race2 = 'Race2',
  PreFinal = 'PreFinal',
  Final = 'Final',
  Heat1 = 'Heat1',
  Heat2 = 'Heat2',
  Heat3 = 'Heat3',
  Heat4 = 'Heat4',
  Heat5 = 'Heat5',
  Heat6 = 'Heat6',
  Heat7 = 'Heat7',
  SuperHeat1 = 'SuperHeat1',
  SuperHeat2 = 'SuperHeat2',
}

export enum ClassCode {
  Micro = 'Micro',
  Mini = 'Mini',
  Sr = 'Sr',
  Kz = 'Kz',
  Ka = 'Ka',
  Jr = 'Jr',
}

export enum RearHubsMaterial {
  Aluminium = 'Aluminium',
  Magnesium = 'Magnesium',
}

export enum FrontHeight {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Standard = 'Standard',
}

export enum BackHeight {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Standard = 'Standard',
}

export enum FrontHubsMaterial {
  Aluminium = 'Aluminium',
  Magnesium = 'Magnesium',
}

export enum FrontBar {
  Nylon = 'Nylon',
  Standard = 'Standard',
  Black = 'Black',
  None = 'None',
}

export enum Spindle {
  Blue = 'Blue',
  Standard = 'Standard',
  Red = 'Red',
  Green = 'Green',
  Gold = 'Gold',
}

export interface Submission {
  id?: string;
  userId?: string;
  sessionType: SessionType;
  classCode: ClassCode;
  track: string;
  championship: string;
  division: string;
  engineNumber: string;
  gearRatio?: string;
  driveSprocket: string;
  drivenSprocket: string;
  carburatorNumber: string;
  tyreModel: string;
  tyreAge: string;
  tyreColdPressure: string;
  chassis: string;
  axle: string;
  rearHubsMaterial: RearHubsMaterial;
  rearHubsLength: string;
  frontHeight: FrontHeight;
  backHeight: BackHeight;
  frontHubsMaterial: FrontHubsMaterial;
  frontBar: FrontBar;
  spindle: Spindle;
  caster: string;
  seatPosition: string;
  lapTime?: string;
  observation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isManager: boolean;
}


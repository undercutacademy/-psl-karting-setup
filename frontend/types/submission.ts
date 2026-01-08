export enum SessionType {
  Practice1 = 'Practice 1',
  Practice2 = 'Practice 2',
  Practice3 = 'Practice 3',
  Practice4 = 'Practice 4',
  Practice5 = 'Practice 5',
  Practice6 = 'Practice 6',
  HappyHour = 'Happy Hour',
  WarmUp = 'Warm Up',
  Qualifying = 'Qualifying',
  Race1 = 'Race 1',
  Race2 = 'Race 2',
  PreFinal = 'Pre Final',
  Final = 'Final',
  Heat1 = 'Heat 1',
  Heat2 = 'Heat 2',
  Heat3 = 'Heat 3',
  Heat4 = 'Heat 4',
  Heat5 = 'Heat 5',
  Heat6 = 'Heat 6',
  Heat7 = 'Heat 7',
  SuperHeat1 = 'Super Heat 1',
  SuperHeat2 = 'Super Heat 2',
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
  driveSprocket?: string;
  drivenSprocket?: string;
  carburatorNumber?: string;
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
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isManager: boolean;
}


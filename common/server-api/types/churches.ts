export interface Church {
  churchId: string;
  name: string;
  zip: string;
  county: string;
  city: string;
  state: string;
  address: string;
  email: string;
  creationTimestamp: number;
  modificationTimestamp: number;
}

export interface ChurchMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

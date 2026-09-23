export type ManagedClient = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  typeClientId: number;
  countryId: number | null;
};

export type ReferenceItem = {
  id: number;
  name: string;
  code: string;
};

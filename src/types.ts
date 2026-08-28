export type SourceItem = { id: string; label: string; value: string; unit: string; source: string; date: string; note: string };
export type Medication = { id: string; name: string; dose: string; schedule: string; source: string };
export type Question = { id: string; question: string; note: string };
export type Packet = {
  version: 1; updatedAt: string; profile: { name: string; appointmentDate: string; clinician: string; reason: string; coverNote?: string };
  observations: SourceItem[]; medications: Medication[]; questions: Question[];
};
export const blankPacket = (): Packet => ({ version: 1, updatedAt: new Date().toISOString(), profile: { name: '', appointmentDate: '', clinician: '', reason: '', coverNote: '' }, observations: [], medications: [], questions: [] });

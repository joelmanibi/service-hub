import apiClient from "@/lib/axios";

/**
 * Service Matrice d'escalade GOS (module escalation côté backend) :
 *  - escalade managériale : commune à toutes les instances ;
 *  - escalade technique : ligne « Normal Process » commune + ligne propre au
 *    POD de l'instance.
 * Lecture pour tout utilisateur connecté, modification ADMIN/VALIDATOR.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface EscalationPhone {
  label: string;
  number: string;
}

export interface EscalationContact {
  name: string;
  email: string;
  phones: EscalationPhone[];
}

export interface ManagerialLevel {
  level: string;
  contact: string;
  phones: EscalationPhone[];
  email: string;
}

export interface ManagerialEscalation {
  intro: string;
  availability: string;
  businessHours: string;
  eds: string;
  note: string;
  levels: ManagerialLevel[];
}

export interface TechnicalNormalProcess {
  intro: string;
  cluster: string;
  countries: string;
  qualityAnalyst: EscalationContact | null;
  headOfCluster: EscalationContact | null;
}

export interface PodRef {
  id: number;
  code: string;
  name: string;
}

export interface PodEscalation {
  pod: PodRef;
  countries: string;
  qualityAnalyst: EscalationContact | null;
  headOfCluster: EscalationContact | null;
  configured: boolean;
}

export interface TechnicalProcessStep {
  step: string;
  target: string;
}

export interface EscalationGlobal {
  managerial: ManagerialEscalation;
  technicalNormal: TechnicalNormalProcess;
  technicalProcess: TechnicalProcessStep[];
}

export interface EscalationMatrix {
  managerial: ManagerialEscalation;
  technical: {
    normalProcess: TechnicalNormalProcess;
    podEscalation: PodEscalation | null;
    pod: PodRef | null;
    process: TechnicalProcessStep[];
  };
}

// GET /escalation
export async function getEscalationGlobal(): Promise<EscalationGlobal> {
  const { data } = await apiClient.get<ApiEnvelope<EscalationGlobal>>("/escalation");
  return data.data;
}

// PUT /escalation/managerial
export async function updateManagerialEscalation(payload: ManagerialEscalation): Promise<ManagerialEscalation> {
  const { data } = await apiClient.put<ApiEnvelope<ManagerialEscalation>>("/escalation/managerial", payload);
  return data.data;
}

// PUT /escalation/technical-normal
export async function updateTechnicalNormalProcess(payload: TechnicalNormalProcess): Promise<TechnicalNormalProcess> {
  const { data } = await apiClient.put<ApiEnvelope<TechnicalNormalProcess>>("/escalation/technical-normal", payload);
  return data.data;
}

// GET /escalation/pods
export async function listPodEscalations(): Promise<PodEscalation[]> {
  const { data } = await apiClient.get<ApiEnvelope<PodEscalation[]>>("/escalation/pods");
  return data.data;
}

// PUT /escalation/pods/:podId
export async function updatePodEscalation(
  podId: number,
  payload: Pick<PodEscalation, "countries" | "qualityAnalyst" | "headOfCluster">
): Promise<PodEscalation> {
  const { data } = await apiClient.put<ApiEnvelope<PodEscalation>>(`/escalation/pods/${podId}`, payload);
  return data.data;
}

// GET /escalation/pods/:podId/matrix — matrice complète d'une instance de ce POD.
export async function getEscalationMatrixForPod(podId: number): Promise<EscalationMatrix> {
  const { data } = await apiClient.get<ApiEnvelope<EscalationMatrix>>(`/escalation/pods/${podId}/matrix`);
  return data.data;
}

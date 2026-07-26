export interface ClauseItem {
  label: string;
  value: string;
}

export interface RiskFlag {
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
}

export interface DocumentAnalysis {
  documentType: string;
  summary: string;
  clauses: ClauseItem[];
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFlags: RiskFlag[];
  suggestions: string[];
}

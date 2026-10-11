export type NavigationRoute =
  | 'overview'
  | 'customer-risk'
  | 'what-if-simulator'
  | 'retention-playbook'
  | 'model-performance';

export interface CustomerRecord {
  id: string;
  shortId: string;
  name?: string;
  plan: string;
  tenure: number;
  contract: 'Month-to-month' | 'One year' | 'Two year';
  paymentMethod: string;
  monthlyCharges: number;
  totalCharges: number;
  churnProb: number;
  riskTier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW RISK';
  recommendedPlaybook: string;
  actionIcon: string;
  paperless: boolean;
  internetService: 'Fiber optic' | 'DSL' | 'No';
  techSupport: boolean;
  onlineSecurity: boolean;
  deviceProtection: boolean;
  onlineBackup: boolean;
  streamingTV: boolean;
  streamingMovies: boolean;
  multipleLines: boolean;
}

export interface PlaybookCampaign {
  id: string;
  code: string;
  category: 'contract' | 'payment' | 'onboarding' | 'value';
  title: string;
  statusBadge: string;
  timingBadge: string;
  targetSegment: string;
  segmentVolatility: string;
  targetCohort: number;
  cohortPct: string;
  mrrAtRisk: string;
  arrAtRisk: string;
  strategyTitle: string;
  strategyDesc: string;
  expectedRiskDrop: string;
  subsSaved: number;
  baselineRate: string;
  postTarget: string;
  subMeta: string;
  isDeployed?: boolean;
}

export interface ModelMetricRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  optimalThreshold: number;
  recallAtOpt: number;
  f1AtOpt: number;
}

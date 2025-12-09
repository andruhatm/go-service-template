export interface Anomaly {
  name: string;
  status: string;
  objectName: string;
  objectType: string;
  dateAdded: string ;
  calculatedDate: string;
}

export interface ListAnomalyResp {
  name: string;
  status: string;
  objectName: string;
  objectType: string;
  dateAdded: number ;
  calculatedDate: number | null;
}

export interface CreateAnomaly {
  name: string;
  objectName: string;
  model: string;
}

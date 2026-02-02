export interface MonObject {
  id: string;
  name: string;
  type?: string;
  parentId?: string;
  childId?: string;
  technology?: string;
  platform?: string;
  network?: string;
  manufacturer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonObjectRequest {
  name: string;
  type?: string;
  parentId?: string;
  childId?: string;
  technology?: string;
  platform?: string;
  network?: string;
  manufacturer?: string;
}

export interface UpdateMonObjectRequest {
  name?: string;
  type?: string;
  parentId?: string;
  childId?: string;
  technology?: string;
  platform?: string;
  network?: string;
  manufacturer?: string;
}

export interface MonObjectListResponse {
  items: MonObject[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MonObjectListParams {
  page?: number;
  pageSize?: number;
  type?: string;
  name?: string;
  technology?: string;
}



import api from './api';

export interface Issue {
  id: string;
  orderId: string;
  userId: string;
  issueType: string;
  message?: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  updatedAt?: string;
  deliveryStatus?: string;
}

export interface SubmitIssueRequest {
  orderId: string;
  issueType: string;
  message?: string;
}

export interface SubmitIssueResponse {
  success: boolean;
  message: string;
  data: Issue;
}

export interface GetIssueStatusResponse {
  success: boolean;
  data: Issue | null;
}

export interface GetAllIssuesResponse {
  success: boolean;
  data: Issue[];
}

export interface ResolveIssueRequest {
  deliveryStatus?: string;
}

export interface ResolveIssueResponse {
  success: boolean;
  message: string;
  data: Issue;
}

export const submitIssue = async (issueData: SubmitIssueRequest, _token: string): Promise<SubmitIssueResponse> => {
  try {
    const response = await api.post('/api/order-issues', issueData);
    const json = response.data as any;
    if (json.success && json.data) {
      json.data.id = json.data._id;
    }
    return json;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Submit issue failed';
    throw new Error(message);
  }
};

export const getIssueStatus = async (orderId: string, _token: string): Promise<GetIssueStatusResponse> => {
  try {
    const response = await api.get(`/api/order-issues/order/${orderId}`);
    const json = response.data as any;
    if (json.success && json.data) {
      json.data.id = json.data._id;
    }
    return json;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get issue status failed';
    throw new Error(message);
  }
};

export const getAllIssues = async (_token: string): Promise<GetAllIssuesResponse> => {
  try {
    const response = await api.get('/api/order-issues');
    const json = response.data as any;
    if (json.success && json.data && Array.isArray(json.data)) {
      json.data = json.data.map((issue: any) => ({ ...issue, id: issue._id }));
    } else if (json.success && !json.data) {
      json.data = [];
    }
    return json;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get all issues failed';
    throw new Error(message);
  }
};

export const resolveIssue = async (issueId: string, resolveData: ResolveIssueRequest, _token: string): Promise<ResolveIssueResponse> => {
  try {
    const response = await api.patch(`/api/order-issues/${issueId}/resolve`, resolveData);
    const json = response.data as any;
    if (json.success && json.data) {
      json.data.id = json.data._id;
    }
    return json;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Resolve issue failed';
    throw new Error(message);
  }
};

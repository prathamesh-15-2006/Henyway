import { apiConfig } from './api-config';

export const BASE_URL = apiConfig.getBaseUrl();

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

class ApiError extends Error {
  response?: Response;
  data?: any;

  constructor(message: string, response?: Response, data?: any) {
    super(message);
    this.response = response;
    this.data = data;
  }
}

export const submitIssue = async (issueData: SubmitIssueRequest, token: string): Promise<SubmitIssueResponse> => {
  const response = await fetch(`${BASE_URL}/api/order-issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(issueData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Submit issue failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Submit issue failed', response, errorText);
    }
  }

  const json = await response.json();
  if (json.success && json.data) {
    json.data.id = json.data._id;
  }
  return json;
};

export const getIssueStatus = async (orderId: string, token: string): Promise<GetIssueStatusResponse> => {
  const response = await fetch(`${BASE_URL}/api/order-issues/order/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get issue status failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get issue status failed', response, errorText);
    }
  }

  const json = await response.json();
  if (json.success && json.data) {
    json.data.id = json.data._id;
  }
  return json;
};

export const getAllIssues = async (token: string): Promise<GetAllIssuesResponse> => {
  const response = await fetch(`${BASE_URL}/api/order-issues`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get all issues failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get all issues failed', response, errorText);
    }
  }

  const json = await response.json();
  if (json.success && json.data && Array.isArray(json.data)) {
    json.data = json.data.map((issue: any) => ({ ...issue, id: issue._id }));
  } else if (json.success && !json.data) {
    json.data = [];
  }
  return json;
};

export const resolveIssue = async (issueId: string, resolveData: ResolveIssueRequest, token: string): Promise<ResolveIssueResponse> => {
  const response = await fetch(`${BASE_URL}/api/order-issues/${issueId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(resolveData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Resolve issue failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Resolve issue failed', response, errorText);
    }
  }

  const json = await response.json();
  if (json.success && json.data) {
    json.data.id = json.data._id;
  }
  return json;
};

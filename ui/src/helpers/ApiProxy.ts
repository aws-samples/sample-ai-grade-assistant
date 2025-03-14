import * as Auth from 'aws-amplify/auth';

import config from '../config';

export interface IApiProxy {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: unknown): Promise<T>;
  put<T>(url: string, data: unknown): Promise<T>;
  patch<T>(url: string, data: unknown): Promise<T>;
  delete<T>(url: string, data?: unknown): Promise<T>;
}

export class ApiProxy implements IApiProxy {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? config.ApiUrl;
  }

  private async generateHeaders() {
    // retrieve access token using Amplify auth library
    const accessToken = (await Auth.fetchAuthSession()).tokens?.accessToken;

    // pass auth header with each request
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  public async get<T>(url: string): Promise<T> {
    const headers = await this.generateHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, { headers });
    return response.json();
  }

  public async post<T>(url: string, data: unknown): Promise<T> {
    const headers = await this.generateHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return response.json();
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    const headers = await this.generateHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return response.json();
  }

  public async patch<T>(url: string, data?: unknown): Promise<T> {
    const headers = await this.generateHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    return response.json();
  }

  public async delete<T>(url: string, data?: unknown): Promise<T> {
    const headers = await this.generateHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'DELETE',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }
}

export default ApiProxy;

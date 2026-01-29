import axios, { AxiosInstance } from 'axios';

export class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string, timeout: number = 3000) {
    this.client = axios.create({
      baseURL,
      timeout, // 3 seconds default timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async post<T>(url: string, data: any, idempotencyKey?: string): Promise<T> {
    const headers = idempotencyKey
      ? { 'Idempotency-Key': idempotencyKey }
      : {};

    const response = await this.client.post<T>(url, data, { headers });
    return response.data;
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }
}

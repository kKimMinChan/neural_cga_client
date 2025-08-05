import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CentralApiService {
  private axiosInstance: AxiosInstance;
  private readonly accessToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.CENTRAL_SERVER_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  async ensureAuthenticated() {
    if (!this.accessToken) {
      await this.loginToCentralServer();
    }
  }

  private async loginToCentralServer() {
    try {
      const response = await this.axiosInstance.post('/auth/login', {
        email: process.env.CENTRAL_SERVER_EMAIL,
        password: process.env.CENTRAL_SERVER_PASSWORD,
      });

      if (response.data && response.data.accessToken) {
        this.axiosInstance.defaults.headers['Authorization'] =
          `Bearer ${response.data.accessToken}`;
      } else {
        throw new Error('Access token not found in response');
      }
    } catch (error) {
      console.error('Login failed:', error.message);
      throw new Error('Login to central server failed');
    }
  }

  // async login(login: LoginInput): Promise<string> {
  //   try {
  //     const response = await axios.post(
  //       `${process.env.CENTRAL_SERVER_URL}/auth/login`,
  //       {
  //         email: login.email,
  //         password: login.password,
  //       },
  //     );

  //     const token = response.data.accessToken;
  //     console.log('Access token received:', token);
  //     if (!token) {
  //       throw new Error('Access token not found in response');
  //     }
  //     this.tokenStore.setToken(token);
  //     return token;
  //   } catch (error) {
  //     console.error('Login failed:', error.message);
  //     throw new Error('Login failed');
  //   }
  // }
}

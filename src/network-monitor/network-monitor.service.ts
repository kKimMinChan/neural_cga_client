import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NetworkMonitorService {
  private isOnline = false;
  private readonly CHECK_URL = 'https://www.google.com';
  private readonly INTERVAL = 60000;

  private listeners: (() => void)[] = [];

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    setInterval(async () => {
      try {
        const internet = await axios.get(this.CHECK_URL, {
          timeout: 5000, // 5 seconds timeout
        });
        console.log('🌐 인터넷 연결 상태:', internet.status);
        if (!this.isOnline) {
          this.isOnline = true;
          this.triggerReconnect();
        }
      } catch (error) {
        this.isOnline = false;
      }
    }, this.INTERVAL);
  }

  private triggerReconnect() {
    console.log('🌐 인터넷 연결 감지됨, 큐 재처리 시작');
    for (const fn of this.listeners) {
      fn();
    }
  }

  onReconnect(listener: () => void) {
    this.listeners.push(listener);
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

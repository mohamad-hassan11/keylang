'use client';

import { useSyncExternalStore } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

class DeviceTypeStore {
  private currentType: DeviceType = 'desktop';
  private readonly listeners: Set<() => void> = new Set();
  private isClientInitialized = false;

  private initClient(): void {
    if (this.isClientInitialized || typeof window === 'undefined') {
      return;
    }
    this.isClientInitialized = true;
    this.currentType = getDeviceType();

    const handleResize = () => {
      const newType = getDeviceType();
      if (newType !== this.currentType) {
        this.currentType = newType;
        this.notify();
      }
    };

    window.addEventListener('resize', handleResize);
    this._cleanup = () => window.removeEventListener('resize', handleResize);
  }

  private _cleanup = () => {};

  public getSnapshot = (): DeviceType => {
    this.initClient();
    return this.currentType;
  };

  public getServerSnapshot = (): DeviceType => 'desktop';

  public subscribe = (listener: () => void): (() => void) => {
    this.initClient();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const deviceTypeStore = new DeviceTypeStore();

export function useDeviceType(): DeviceType {
  return useSyncExternalStore(
    deviceTypeStore.subscribe,
    deviceTypeStore.getSnapshot,
    deviceTypeStore.getServerSnapshot
  );
}

export function useIsMobile(): boolean {
  const deviceType = useDeviceType();
  return deviceType === 'mobile' || deviceType === 'tablet';
}
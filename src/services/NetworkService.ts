import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

class NetworkServiceClass {
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
  };

  private listeners: ((state: NetworkState) => void)[] = [];

  async initialize() {
    // Get initial state
    const state = await NetInfo.fetch();
    this.updateState(state);

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      this.updateState(state);
    });
  }

  private updateState(state: any) {
    this.currentState = {
      isConnected: state.isConnected || false,
      isInternetReachable: state.isInternetReachable || false,
      type: state.type || 'unknown',
    };

    // Notify listeners
    this.listeners.forEach(listener => listener(this.currentState));
  }

  getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  addListener(listener: (state: NetworkState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async checkConnectivity(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return (state.isConnected ?? false) && (state.isInternetReachable ?? false);
  }
}

export const NetworkService = new NetworkServiceClass(); 
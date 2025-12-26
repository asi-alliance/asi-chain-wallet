export interface AwsWafCaptchaConfig {
  onSuccess: (wafToken: string) => void;
  onLoad?: () => void;
  onError?: (err: string) => void;
  onPuzzleTimeout?: () => void;
  onPuzzleIncorrect?: () => void;
  onPuzzleCorrect?: () => void;
  apiKey: string;
}

export interface AwsWafCaptcha {
  renderCaptcha: (
    container: string | HTMLElement, 
    config: AwsWafCaptchaConfig
  ) => void;
}

export interface AwsWafIntegration {
    hasToken: () => boolean;
    getToken: () => Promise<string>;
    fetch: (input: string, init) => void;
}
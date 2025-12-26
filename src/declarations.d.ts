import { AwsWafCaptcha, AwsWafIntegration } from "components/Captcha/types";

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

declare global {
  interface Window {
    AwsWafIntegration: AwsWafIntegration;
    AwsWafCaptcha: AwsWafCaptcha;
  }
}

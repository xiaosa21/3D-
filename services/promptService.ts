// services/promptService.ts
import { CameraParams } from '../types';

export interface BilingualPrompt {
  en: string;
  zh: string;
}

export const generateProfessionalPrompt = (params: CameraParams): BilingualPrompt => {
  const { horizontalAngle, verticalAngle, distance, zoom } = params;

  // Qwen/SD/Flux 风格的精准角度描述
  // 将角度归一化为 0-360 和 -90-90
  const azimuth = Math.round(((horizontalAngle % 360) + 360) % 360);
  const elevation = Math.round(verticalAngle);
  
  // 核心：使用数学语言描述，这比自然语言更受 AI 欢迎
  const viewPrompt = `camera angle at ${azimuth} degrees azimuth and ${elevation} degrees elevation`;

  // 距离描述优化
  let shotType = '';
  if (distance < 3) shotType = 'extreme close-up shot, macro details';
  else if (distance < 5) shotType = 'close-up shot, product focus';
  else if (distance < 8) shotType = 'medium shot, studio composition';
  else shotType = 'full shot, wide angle view';

  // 焦段描述
  const focalLength = Math.round(50 / zoom); // 估算焦段

  return {
    en: `(masterpiece, best quality, commercial photography), ${viewPrompt}, ${shotType}, ${focalLength}mm lens, perfect lighting, 8k resolution, highly detailed, photorealistic`,
    zh: `商业摄影大片，方位角${azimuth}度，仰角${elevation}度，${shotType}`
  };
};
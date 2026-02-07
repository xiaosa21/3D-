
import { CameraParams } from '../types';

export interface BilingualPrompt {
  en: string;
  zh: string;
}

export const generateProfessionalPrompt = (params: CameraParams): BilingualPrompt => {
  const { horizontalAngle, verticalAngle, distance, zoom } = params;

  // 1. Horizontal
  let hEn = '', hZh = '';
  const h = ((horizontalAngle % 360) + 360) % 360;
  if (h >= 337.5 || h < 22.5) { hEn = 'front view'; hZh = '正视图'; }
  else if (h >= 22.5 && h < 67.5) { hEn = 'right 3/4 view'; hZh = '右侧 3/4 侧视图'; }
  else if (h >= 67.5 && h < 112.5) { hEn = 'right side view'; hZh = '右侧正视图'; }
  else if (h >= 112.5 && h < 157.5) { hEn = 'right rear view'; hZh = '右后侧视图'; }
  else if (h >= 157.5 && h < 202.5) { hEn = 'back view'; hZh = '背视图'; }
  else if (h >= 202.5 && h < 247.5) { hEn = 'left rear view'; hZh = '左后侧视图'; }
  else if (h >= 247.5 && h < 292.5) { hEn = 'left side view'; hZh = '左侧正视图'; }
  else { hEn = 'left 3/4 view'; hZh = '左侧 3/4 侧视图'; }

  // 2. Vertical
  let vEn = '', vZh = '';
  if (verticalAngle > 70) { vEn = 'zenith view (top-down)'; vZh = '俯视 (鸟瞰)'; }
  else if (verticalAngle > 35) { vEn = 'high angle'; vZh = '高角度仰拍'; }
  else if (verticalAngle > 10) { vEn = 'slight high angle'; vZh = '微高角度'; }
  else if (verticalAngle > -10) { vEn = 'eye-level'; vZh = '平视'; }
  else if (verticalAngle > -35) { vEn = 'low angle'; vZh = '低角度'; }
  else { vEn = 'extreme low angle (worm\'s eye view)'; vZh = '极低角度仰视 (虫视)'; }

  // 3. Distance
  let dEn = '', dZh = '';
  if (distance < 3) { dEn = 'extreme close-up'; dZh = '特写'; }
  else if (distance < 5) { dEn = 'close-up'; dZh = '近景'; }
  else if (distance < 7) { dEn = 'medium shot'; dZh = '中景'; }
  else { dEn = 'wide shot'; dZh = '全景/远景'; }

  // 4. Zoom
  let zEn = '', zZh = '';
  if (zoom < 0.8) { zEn = 'wide angle lens'; zZh = '广角镜头'; }
  else if (zoom < 1.4) { zEn = 'standard lens'; zZh = '标准镜头'; }
  else { zEn = 'telephoto lens'; zZh = '长焦镜头'; }

  return {
    en: `<sks> ${hEn}, ${vEn}, ${dEn}, ${zEn}`,
    zh: `${hZh}，${vZh}，${dZh}，${zZh}`
  };
};

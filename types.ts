
export interface CameraParams {
  horizontalAngle: number; // -180 to 180
  verticalAngle: number;   // -90 to 90
  distance: number;        // 1 to 15
  zoom: number;            // 0.5 to 3.0
  tilt: number;            // -45 to 45
  quality: '1K' | '2K' | '4K';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface GenerationResult {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

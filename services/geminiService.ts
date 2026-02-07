// services/geminiService.ts (确保完全一致)

const API_CONFIG = {
  SUBMIT_URL: "https://grsai.dakka.com.cn/v1/draw/nano-banana",
  RESULT_URL: "https://grsai.dakka.com.cn/v1/draw/result",
  PUBLIC_R2_DOMAIN: "https://cdn.gordensun.com/bananaproimage",
  OSS_ID: "692b1ce0469719c8c4c5af05",
  OSS_PATH: "bananaproimage",
  MODEL_NAME: "nano-banana-pro"
};

interface NanoResponse {
  code: number;
  msg?: string;
  data?: {
    id?: string;
    status?: string;
    results?: { url: string }[];
    failure_reason?: string;
  };
}

const fixR2Url = (rawUrl: string): string => {
  if (!rawUrl || !API_CONFIG.PUBLIC_R2_DOMAIN) return rawUrl;
  try {
    const urlObj = new URL(rawUrl);
    if (urlObj.hostname.includes('r2.cloudflarestorage.com')) {
      let path = urlObj.pathname;
      if (path.startsWith('/bananaproimage/')) path = path.replace('/bananaproimage/', '/');
      const domain = API_CONFIG.PUBLIC_R2_DOMAIN.replace(/\/$/, '');
      return `${domain}${path}`;
    }
  } catch (e) { console.error("URL Fix Error:", e); }
  return rawUrl;
};

const pollTaskResult = async (apiKey: string, taskId: string): Promise<string> => {
  const maxAttempts = 60; 
  const interval = 3000; 

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(API_CONFIG.RESULT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({ id: taskId })
    });

    const resJson: NanoResponse = await response.json();

    if (resJson.code === -22) {
      await new Promise(resolve => setTimeout(resolve, interval));
      continue;
    }

    if (resJson.code === 0 && resJson.data) {
      const { status, results, failure_reason } = resJson.data;
      if (status === 'succeeded' && results && results.length > 0) {
        return fixR2Url(results[0].url);
      } else if (status === 'failed') {
        throw new Error(failure_reason || "任务执行失败");
      }
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error("生成超时，请稍后重试");
};

export const generateImageWithNano = async (
  apiKey: string,
  base64Image: string,
  prompt: string,
  strength: number = 0.75,
  aspectRatio: string = '1:1',
  quality: '1K' | '2K' | '4K' = '2K'
): Promise<string> => {
  
  if (!apiKey) throw new Error("请在顶部输入 API Key");

  const sizeMap: Record<string, string> = {
    '1K': '1024x1024', '2K': '1024x1024', '4K': '1024x1024'
  };
  const size = sizeMap[quality] || '1024x1024';

  const payload = {
    model: API_CONFIG.MODEL_NAME,
    prompt: prompt,
    aspectRatio: aspectRatio,
    imageSize: size,
    urls: [base64Image],
    webHook: "-1",
    shutProgress: true,
    strength: strength,
    topP: 0.9,
    temperature: 1.0
  };

  try {
    const submitRes = await fetch(API_CONFIG.SUBMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'oss-id': API_CONFIG.OSS_ID,
        'oss-path': API_CONFIG.OSS_PATH
      },
      body: JSON.stringify(payload)
    });

    if (submitRes.status === 401) throw new Error("API Key 无效，请检查");
    
    const submitJson: NanoResponse = await submitRes.json();
    if (submitJson.code !== 0 || !submitJson.data?.id) throw new Error(submitJson.msg || "提交任务失败");

    return await pollTaskResult(apiKey, submitJson.data.id);
  } catch (error: any) {
    throw new Error(error.message || "网络请求失败");
  }
};
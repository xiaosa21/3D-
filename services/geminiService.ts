// services/geminiService.ts

// 定义 API 常量
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

// 修复 R2 URL 的逻辑 (参考 python 脚本)
const fixR2Url = (rawUrl: string): string => {
  if (!rawUrl || !API_CONFIG.PUBLIC_R2_DOMAIN) return rawUrl;
  try {
    const urlObj = new URL(rawUrl);
    if (urlObj.hostname.includes('r2.cloudflarestorage.com')) {
      let path = urlObj.pathname;
      if (path.startsWith('/bananaproimage/')) {
        path = path.replace('/bananaproimage/', '/');
      }
      // 移除末尾斜杠并拼接路径
      const domain = API_CONFIG.PUBLIC_R2_DOMAIN.replace(/\/$/, '');
      return `${domain}${path}`;
    }
  } catch (e) {
    console.error("URL Fix Error:", e);
  }
  return rawUrl;
};

// 轮询获取结果
const pollTaskResult = async (apiKey: string, taskId: string): Promise<string> => {
  const maxAttempts = 60; // 约 3 分钟超时
  const interval = 3000; // 3秒轮询一次

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

    // 处理排队中
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
    
    // 继续等待
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error("生成超时，请稍后重试");
};

/**
 * 调用 Nano Banana Pro 模型
 */
export const generateImageWithNano = async (
  apiKey: string,
  base64Image: string,
  prompt: string,
  strength: number = 0.75, // 新增重绘幅度参数
  aspectRatio: string = '1:1',
  quality: '1K' | '2K' | '4K' = '2K'
): Promise<string> => {
  
  if (!apiKey) throw new Error("请在左侧配置 API Key");

  // 映射画幅比例
  let ratio = aspectRatio; 
  // 如果需要严格匹配 Python 脚本的 ratio 格式，可以在这里转换，
  // 假设 API 接受 "1:1", "3:4" 这种格式即可。

  // 映射尺寸 (Nano 模型通常接受具体数字或特定字符串，这里简化处理)
  // 根据 Python 脚本逻辑，它直接透传了 size。
  const sizeMap: Record<string, string> = {
    '1K': '1024x1024',
    '2K': '1024x1024', // 假如模型限制最大分辨率，可在此调整
    '4K': '1024x1024'  // 即使选 4K，底层可能也只能跑 1024 或 1536
  };
  const size = sizeMap[quality] || '1024x1024';

  const payload = {
    model: API_CONFIG.MODEL_NAME,
    prompt: prompt,
    aspectRatio: ratio,
    imageSize: size,
    urls: [base64Image], // 将用户上传的图作为 reference
    webHook: "-1",
    shutProgress: true,
    strength: strength,
    topP: 0.9,
    temperature: 1.0
  };

  try {
    // 1. 提交任务
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

    if (submitRes.status === 401) throw new Error("API Key 无效");
    
    const submitJson: NanoResponse = await submitRes.json();
    
    if (submitJson.code !== 0 || !submitJson.data?.id) {
      throw new Error(submitJson.msg || "提交任务失败");
    }

    const taskId = submitJson.data.id;

    // 2. 轮询结果
    return await pollTaskResult(apiKey, taskId);

  } catch (error: any) {
    console.error("Nano API Error:", error);
    throw new Error(error.message || "网络请求失败");
  }
};
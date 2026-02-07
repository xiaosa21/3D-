import { GoogleGenAI } from "@google/genai";

/**
 * 这是一个纯粹的工具函数，它现在需要你把 apiKey 传给它，
 * 而不是它自己去环境变量里找。
 */
export const generateImageWithGemini = async (
  apiKey: string, // <--- 新增参数：必须由外部传入 Key
  base64Image: string,
  prompt: string,
  quality: '1K' | '2K' | '4K' = '1K',
  aspectRatio: string = '1:1'
): Promise<string> => {
  
  if (!apiKey) {
    throw new Error("未检测到 API Key，请在左侧设置中输入。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // 建议改为 flash 模型，速度快且免费额度高，也支持 gemini-1.5-pro
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png', // 注意：如果是 jpg 图片可能会有兼容问题，建议由 UI 层统一转 png
            },
          },
          {
            text: `Professional high-end commercial photography. 
            Maintain consistent subject identity. 
            Camera perspective parameters: ${prompt}. 
            Lighting: Cinematic studio lighting, sharp focus, clean composition, high-end post-processing.`,
          },
        ],
      },
      config: {
        // 注意：部分旧模型不支持 imageConfig，如果报错请注释掉这一块
        // 2.0-flash 和 1.5-pro 应该是支持的
        // imageConfig: { 
        //   imageSize: quality,
        //   aspectRatio: aspectRatio as any
        // }
      }
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("模型未返回图像数据，请检查 Prompt 或更换模型。");
  } catch (error: any) {
    console.error("Gemini Rendering Error:", error);
    // 抛出更友好的错误信息
    throw new Error(error.message || "生成失败，请检查 API Key 是否有效。");
  }
};

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const REFERENCE_DATE = "2026-01-09";

export const getGeminiResponse = async (history: any[], currentInput: string, imageData?: string) => {
  const contents: any[] = [
    ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] }))
  ];

  const currentParts: any[] = [{ text: currentInput }];
  if (imageData) {
    currentParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(',')[1]
      }
    });
  }
  contents.push({ role: 'user', parts: currentParts });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: `당신은 유사나 비전보드 빌더 전용 AI 코치입니다.
기준 날짜: ${REFERENCE_DATE}.

코칭 스타일 및 답변 지침:
1. 따뜻하고 격려하는 말투를 유지하세요.
2. 이미지가 제공되면 해당 이미지를 분석하여 꿈의 구체적인 모델명, 장소의 특징, 분위기를 파악하고 관련하여 제안해주세요. (예: "사진 속의 이 차는 제네시스 GV80이군요! 리더님께 정말 잘 어울릴 것 같아요.")
3. 사용자가 꿈을 말하면 "언제(어느 계절)"에 그 꿈을 이루고 싶은지 꼭 물어봐 주세요.
4. 답변 시 반드시 다음 형식을 포함하여 요약해 주세요:
   - [꿈 제목]: 사용자가 말한 핵심 제목
   - [상세 비용 분석]: 항목별(예: 취등록세, 보험료, 항공권, 숙박비 등) 구체적인 예상 금액과 근거를 제시하세요. (단위: 원)
5. 질문은 한 번에 하나씩만 가볍게 하세요.
6. 비용 설계를 리더님의 상황에 맞춰 아주 정교하게 제안해준다는 느낌을 주세요.`,
    }
  });
  return response.text;
};

export const extractVisionData = async (conversation: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ parts: [{ text: `다음 대화 내용에서 비전보드 아이템들을 추출하여 JSON 배열로 반환하세요.
    각 아이템에는 고유 ID, 제목, 카테고리(place/item/experience), 목표날짜(YYYY-MM), 예상비용(숫자), 상세내용(비용 분석 포함), 사양을 포함하세요.
    
    이미지 관련 규칙:
    - imageUrl 필드에는 해당 꿈을 아주 생생하게 나타낼 수 있는 영어 검색 키워드 2개를 쉼표 없이 띄어쓰기로 넣으세요.
    - additionalImages 필드에는 그 꿈과 연관된 서로 다른 분위기의 영어 검색 키워드 4개를 배열로 넣으세요.
    
    대화 내용: ${conversation}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['place', 'item', 'experience'] },
            targetDate: { type: Type.STRING },
            estimatedCost: { type: Type.NUMBER },
            imageUrl: { type: Type.STRING },
            additionalImages: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            details: { type: Type.STRING },
            specs: { type: Type.STRING }
          },
          required: ['id', 'title', 'category', 'targetDate', 'estimatedCost', 'imageUrl']
        }
      }
    }
  });
  
  const rawData = JSON.parse(response.text || '[]');
  return rawData.map((item: any) => {
    const mainKeywords = item.imageUrl.split(' ').join(',');
    return {
      ...item,
      imageUrl: `https://loremflickr.com/800/600/${encodeURIComponent(mainKeywords)}?sig=${item.id}`,
      additionalImages: item.additionalImages?.map((kw: string, i: number) => 
        `https://loremflickr.com/800/600/${encodeURIComponent(kw.split(' ').join(','))}?sig=${item.id}_${i}`
      ) || []
    };
  });
};

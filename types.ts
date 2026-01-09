
export interface CostBreakdown {
  item: string;
  amount: number;
}

export interface VisionItem {
  id: string;
  title: string;
  category: 'place' | 'item' | 'experience';
  targetDate: string; // YYYY-MM
  estimatedCost: number;
  costBreakdown?: CostBreakdown[];
  currency: 'KRW' | 'USD';
  imageUrl: string;
  additionalImages?: string[]; // 상세페이지용 추가 이미지
  details?: string;
  specs?: string; 
  isAchieved?: boolean; // 달성 여부
  achievementDate?: string; // 실제 달성일
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

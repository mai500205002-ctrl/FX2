const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class HTTPFXService {
  private useMock: boolean;

  constructor(useMock = false) {
    this.useMock = useMock;
  }

  async generateInsight(data: any) {
    if (this.useMock) {
      return { id: 'mock-insight', content: 'رؤية إبداعية وهمية للاختبار السريع', score: 90 };
    }
    const res = await fetch(`${API_BASE_URL}/api/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async generateConcept(data: any) {
    const res = await fetch(`${API_BASE_URL}/api/concept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async runFullPipeline(data: any) {
    const res = await fetch(`${API_BASE_URL}/api/full-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }
}

export const fxService = new HTTPFXService();

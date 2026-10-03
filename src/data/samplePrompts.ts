import type { PromptDomain } from '../types';

export interface SamplePrompt {
  id: string;
  title: string;
  domain: PromptDomain;
  prompt: string;
  expectedTier: string;
  description: string;
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  // 1. Research & Reasoning
  {
    id: 'res-low',
    title: 'Nghiên cứu thị trường AI (Prompt sơ sài)',
    domain: 'research',
    expectedTier: 'Yếu',
    description: 'Prompt ngắn, thiếu ngữ cảnh, không có ràng buộc format',
    prompt: 'Nghiên cứu cho tôi thị trường AI Agent trong năm 2026 và các xu hướng mới.'
  },
  {
    id: 'res-high',
    title: 'Phân tích chiến lược AI Agent 2026 (Chuẩn 95+ điểm)',
    domain: 'research',
    expectedTier: 'Xuất sắc',
    description: 'Đầy đủ vai trò Senior Analyst, phân rã CoT, ma trận so sánh, bảng rủi ro',
    prompt: `[ROLE & CONTEXT]: Bạn là Giám đốc Nghiên cứu Chiến lược Công nghệ tại Gartner với 15 năm kinh nghiệm phân tích hệ sinh thái AI.
[OBJECTIVE & TASK]:
Thực hiện báo cáo thẩm định chuyên sâu về xu hướng "Autonomous AI Agents & PromptOps trong doanh nghiệp năm 2026".
Hãy phân tích theo 4 giai đoạn cụ thể:
1. Tổng quan thị trường & Tốc độ tăng trưởng CAGR (2024-2027).
2. Phân tích 3 rào cản công nghệ then chốt (Latency, Hallucination, Multi-agent Coordination).
3. Lập bảng ma trận so sánh giữa Centralized LLM vs Edge/Local SLMs.
4. Đề xuất lộ trình 4 bước chuyển đổi số an toàn cho các ngân hàng thương mại.

[CONSTRAINTS]:
- Tránh những nhận định chung chung, sáo rỗng; tập trung vào số liệu và luận cứ kỹ thuật.
- Tuyệt đối không trích dẫn các tin đồn chưa kiểm chứng.
- Giới hạn độ dài: 1.200 - 1.500 từ.

[OUTPUT FORMAT]:
- Sử dụng GitHub Flavored Markdown.
- Bắt buộc có ít nhất 2 bảng tổng hợp (Markdown Tables) và 1 sơ đồ luồng quy trình dạng Mermaid.`
  },

  // 2. Image Generation
  {
    id: 'img-low',
    title: 'Chân dung cô gái cyberpunk (Prompt cơ bản)',
    domain: 'image',
    expectedTier: 'Trung bình',
    description: 'Thiếu camera lens, ánh sáng, thông số render và negative prompt',
    prompt: 'A beautiful girl in cyberpunk city, neon lights, highly detailed, 8k.'
  },
  {
    id: 'img-high',
    title: 'Chân dung Điện ảnh 85mm Hasselblad (Chuẩn 95+ điểm)',
    domain: 'image',
    expectedTier: 'Xuất sắc',
    description: 'Chi tiết ánh sáng Volumetric, ống kính tiêu cự, chất liệu da, tham số --ar',
    prompt: `[SUBJECT]: Striking cinematic close-up portrait of a Vietnamese female cyber-hacker in her late 20s.
[ENVIRONMENT]: Drizzly Tokyo alleyway at dusk, reflective wet asphalt puddles mirroring neon cyan and magenta signage, atmospheric holographic mist.
[LIGHTING & COLOR]: Dramatic chiaroscuro lighting, soft warm key light from street lanterns, intense cool cyan rim light separating hair strands.
[CAMERA & SPECS]: Shot on Hasselblad H6D-100c, 85mm f/1.2 portrait lens, shallow depth of field with creamy bokeh, hyper-realistic skin texture with visible pores and subtle rain droplets.
[NEGATIVE PROMPT]: lowres, bad anatomy, deformed fingers, plastic skin, oversaturated, watermark, anime, CGI cartoon, extra limbs.
[MIDJOURNEY / FLUX PARAMS]: --ar 16:9 --style raw --v 6.1 --stop 100`
  },

  // 3. Video Generation
  {
    id: 'vid-low',
    title: 'Flycam qua thung lũng (Prompt thô)',
    domain: 'video',
    expectedTier: 'Yếu',
    description: 'Không có chuyển động camera, tốc độ khung hình, độ mượt',
    prompt: 'Drone flying over mountains with fog, beautiful morning sunrise.'
  },
  {
    id: 'vid-high',
    title: 'Cinematic FPV Drone Shot (Chuẩn 95+ điểm)',
    domain: 'video',
    expectedTier: 'Xuất sắc',
    description: 'Chỉ dẫn chuyển động camera 3 chiều, motion rate, ánh sáng sương mù',
    prompt: `[ROLE]: Hollywood Aerial Cinematographer for National Geographic.
[SCENE]: Majestic high-speed FPV drone dive soaring through misty Norwegian fjords at golden hour.
[CAMERA MOTION & DYNAMICS]: Continuous dynamic forward dolly diving down a 500m granite cliff, seamless horizontal roll following a waterfall, ending in a low-altitude skimming shot 2 meters above mirror-like fjord water.
[MOTION PACE & LIGHTING]: Motion speed factor 6/10, stable horizon lock, atmospheric morning god-rays piercing through dense pine forest mist, photorealistic fluid water physics.
[TECHNICAL CONSTRAINTS]: 60fps ultra-fluid motion, 4K resolution, cinematic aspect ratio 2.39:1, no warping artifacts, no sudden camera jerks or temporal morphing glitches.`
  },

  // 4. Code Generation
  {
    id: 'code-low',
    title: 'Crawler giá vàng Python (Prompt ngắn)',
    domain: 'code',
    expectedTier: 'Yếu',
    description: 'Không có tech stack, xử lý ngoại lệ, cấu trúc schema',
    prompt: 'Viết code python cào dữ liệu giá vàng.'
  },
  {
    id: 'code-high',
    title: 'High-Performance Async Crawler & Parser (Chuẩn 95+ điểm)',
    domain: 'code',
    expectedTier: 'Xuất sắc',
    description: 'Cấu trúc thư viện, Clean Architecture, typing Pydantic, retry/backoff',
    prompt: `[ROLE]: Senior Python Distributed Systems Engineer.
[TASK]: Xây dựng một module crawler dữ liệu biến động giá vàng tự động từ nguồn web tài chính với tiêu chuẩn Production.
[TECHNICAL REQUIREMENTS]:
1. Sử dụng Python 3.12+ với async/await (thư viện httpx và selectolax/BeautifulSoup).
2. Xây dựng cơ chế Exponential Backoff & Retry (tenacity) khi gặp lỗi kết nối hoặc HTTP 429/503.
3. Validate dữ liệu trả về bằng Pydantic V2 model: GoldPriceSchema { source: str, buy_price: float, sell_price: float, timestamp: datetime, unit: str }.
4. Sử dụng logging có cấu trúc (structlog) và xoay vòng User-Agent giả lập browser.

[CONSTRAINTS]:
- Tuyệt đối KHÔNG dùng Selenium hay Playwright (tránh tốn RAM server).
- Toàn bộ code phải có Type Hints đầy đủ 100% và Docstrings theo chuẩn Google Style.
- Viết kèm ít nhất 2 hàm pytest với mock httpx response để test unit.

[OUTPUT FORMAT]:
- Trả về mã nguồn hoàn chỉnh trong một file duy nhất, sạch sẽ, sẵn sàng copy chạy trực tiếp.`
  },

  // 5. Audio Generation
  {
    id: 'audio-low',
    title: 'Bài hát acoustic buồn (Prompt cơ bản)',
    domain: 'audio',
    expectedTier: 'Trung bình',
    description: 'Thiếu cấu trúc đoạn [Verse]/[Chorus], nhịp BPM, nhạc cụ',
    prompt: 'Acoustic guitar song about raining in autumn, sad feeling, male voice.'
  },
  {
    id: 'audio-high',
    title: 'Indie Folk Ballad with Verse/Chorus (Chuẩn 95+ điểm)',
    domain: 'audio',
    expectedTier: 'Xuất sắc',
    description: 'Đầy đủ cấu trúc bài hát, BPM, nhạc cụ mộc, thẻ phong cách Suno/Udio',
    prompt: `[GENRE & STYLE]: Melancholic Indie Folk Ballad, Fingerstyle Acoustic Guitar, Intimate Warm Vocals, Lo-Fi Vinyl Warmth.
[TEMPO & MOOD]: 72 BPM, Key of E Minor, reflective, gentle, emotional crescendo.
[INSTRUMENTATION]: Vintage Martin D-28 acoustic guitar, soft cello swell in chorus, subtle room reverb, subtle rain ambiance in background.

[LYRICS STRUCTURE]:
[Intro - Soft fingerpicking, gentle cello hum]

[Verse 1]
Midnight rain tapping on the glass,
Counting hours that slowly pass.
Your faded coat behind the wooden door,
Echoes of laughter we don't share anymore.

[Chorus - Emotional lift, double tracked vocals, warm strings]
And the leaves fall down like memories we made,
Colors in the autumn that refuse to fade.
If time was a river flowing in reverse,
I'd sing you the melody before the final verse.

[Outro - Solo acoustic fade-out with gentle breathing]`
  }
];

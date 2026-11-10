import type { GameState } from '../shared/types/state';

export type CulturalClueId = 'old_name' | 'river' | 'heritage' | 'festival';
export type CulturalClue = {
  id: CulturalClueId;
  heading: string;
  question: string;
  choices: readonly string[];
  correctChoice: number;
  fact: string;
  sourceTitle: string;
  sourceUrl: string;
  unlock: (state: GameState) => boolean;
};

const OFFICIAL = 'https://tamda.bacninh.gov.vn/news/-/details/65655/-en-can-vang-dau-an-lich-su-92692810';
const HERITAGE = 'https://mybacgiang.vn/vi/detailtravelplace/?id=2375';

/** Only claims traceable to a cited source belong in the educational quiz. */
export const CULTURAL_CLUES: readonly CulturalClue[] = [
  {
    id: 'old_name',
    heading: 'Dấu tích tên làng',
    question: 'Theo bài viết của xã Tam Đa, Thọ Đức ngày nay trước đây còn được gọi là làng nào?',
    choices: ['Làng Triền', 'Làng Vọng Nguyệt', 'Làng Quả Cảm'],
    correctChoice: 0,
    fact: 'Tư liệu giới thiệu đền Can Vang của xã Tam Đa gọi làng Triền là tên làng trước đây, nay là thôn Thọ Đức. Đây là cách ghi trong nguồn được dẫn, không phải kết luận về từ nguyên tên Thọ Đức.',
    sourceTitle: 'Xã Tam Đa · Đền Can Vang – Dấu ấn lịch sử (11/02/2026)',
    sourceUrl: OFFICIAL,
    unlock: state => state.quest.guideSpoken,
  },
  {
    id: 'river',
    heading: 'Dòng sông ký ức',
    question: 'Phòng tuyến gắn với bến Can Vang trong cuộc kháng chiến năm 1077 được gọi là phòng tuyến sông nào?',
    choices: ['Sông Hồng', 'Sông Như Nguyệt (sông Cầu)', 'Sông Đuống'],
    correctChoice: 1,
    fact: 'Bến Can Vang gắn với phòng tuyến Như Nguyệt năm 1077. Sông Như Nguyệt được gắn với dòng sông Cầu trong các tư liệu về hệ thống di tích. Trận địa và hoạt động chiến đấu được trình bày theo nguồn, không suy ra vị trí quân sự chính xác từ bản đồ game.',
    sourceTitle: 'Ban Quản lý Di tích tỉnh Bắc Ninh · Cụm di tích Thọ Đức',
    sourceUrl: HERITAGE,
    unlock: state => state.discoveredLocations.includes('den_can_vang'),
  },
  {
    id: 'heritage',
    heading: 'Ba dấu ấn văn hóa',
    question: 'Những địa điểm nào cùng thuộc cụm di tích đình, đền, chùa Thọ Đức?',
    choices: ['Đình Thọ Đức – Đền Can Vang – Chùa Tháp Linh', 'Đình Quả Cảm – Đền Vọng Nguyệt – Chùa Bồ Vàng', 'Đền Can Vang – Chùa Dâu – Thành Cổ Loa'],
    correctChoice: 0,
    fact: 'Tư liệu giới thiệu cụm di tích xác nhận đình Thọ Đức, đền Can Vang và chùa Tháp Linh thuộc cùng hệ thống di sản. Tọa độ ba điểm trong game vẫn ở trạng thái tạm xác định.',
    sourceTitle: 'Ban Quản lý Di tích tỉnh Bắc Ninh · Cụm di tích Thọ Đức',
    sourceUrl: HERITAGE,
    unlock: state => state.discoveredLocations.includes('chua_thap_linh'),
  },
  {
    id: 'festival',
    heading: 'Nhịp hội quê nhà',
    question: 'Theo bài giới thiệu của xã Tam Đa, hội làng Thọ Đức thường diễn ra vào những ngày nào (âm lịch)?',
    choices: ['Mùng 3–6 tháng 3', 'Mùng 1–3 tháng Giêng', 'Ngày 15 tháng 8'],
    correctChoice: 0,
    fact: 'Bài viết của xã Tam Đa nêu thời gian hội làng từ mùng 3 đến mùng 6 tháng 3 âm lịch. Thời gian tổ chức thực tế có thể thay đổi theo thông báo từng năm.',
    sourceTitle: 'Xã Tam Đa · Đền Can Vang – Dấu ấn lịch sử (11/02/2026)',
    sourceUrl: OFFICIAL,
    unlock: state => state.discoveredLocations.includes('dinh_tho_duc'),
  },
];

export const CULTURAL_STORAGE_KEY = 'tho-duc-cultural-clues-v1';
const isId = (value: unknown): value is CulturalClueId => typeof value === 'string' && CULTURAL_CLUES.some(c => c.id === value);

export function parseCulturalProgress(raw: string | null): CulturalClueId[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? [...new Set(value.filter(isId))] : [];
  } catch {
    return [];
  }
}

export function recordCulturalClue(progress: readonly CulturalClueId[], id: CulturalClueId): CulturalClueId[] {
  return [...new Set([...progress, id])];
}

export function culturalClueCount(progress: readonly CulturalClueId[]): number {
  return CULTURAL_CLUES.filter(clue => progress.includes(clue.id)).length;
}

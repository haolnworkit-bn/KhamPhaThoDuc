import { useEffect, useState } from 'react';
import type { GameState } from '../../shared/types/state';
import {
  CULTURAL_CLUES, CULTURAL_STORAGE_KEY, culturalClueCount,
  parseCulturalProgress, recordCulturalClue, type CulturalClueId,
} from '../../services/CulturalDiscoveryService';

interface Props { state: GameState; onClose: () => void }

/** Quiz-as-exploration, not a replacement for visiting physical world interaction points. */
export function CulturalTrailPanel({ state, onClose }: Props) {
  const [collected, setCollected] = useState<CulturalClueId[]>(() => {
    try { return parseCulturalProgress(window.localStorage.getItem(CULTURAL_STORAGE_KEY)); }
    catch { return []; }
  });
  const [answers, setAnswers] = useState<Partial<Record<CulturalClueId, number>>>({});
  const [activeId, setActiveId] = useState<CulturalClueId>('old_name');
  const active = CULTURAL_CLUES.find(clue => clue.id === activeId)!;
  const unlocked = active.unlock(state);
  const isCorrect = collected.includes(active.id);
  const chosen = answers[active.id];
  const count = culturalClueCount(collected);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const answer = (index: number) => {
    if (!unlocked || isCorrect) return;
    setAnswers(current => ({ ...current, [active.id]: index }));
    if (index !== active.correctChoice) return;
    const next = recordCulturalClue(collected, active.id);
    setCollected(next);
    try { window.localStorage.setItem(CULTURAL_STORAGE_KEY, JSON.stringify(next)); }
    catch { /* Game remains playable when storage is unavailable. */ }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal cultural-panel" role="dialog" aria-modal="true" aria-labelledby="cultural-title">
        <div className="eyebrow">Chương 1 · Bản đồ ký ức quê hương</div>
        <h2 id="cultural-title">Giải mã Thọ Đức</h2>
        <p>Trò chuyện và đi đến các địa điểm trong làng để mở khóa từng manh mối. Chọn đáp án, đọc tư liệu và hoàn thành bộ thẻ văn hóa.</p>
        <div className="cultural-progress" role="status" aria-live="polite">
          <strong>{count}/{CULTURAL_CLUES.length} thẻ kiến thức</strong>
          <div className="progress-track"><span style={{ width: `${count / CULTURAL_CLUES.length * 100}%` }} /></div>
        </div>
        <div className="cultural-tabs" aria-label="Manh mối khám phá">
          {CULTURAL_CLUES.map((clue, i) => (
            <button key={clue.id} type="button"
              className={clue.id === active.id ? 'selected' : ''}
              aria-pressed={clue.id === active.id}
              onClick={() => setActiveId(clue.id)}>
              {collected.includes(clue.id) ? '✓ ' : clue.unlock(state) ? '◈ ' : '◇ '}
              {i + 1}. {clue.heading}
            </button>
          ))}
        </div>
        <div className="cultural-clue">
          <h3>{active.heading}</h3>
          {!unlocked ? (
            <p className="cultural-locked">Manh mối chưa mở. {active.id === 'old_name' ? 'Hãy trò chuyện với Người dẫn chuyện.' : active.id === 'river' ? 'Hãy khám phá Đền Can Vang.' : active.id === 'heritage' ? 'Hãy đến Chùa Tháp Linh.' : 'Hãy đến Đình Thọ Đức.'}</p>
          ) : (
            <>
              <p><strong>{active.question}</strong></p>
              <div className="cultural-choices">
                {active.choices.map((choice, i) => (
                  <button key={choice} type="button"
                    className={isCorrect && i === active.correctChoice ? 'correct' : ''}
                    disabled={isCorrect}
                    onClick={() => answer(i)}>
                    {choice}
                  </button>
                ))}
              </div>
              {chosen !== undefined && !isCorrect && <p className="cultural-feedback" role="alert">Chưa chính xác. Hãy thử một giả thuyết khác.</p>}
              {isCorrect && <div className="cultural-reveal" role="status">
                <strong>Đã giải mã manh mối!</strong>
                <p>{active.fact}</p>
                <a href={active.sourceUrl} target="_blank" rel="noopener noreferrer">Đọc tư liệu gốc: {active.sourceTitle}</a>
              </div>}
            </>
          )}
        </div>
        <p className="verification-note">Các thẻ dựa trên nguồn được dẫn. Tọa độ di tích trong game là tạm xác định; địa giới cụ thể và nguồn gốc từ nguyên tên Thọ Đức cần thêm tư liệu địa phương.</p>
        <div className="modal-actions">
          <button autoFocus type="button" onClick={onClose}>Quay lại khám phá</button>
        </div>
      </section>
    </div>
  );
}

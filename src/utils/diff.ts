import type { DiffToken } from '../types';

/**
 * Thuật toán tính toán Visual Diff giữa Text A (Bản cũ) và Text B (Bản mới)
 * Hỗ trợ bóc tách từng từ và khoảng trắng để hiển thị trực quan
 */
export function computeWordDiff(oldText: string, newText: string): DiffToken[] {
  const oldWords = oldText ? oldText.split(/(\s+|\b)/) : [];
  const newWords = newText ? newText.split(/(\s+|\b)/) : [];

  const n = oldWords.length;
  const m = newWords.length;

  // Giới hạn để tránh nghẽn CPU nếu văn bản quá dài
  if (n * m > 400000) {
    return [
      { type: 'removed', value: oldText },
      { type: 'added', value: newText }
    ];
  }

  // Ma trận LCS (Longest Common Subsequence)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Truy vết ngược để tạo tokens
  let i = n;
  let j = m;
  const tokens: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      tokens.unshift({ type: 'unchanged', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tokens.unshift({ type: 'added', value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      tokens.unshift({ type: 'removed', value: oldWords[i - 1] });
      i--;
    }
  }

  // Gom các token cùng loại liên tiếp lại để tối ưu render
  const merged: DiffToken[] = [];
  for (const t of tokens) {
    if (!t.value) continue;
    if (merged.length > 0 && merged[merged.length - 1].type === t.type) {
      merged[merged.length - 1].value += t.value;
    } else {
      merged.push({ ...t });
    }
  }

  return merged;
}

import { describe, expect, it } from 'vitest';
import type { PromptVersion } from '../src/types';
import { findCommonAncestor, getBranchHead, mergePromptContents } from '../src/utils/versionGraph';

const version = (id: string, branchName: string, content: string, createdAt: string, parentId?: string): PromptVersion => ({ id, branchName, content, createdAt, parentId, contentHash: id, versionNumber: id, commitMessage: id, stage: 'draft' });

describe('version graph', () => {
  const versions = [version('feature', 'feature/x', 'B', '2026-01-03', 'root'), version('main2', 'main', 'C', '2026-01-02', 'root'), version('root', 'main', 'A', '2026-01-01')];
  it('resolves heads and common ancestors', () => {
    expect(getBranchHead(versions, 'main')?.id).toBe('main2');
    expect(findCommonAncestor(versions, 'main2', 'feature')?.id).toBe('root');
  });
  it('fast-forwards unchanged side and marks divergent conflicts', () => {
    expect(mergePromptContents('A', 'A', 'B', 'feature')).toEqual({ content: 'B', conflicted: false });
    const conflict = mergePromptContents('A', 'C', 'B', 'feature');
    expect(conflict.conflicted).toBe(true);
    expect(conflict.content).toContain('>>>>>>> feature');
  });
});

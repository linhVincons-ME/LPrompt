import type { PromptVersion } from '../types';

export const BRANCH_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,63}$/;

export function getBranchNames(versions: PromptVersion[]): string[] {
  return [...new Set(['main', ...versions.map((version) => version.branchName)])].sort((a, b) => a === 'main' ? -1 : b === 'main' ? 1 : a.localeCompare(b));
}

export function getBranchHead(versions: PromptVersion[], branchName: string): PromptVersion | undefined {
  return versions
    .filter((version) => version.branchName === branchName)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function findCommonAncestor(versions: PromptVersion[], leftId?: string, rightId?: string): PromptVersion | undefined {
  const byId = new Map(versions.map((version) => [version.id, version]));
  const collect = (startId?: string) => {
    const ids = new Set<string>();
    const queue = startId ? [startId] : [];
    while (queue.length) {
      const id = queue.shift()!;
      if (ids.has(id)) continue;
      ids.add(id);
      const node = byId.get(id);
      if (node?.parentId) queue.push(node.parentId);
      if (node?.mergeParentId) queue.push(node.mergeParentId);
    }
    return ids;
  };
  const leftAncestors = collect(leftId);
  let cursor = rightId;
  while (cursor) {
    if (leftAncestors.has(cursor)) return byId.get(cursor);
    cursor = byId.get(cursor)?.parentId;
  }
  return undefined;
}

export function mergePromptContents(base: string, current: string, incoming: string, sourceBranch: string): { content: string; conflicted: boolean } {
  if (current === incoming) return { content: current, conflicted: false };
  if (current === base) return { content: incoming, conflicted: false };
  if (incoming === base) return { content: current, conflicted: false };
  return {
    content: `<<<<<<< current\n${current}\n=======\n${incoming}\n>>>>>>> ${sourceBranch}`,
    conflicted: true
  };
}

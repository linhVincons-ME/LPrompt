import { describe, expect, it } from 'vitest';
import { extractVariables, getInitialVariableValues, interpolateTemplate } from '../src/utils/template';

describe('prompt templates', () => {
  it('deduplicates variables and preserves unresolved placeholders', () => {
    expect(extractVariables('Hi {{ name }} {{name}} / {{team-id}}')).toEqual(['name', 'team-id']);
    expect(interpolateTemplate('Hi {{name}} from {{team}}', { name: 'Linh', team: '' })).toBe('Hi Linh from {{team}}');
  });
  it('preserves existing values when variables change', () => {
    expect(getInitialVariableValues(['a', 'b'], { a: '1', old: 'x' })).toEqual({ a: '1', b: '', old: 'x' });
  });
});

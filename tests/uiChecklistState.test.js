import test from 'node:test';
import assert from 'node:assert/strict';

import { applyChecklistStateToMarkdown, countCompleted } from '../src/components/uiChecklist/checklistState.js';

test('countCompleted returns completed and total counts', () => {
  assert.deepEqual(
    countCompleted({
      'task-0': true,
      'task-1': false,
      'task-2': true,
    }),
    { completed: 2, total: 3 }
  );
});

test('applyChecklistStateToMarkdown replaces checklist markers in order', () => {
  const markdown = ['- [ ] 第一项', '| [ ] | 第二项 |', '- [x] 第三项'].join('\n');

  assert.equal(
    applyChecklistStateToMarkdown(markdown, {
      'task-0': true,
      'task-1': false,
      'task-2': true,
    }),
    ['- [x] 第一项', '| [ ] | 第二项 |', '- [x] 第三项'].join('\n')
  );
});

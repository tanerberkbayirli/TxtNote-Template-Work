import test from 'node:test';
import assert from 'node:assert/strict';
import { alignLayoutElements, distributeLayoutElements, snapLayoutRect } from '../thesis/layoutGeometry.js';

const page = {
  widthMm: 210,
  heightMm: 297,
  margins: { topMm: 20, bottomMm: 20, leftMm: 25, rightMm: 25 },
};

const rect = (id, xMm, yMm = 40, widthMm = 10, heightMm = 10, extra = {}) =>
  ({ id, xMm, yMm, widthMm, heightMm, ...extra });

test('thesis layout geometry', async (t) => {
  await t.test('snaps object centers to another object center and reports a center guide', () => {
    const moving = rect('moving', 45.5, 40, 20, 10);
    const target = rect('target', 50, 70, 10, 10);
    const result = snapLayoutRect(moving, [target], page);

    assert.ok(Math.abs(result.rect.xMm - 45) < 1e-8);
    assert.ok(result.guides.some((guide) => guide.axis === 'x' && guide.positionMm === 55 && guide.kind === 'center'));
  });

  await t.test('snaps into the midpoint of a gap, with a 10 mm clearance on each side', () => {
    const moving = rect('moving', 19, 40, 20, 10);
    const peers = [rect('left', 0, 40, 10, 10), rect('right', 50, 40, 10, 10)];
    const result = snapLayoutRect(moving, peers, page);

    assert.ok(Math.abs(result.rect.xMm - 20) < 1e-8);
    assert.ok(result.guides.some((guide) => guide.axis === 'x' && guide.positionMm === 20 && guide.kind === 'gap' && guide.gapMm === 10));
  });

  await t.test('snaps to continue an existing 10 mm gap beyond a neighboring pair', () => {
    const moving = rect('moving', 41.2, 40, 10, 10);
    const peers = [rect('a', 0, 40, 10, 10), rect('b', 20, 40, 10, 10)];
    const result = snapLayoutRect(moving, peers, page);

    assert.ok(Math.abs(result.rect.xMm - 40) < 1e-8);
    assert.ok(result.guides.some((guide) => guide.axis === 'x' && guide.kind === 'gap' && guide.gapMm === 10));
  });

  await t.test('does not snap when the closest feature exceeds the threshold', () => {
    const moving = rect('moving', 18, 40, 10, 10);
    const result = snapLayoutRect(moving, [], page, [], 1.25);

    assert.deepEqual(result.rect, moving);
    assert.deepEqual(result.guides, []);
  });

  await t.test('aligns movable elements by the requested edge and leaves locked elements fixed', () => {
    const elements = [rect('a', 3, 4, 12, 8), rect('b', 30, 18, 8, 8), rect('locked', 50, 3, 4, 4, { locked: true })];
    const aligned = alignLayoutElements(elements, 'right');

    assert.deepEqual(aligned.map((item) => item.xMm), [26, 30, 50]);
    assert.deepEqual(aligned[2], elements[2]);
  });

  await t.test('aligns to page content edges and centers using the correct object edge', () => {
    const elements = [rect('a', 0, 0, 20, 12), rect('b', 30, 25, 10, 6)];

    const pageRight = alignLayoutElements(elements, 'pageRight', page);
    assert.deepEqual(pageRight.map((item) => item.xMm), [165, 175]);
    const pageCenterY = alignLayoutElements(elements, 'pageCenterY', page);
    assert.deepEqual(pageCenterY.map((item) => item.yMm), [142.5, 145.5]);
  });

  await t.test('distributes unlocked elements with equal gaps and preserves locked elements', () => {
    const elements = [
      rect('a', 0, 2, 10, 6),
      rect('b', 17, 20, 10, 6),
      rect('fixed', 100, 8, 10, 6, { locked: true }),
      rect('c', 40, 40, 10, 6),
    ];
    const distributed = distributeLayoutElements(elements, 'x');
    const byId = Object.fromEntries(distributed.map((item) => [item.id, item]));

    assert.ok(Math.abs(byId.a.xMm) < 1e-8);
    assert.ok(Math.abs(byId.b.xMm - 20) < 1e-8);
    assert.ok(Math.abs(byId.c.xMm - 40) < 1e-8);
    assert.deepEqual(byId.fixed, elements[2]);
  });
});

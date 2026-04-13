const { test, expect } = require('@playwright/test');
const { resetAll, BASE } = require('./fixtures/reset');

test.describe('recent_history bit-shift semantics', () => {
  test.beforeEach(async () => { await resetAll(); });

  test('mark endpoint shifts wrong/right into a 5-bit ring buffer', async () => {
    const id = 'test-card';

    // W → 0b00001
    await fetch(`${BASE}/api/stats/${id}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct: false }),
    });
    let stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[id].recent_history).toBe(0b00001);

    // W R → 0b00010
    await fetch(`${BASE}/api/stats/${id}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct: true }),
    });
    stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[id].recent_history).toBe(0b00010);

    // 4 more W's — total sequence: W R W W W W → last 5 bits = R W W W W = 0b01111
    for (let i = 0; i < 4; i++) {
      await fetch(`${BASE}/api/stats/${id}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct: false }),
      });
    }
    stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[id].recent_history).toBe(0b01111);
    expect(stats[id].recent_history & ~31).toBe(0); // masked to 5 bits
  });
});

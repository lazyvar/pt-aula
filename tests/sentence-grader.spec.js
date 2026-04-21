// tests/sentence-grader.spec.js
const { test, expect } = require('@playwright/test');
const { BASE } = require('./fixtures/truth');

test.describe('POST /api/grade-sentence — server validation', () => {
  test('400 when body is missing fields', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi' }),  // missing userPt, referencePt
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/en|userPt|referencePt/);
  });

  test('400 when any field is not a string', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi', userPt: 123, referencePt: 'ola' }),
    });
    expect(res.status).toBe(400);
  });

  test('500 when ANTHROPIC_API_KEY is not configured', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi', userPt: 'oi', referencePt: 'oi' }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/ANTHROPIC_API_KEY/);
  });
});

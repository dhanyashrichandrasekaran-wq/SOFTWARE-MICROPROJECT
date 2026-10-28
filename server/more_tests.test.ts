import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { getDb, closeDb } from './db';
import { seedDatabase } from './seed';
import { createServer } from '../server';
import { calculateDecisionScore, computeTotalScore } from './services/scoring';
import { hashPassword, verifyPassword } from './services/auth';

const TEST_DB_EXTRA = path.resolve(process.cwd(), 'test-extra-scamquest.db');

describe('ScamQuest Extended Functional & Boundary Test Suite', () => {
  let app: any;
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    process.env.DATABASE_PATH = TEST_DB_EXTRA;
    if (fs.existsSync(TEST_DB_EXTRA)) {
      fs.unlinkSync(TEST_DB_EXTRA);
    }
    getDb(TEST_DB_EXTRA);
    await seedDatabase(TEST_DB_EXTRA);

    const serverInstance = await createServer();
    app = serverInstance.app;

    const sRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex.student@scamquest.edu', password: 'StudentPass123!' });
    studentToken = sRes.body.token;

    const aRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@scamquest.edu', password: 'AdminPass123!' });
    adminToken = aRes.body.token;
  });

  afterAll(() => {
    closeDb();
    if (fs.existsSync(TEST_DB_EXTRA)) fs.unlinkSync(TEST_DB_EXTRA);
    if (fs.existsSync(`${TEST_DB_EXTRA}-wal`)) fs.unlinkSync(`${TEST_DB_EXTRA}-wal`);
    if (fs.existsSync(`${TEST_DB_EXTRA}-shm`)) fs.unlinkSync(`${TEST_DB_EXTRA}-shm`);
  });

  it('TC-14: Boundary test - Decision score normalization never exceeds 70 points', () => {
    const scores = [{ qualityScore: 10 }, { qualityScore: 15 }, { qualityScore: 20 }];
    const res = calculateDecisionScore(scores, 10);
    expect(res.score).toBeLessThanOrEqual(70);
  });

  it('TC-15: Boundary test - Total score never exceeds 100 points even with overflow', () => {
    const res = computeTotalScore(75, 35, 70);
    expect(res.totalScore).toBe(100);
  });

  it('TC-16: Boundary test - Total score handles all zeros correctly', () => {
    const res = computeTotalScore(0, 0, 70);
    expect(res.totalScore).toBe(0);
    expect(res.passed).toBe(false);
  });

  it('TC-17: Password hashing produces valid bcrypt hashes and verifies correctly', async () => {
    const plain = 'TestPassword123!';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('TC-18: Rejects unauthenticated access to protected routes with 401', async () => {
    const res = await request(app).get('/api/scenarios');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Authentication required');
  });

  it('TC-19: Rejects non-admin user from admin-only endpoints with 403', async () => {
    const res = await request(app)
      .post('/api/scenarios/scen-01/publish')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Administrator privileges required');
  });

  it('TC-20: Rejects duplicate decision on the same scene with 400', async () => {
    // Start fresh attempt on scen-04 for Alex
    const startRes = await request(app)
      .post('/api/attempts/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ scenarioId: 'scen-04' });

    const attId = startRes.body.attemptId;

    // Submit choice ch-04-1 (leads to scn-04-s3b terminal)
    const dec1 = await request(app)
      .post(`/api/attempts/${attId}/decision`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ choiceId: 'ch-04-1' });

    expect(dec1.status).toBe(200);

    // Attempting to submit another decision on completed attempt must fail
    const dec2 = await request(app)
      .post(`/api/attempts/${attId}/decision`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ choiceId: 'ch-04-1' });

    expect(dec2.status).toBe(400);
    expect(dec2.body.error).toContain('already completed');
  });

  it('TC-21: Rejects invalid confidence ratings outside 1-5 with 400', async () => {
    const startRes = await request(app)
      .post('/api/attempts/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ scenarioId: 'scen-05' });

    const attId = startRes.body.attemptId;

    const badRating0 = await request(app)
      .post(`/api/attempts/${attId}/confidence`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ rating: 0 });
    expect(badRating0.status).toBe(400);

    const badRating6 = await request(app)
      .post(`/api/attempts/${attId}/confidence`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ rating: 6 });
    expect(badRating6.status).toBe(400);
  });

  it('TC-22: Historical attempts survive scenario archiving and editing', async () => {
    // Alex has seeded attempt att-seed-01 on scen-01
    const beforeArchive = await request(app)
      .get('/api/attempts/att-seed-01')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(beforeArchive.status).toBe(200);

    // Admin archives scen-01
    const archiveRes = await request(app)
      .post('/api/scenarios/scen-01/archive')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(archiveRes.status).toBe(200);

    // Attempt att-seed-01 is still queryable and history is preserved!
    const afterArchive = await request(app)
      .get('/api/attempts/att-seed-01')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(afterArchive.status).toBe(200);
    expect(afterArchive.body.attempt.total_score).toBe(90);

    // Un-archive / publish back
    await request(app)
      .post('/api/scenarios/scen-01/publish')
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('TC-23: Logout clears authentication cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toContain('scamquest_token=;');
  });
});

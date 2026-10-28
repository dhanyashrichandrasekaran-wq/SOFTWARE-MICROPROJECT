import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { getDb, closeDb } from './db';
import { seedDatabase } from './seed';
import { createServer } from '../server';

const TEST_DB = path.resolve(process.cwd(), 'test-scamquest.db');

describe('ScamQuest API Integration Suite', () => {
  let app: any;
  let studentToken: string;
  let adminToken: string;
  let student2Token: string;
  let studentId: string;
  let student2Id: string;

  beforeAll(async () => {
    process.env.DATABASE_PATH = TEST_DB;
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
    const db = getDb(TEST_DB);
    await seedDatabase(TEST_DB);

    const serverInstance = await createServer();
    app = serverInstance.app;

    // Login admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@scamquest.edu', password: 'AdminPass123!' });
    adminToken = adminRes.body.token;

    // Login student 1 (Alex)
    const s1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex.student@scamquest.edu', password: 'StudentPass123!' });
    studentToken = s1Res.body.token;
    studentId = s1Res.body.user.id;

    // Login student 2 (Sam)
    const s2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sam.student@scamquest.edu', password: 'StudentPass123!' });
    student2Token = s2Res.body.token;
    student2Id = s2Res.body.user.id;
  });

  afterAll(() => {
    closeDb();
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
    // Clean up wal/shm files if present
    if (fs.existsSync(`${TEST_DB}-wal`)) fs.unlinkSync(`${TEST_DB}-wal`);
    if (fs.existsSync(`${TEST_DB}-shm`)) fs.unlinkSync(`${TEST_DB}-shm`);
  });

  it('GET /api/health returns operational status and SQLite engine info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toContain('SQLite');
  });

  it('enforces student role on registration; prevents privilege escalation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'attacker@scamquest.edu',
        name: 'Sneaky Attacker',
        password: 'Password123!',
        role: 'admin', // Attacker attempts to register as admin
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('student'); // Must be forced to student
  });

  it('rejects login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex.student@scamquest.edu', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  it('GET /api/scenarios returns published scenarios for authenticated student', async () => {
    const res = await request(app)
      .get('/api/scenarios')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.scenarios).toBeInstanceOf(Array);
    expect(res.body.scenarios.length).toBeGreaterThanOrEqual(6);
  });

  it('masks answer keys and hidden scoring from student scenario details', async () => {
    const res = await request(app)
      .get('/api/scenarios/scen-01')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const { evidence, choices } = res.body;

    // Student must not see answer keys ahead of time
    expect(evidence[0].is_legitimate).toBeUndefined();
    expect(evidence[0].explanation).toBeUndefined();
    expect(choices[0].quality_score).toBeUndefined();
    expect(choices[0].feedback_text).toBeUndefined();
  });

  it('allows student to start a new attempt or resume active attempt', async () => {
    const res = await request(app)
      .post('/api/attempts/start')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ scenarioId: 'scen-02' });

    expect(res.status).toBe(201);
    expect(res.body.attemptId).toBeDefined();

    // Calling start again should resume the same attempt
    const resumeRes = await request(app)
      .post('/api/attempts/start')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ scenarioId: 'scen-02' });

    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.resumed).toBe(true);
    expect(resumeRes.body.attemptId).toBe(res.body.attemptId);
  });

  it('enforces attempt ownership; student cannot inspect another student attempt', async () => {
    // Alex's seeded attempt
    const res = await request(app)
      .get('/api/attempts/att-seed-01')
      .set('Authorization', `Bearer ${student2Token}`); // Sam tries to access Alex's attempt

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('records evidence selection and updates score in real-time', async () => {
    // Start attempt on Scenario 1 for Sam
    const startRes = await request(app)
      .post('/api/attempts/start')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ scenarioId: 'scen-01' });

    const attemptId = startRes.body.attemptId;

    // Toggle evidence ev-01-1 as suspicious (it is suspicious in scen-01)
    const evRes = await request(app)
      .post(`/api/attempts/${attemptId}/evidence`)
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ evidenceId: 'ev-01-1', selectedAsSuspicious: true });

    expect(evRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(getRes.body.attempt.evidence_score).toBeGreaterThan(0);
  });

  it('handles decision submission, confidence capture, and completion', async () => {
    const startRes = await request(app)
      .post('/api/attempts/start')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ scenarioId: 'scen-01' });

    const attemptId = startRes.body.attemptId;

    // Record confidence rating
    const confRes = await request(app)
      .post(`/api/attempts/${attemptId}/confidence`)
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ rating: 4 });

    expect(confRes.status).toBe(200);

    // Submit choice ch-01-2 (verify with career center -> leads to terminal success scn-01-s3b)
    const decRes = await request(app)
      .post(`/api/attempts/${attemptId}/decision`)
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ choiceId: 'ch-01-2', confidenceRating: 4 });

    expect(decRes.status).toBe(200);
    expect(decRes.body.completed).toBe(true);
    expect(decRes.body.scoreSummary.totalScore).toBeGreaterThan(0);

    // Verify attempt is marked completed in DB
    const finalAtt = await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(finalAtt.body.attempt.status).toBe('completed');
  });

  it('initializes alternate outcome practice replay without modifying original attempt', async () => {
    // Target Alex's completed attempt att-seed-01
    const originalAttBefore = await request(app)
      .get('/api/attempts/att-seed-01')
      .set('Authorization', `Bearer ${studentToken}`);

    const originalScore = originalAttBefore.body.attempt.total_score;

    // Fork from scene scn-01-s1 to test alternate choice
    const replayRes = await request(app)
      .post('/api/attempts/att-seed-01/replay')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ forkSceneId: 'scn-01-s1' });

    expect(replayRes.status).toBe(201);
    expect(replayRes.body.replayAttemptId).toBeDefined();

    // Check replay attempt state
    const replayAtt = await request(app)
      .get(`/api/attempts/${replayRes.body.replayAttemptId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(replayAtt.body.attempt.is_replay).toBe(1);
    expect(replayAtt.body.attempt.parent_attempt_id).toBe('att-seed-01');

    // Make an alternate (bad) choice in replay
    const repDecRes = await request(app)
      .post(`/api/attempts/${replayRes.body.replayAttemptId}/decision`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ choiceId: 'ch-01-1' });

    expect(repDecRes.status).toBe(200);

    // Verify original attempt score is completely intact and unchanged!
    const originalAttAfter = await request(app)
      .get('/api/attempts/att-seed-01')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(originalAttAfter.body.attempt.total_score).toBe(originalScore);
    expect(originalAttAfter.body.attempt.is_replay).toBe(0);
  });

  it('GET /api/analytics/student returns calculated skill weaknesses and attempt history', async () => {
    const res = await request(app)
      .get('/api/analytics/student')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.recentAttempts).toBeInstanceOf(Array);
    expect(res.body.skillBreakdown).toBeInstanceOf(Array);
  });

  it('GET /api/analytics/admin returns scenario counts, pass rates and vulnerability breakdown', async () => {
    const res = await request(app)
      .get('/api/analytics/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalScenarios).toBeGreaterThanOrEqual(6);
    expect(res.body.scenarioPerformance).toBeInstanceOf(Array);
    expect(res.body.categoryVulnerabilities).toBeInstanceOf(Array);
  });

  it('GET /api/scenarios/:id/validate returns graph validation for admin', async () => {
    const res = await request(app)
      .get('/api/scenarios/scen-01/validate')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.errors).toHaveLength(0);
  });
});

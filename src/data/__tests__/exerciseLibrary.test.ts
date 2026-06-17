import { fitSessionToBudget } from '../exerciseLibrary';
import { PREP_SECS, SESSIONS } from '../sessions';

const cost = (secs: number) => secs + PREP_SECS;
const sumCost = (durations: number[]) =>
  durations.reduce((acc, d) => acc + cost(d), 0);

describe('fitSessionToBudget', () => {
  const session = SESSIONS[0];

  it('returns the full session unchanged when no budget is set (Auto)', () => {
    expect(fitSessionToBudget(session, undefined)).toBe(session.exercises);
    expect(fitSessionToBudget(session, 0)).toBe(session.exercises);
  });

  it('trims to fit a tight budget but always keeps at least one exercise', () => {
    // 1-minute budget is smaller than the curated session — expect a trim.
    const picked = fitSessionToBudget(session, 1);
    expect(picked.length).toBeGreaterThanOrEqual(1);
    expect(picked.length).toBeLessThanOrEqual(session.exercises.length);
    // Total packed time stays within the budget.
    expect(sumCost(picked.map(e => e.duration))).toBeLessThanOrEqual(60);
    // Trimming preserves the curated order from the start of the session.
    expect(picked).toEqual(session.exercises.slice(0, picked.length));
  });

  it('keeps at least one exercise even when a single one exceeds the budget', () => {
    const picked = fitSessionToBudget(session, 0.1); // 6s budget, smaller than any exercise
    expect(picked.length).toBe(1);
    expect(picked[0]).toBe(session.exercises[0]);
  });

  it('extends with library exercises when the budget exceeds the session', () => {
    const baseCount = session.exercises.length;
    const picked = fitSessionToBudget(session, 30); // generous budget
    expect(picked.length).toBeGreaterThan(baseCount);
    // The whole curated session is kept as the prefix.
    expect(picked.slice(0, baseCount)).toEqual(session.exercises);
    // No duplicate ids are introduced by the extend path.
    const ids = picked.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Stays within the budget.
    expect(sumCost(picked.map(e => e.duration))).toBeLessThanOrEqual(30 * 60);
  });
});

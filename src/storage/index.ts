import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedState, SessionPlan } from '../types';

const STORAGE_KEY = 'deskwork-v3';
// The generated session plan lives under its own key so completion/settings writes
// (frequent) never race with plan writes (rare). See useSessionPlan (#38 Phase C).
const PLAN_KEY = 'deskwork-plan-v1';

export async function loadState(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export async function loadPlan(): Promise<SessionPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionPlan;
  } catch {
    return null;
  }
}

export async function savePlan(plan: SessionPlan): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch {}
}

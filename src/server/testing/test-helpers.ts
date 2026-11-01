/**
 * Test helpers for integration tests
 * Provides utilities for creating test users, events, and authenticated requests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from '@/server/db/client';
import { user, events, budgetCategories, tasks, vendors, ideas } from '@/server/db/schema';
import { expenses } from '@/server/db/schema/budget';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export interface TestEvent {
  id: string;
  ownerId: string;
  type: string;
  title: string;
  eventDate: string;
  timezone: string;
  city: string;
  guestCount: number;
  currency: string;
  totalBudgetMinor: number;
}

/**
 * Create a test user with Better Auth
 */
export async function createTestUser(index: number = 1): Promise<TestUser> {
  const userId = crypto.randomUUID();
  const email = `test-user-${index}-${Date.now()}@example.com`;
  const name = `Test User ${index}`;
  const password = `TestPassword${index}!`;

  // Create user directly in DB (bypassing Better Auth for tests)
  await db.insert(user).values({
    id: userId,
    email,
    name,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: userId, email, name, password };
}

/**
 * Create a test event for a user
 */
export async function createTestEvent(
  ownerId: string,
  overrides: Partial<TestEvent> = {}
): Promise<TestEvent> {
  const eventId = crypto.randomUUID();
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 30);
  const eventDateString = eventDate.toISOString().split('T')[0]!;

  const event: any = {
    id: eventId,
    ownerId,
    type: 'wedding' as const,
    title: 'Test Event',
    eventDate: eventDateString,
    timezone: 'America/New_York',
    city: 'New York',
    guestCount: 100,
    currency: 'USD' as const,
    totalBudgetMinor: 5000000,
    preferences: {},
    ...overrides,
  };

  await db.insert(events).values(event);

  return event as TestEvent;
}

/**
 * Create test budget categories for an event
 */
export async function createTestBudgetCategories(eventId: string) {
  const categories = [
    {
      eventId,
      categoryKey: 'venue',
      allocatedMinor: 1500000,
    },
    {
      eventId,
      categoryKey: 'catering',
      allocatedMinor: 2000000,
    },
  ];

  await db.insert(budgetCategories).values(categories);
  return categories;
}

/**
 * Create a test task for an event
 */
export async function createTestTask(eventId: string, overrides: Record<string, unknown> = {}) {
  const taskId = crypto.randomUUID();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const dueDateStr = dueDate.toISOString().split('T')[0]!;

  const task = {
    id: taskId,
    eventId,
    title: 'Test Task',
    categoryKey: 'venue',
    dueDate: dueDateStr,
    priority: 'medium' as const,
    status: 'todo' as const,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.insert(tasks).values(task);
  return task;
}

/**
 * Create a test vendor item for an event
 */
export async function createTestVendorItem(eventId: string, overrides: Record<string, unknown> = {}) {
  const vendorId = crypto.randomUUID();

  const vendor = {
    id: vendorId,
    eventId,
    categoryKey: 'venue',
    need: 'Event Space',
    questions: ['What is your capacity?', 'What is included?'],
    status: 'not_started' as const,
    isMustHave: true,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.insert(vendors).values(vendor);
  return vendor;
}

/**
 * Create a test idea for an event
 */
export async function createTestIdea(eventId: string, overrides: Record<string, unknown> = {}) {
  const ideaId = crypto.randomUUID();

  const idea = {
    id: ideaId,
    eventId,
    kind: 'theme',
    title: 'Test Idea',
    description: 'A great idea',
    costTier: 'medium',
    categoryKey: null,
    createdAt: new Date(),
    ...overrides,
  };

  await db.insert(ideas).values(idea);
  return idea;
}

/**
 * Create a test expense for a budget category
 */
export async function createTestExpense(
  eventId: string,
  categoryKey: string,
  overrides: Record<string, unknown> = {}
) {
  const expenseId = crypto.randomUUID();

  const expense = {
    id: expenseId,
    eventId,
    categoryKey,
    label: 'Test Expense',
    amountMinor: 50000,
    status: 'committed' as const,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.insert(expenses).values(expense);
  return expense;
}

/**
 * Clean up test data for a user
 */
export async function cleanupTestUser(userId: string) {
  // Delete events and cascade will handle related data
  await db.delete(events).where(eq(events.ownerId, userId));
  
  // Delete user
  await db.delete(user).where(eq(user.id, userId));
}

/**
 * Mock authenticated request headers
 * Note: In real tests, you'll need to set up proper Better Auth session cookies
 */
export function createAuthHeaders(userId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    // In real tests, you would set session cookies here
    // This is a placeholder - Better Auth uses HTTP-only cookies
  };
}

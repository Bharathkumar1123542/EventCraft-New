import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationService } from './generation.service';
import type { Database } from '../db/client';

// Mock all repositories
vi.mock('../db/repositories', () => ({
  EventsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    getById: vi.fn(),
  })),
  BudgetRepository: vi.fn().mockImplementation(() => ({
    setCategories: vi.fn(),
    getCategories: vi.fn(),
  })),
  TasksRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    listByEvent: vi.fn(),
  })),
  VendorsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    listByEvent: vi.fn(),
  })),
  IdeasRepository: vi.fn().mockImplementation(() => ({})),
  GenerationRepository: vi.fn().mockImplementation(() => ({
    createRun: vi.fn(),
  })),
}));

// Mock AI generate
vi.mock('../ai/generate', () => ({
  generateStructured: vi.fn(),
}));

// Mock prompts
vi.mock('../ai/prompts', () => ({
  buildInitialPlanPrompt: vi.fn(() => 'prompt'),
  buildBudgetSuggestionPrompt: vi.fn(() => 'prompt'),
  buildTaskSuggestionPrompt: vi.fn(() => 'prompt'),
  buildVendorSuggestionPrompt: vi.fn(() => 'prompt'),
  buildIdeaSuggestionPrompt: vi.fn(() => 'prompt'),
}));

// Mock schemas
vi.mock('../ai/schemas', () => ({
  initialPlanSchema: {},
  budgetSuggestionSchema: {},
  taskSuggestionSchema: {},
  vendorSuggestionSchema: {},
  ideaSuggestionSchema: {},
}));

import { generateStructured } from '../ai/generate';
import {
  EventsRepository,
  BudgetRepository,
  TasksRepository,
  VendorsRepository,
  GenerationRepository,
} from '../db/repositories';

describe('GenerationService', () => {
  let service: GenerationService;
  let mockDb: Database;
  let mockEventsRepo: any;
  let mockBudgetRepo: any;
  let mockTasksRepo: any;
  let mockVendorsRepo: any;
  let mockGenRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {} as Database;
    service = new GenerationService(mockDb);

    // Get the mocked repository instances
    mockEventsRepo = {
      create: vi.fn(),
      getById: vi.fn(),
    };
    mockBudgetRepo = {
      setCategories: vi.fn(),
      getCategories: vi.fn(),
    };
    mockTasksRepo = {
      create: vi.fn(),
      listByEvent: vi.fn(),
    };
    mockVendorsRepo = {
      create: vi.fn(),
      listByEvent: vi.fn(),
    };
    mockGenRepo = {
      createRun: vi.fn(),
    };

    // Make the repository constructors return our mocks
    (EventsRepository as any).mockImplementation(() => mockEventsRepo);
    (BudgetRepository as any).mockImplementation(() => mockBudgetRepo);
    (TasksRepository as any).mockImplementation(() => mockTasksRepo);
    (VendorsRepository as any).mockImplementation(() => mockVendorsRepo);
    (GenerationRepository as any).mockImplementation(() => mockGenRepo);
  });

  describe('generateInitialPlan', () => {
    it('creates event with generated plan', async () => {
      const mockResult = {
        data: {
          title: 'Generated Event Title',
          budgetCategories: [
            { categoryKey: 'venue', allocatedMinor: 100000 },
            { categoryKey: 'catering', allocatedMinor: 200000 },
          ],
          tasks: [
            {
              title: 'Book venue',
              categoryKey: 'venue',
              dueDate: '2025-01-15',
              priority: 'high',
            },
          ],
          vendors: [
            {
              categoryKey: 'venue',
              need: 'Event Space',
              questions: ['Capacity?'],
              isMustHave: true,
            },
          ],
        },
        usage: { inputTokens: 100, outputTokens: 200 },
        latencyMs: 500,
        modelName: 'claude-3-5-sonnet-20241022',
      };

      (generateStructured as any).mockResolvedValue(mockResult);

      mockEventsRepo.create.mockResolvedValue({
        id: 'event-123',
        ownerId: 'user-123',
      });

      const input = {
        userId: 'user-123',
        type: 'wedding' as const,
        eventDate: '2025-06-15',
        timezone: 'America/New_York',
        city: 'New York',
        guestCount: 100,
        currency: 'USD' as const,
        totalBudgetMinor: 5000000,
        userPrompt: 'Plan my dream wedding',
        preferences: {},
      };

      const result = await service.generateInitialPlan(input);

      expect(result).toEqual({ eventId: 'event-123' });

      // Verify event created
      expect(mockEventsRepo.create).toHaveBeenCalledWith({
        ownerId: 'user-123',
        type: 'wedding',
        title: 'Generated Event Title',
        eventDate: '2025-06-15',
        timezone: 'America/New_York',
        city: 'New York',
        guestCount: 100,
        currency: 'USD',
        totalBudgetMinor: 5000000,
        preferences: {},
      });

      // Verify budget set
      expect(mockBudgetRepo.setCategories).toHaveBeenCalledWith({
        eventId: 'event-123',
        ownerId: 'user-123',
        categories: mockResult.data.budgetCategories,
      });

      // Verify tasks created
      expect(mockTasksRepo.create).toHaveBeenCalledTimes(1);
      expect(mockTasksRepo.create).toHaveBeenCalledWith({
        eventId: 'event-123',
        ownerId: 'user-123',
        title: 'Book venue',
        categoryKey: 'venue',
        dueDate: '2025-01-15',
        priority: 'high',
      });

      // Verify vendors created
      expect(mockVendorsRepo.create).toHaveBeenCalledTimes(1);

      // Verify generation tracked
      expect(mockGenRepo.createRun).toHaveBeenCalledWith({
        eventId: 'event-123',
        userId: 'user-123',
        feature: 'initial_plan',
        modelName: 'claude-3-5-sonnet-20241022',
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 500,
      });
    });

    it('handles multiple tasks and vendors', async () => {
      const mockResult = {
        data: {
          title: 'Event',
          budgetCategories: [],
          tasks: [
            { title: 'Task 1', categoryKey: null, dueDate: '2025-01-01', priority: 'low' },
            { title: 'Task 2', categoryKey: null, dueDate: '2025-01-02', priority: 'medium' },
            { title: 'Task 3', categoryKey: null, dueDate: '2025-01-03', priority: 'high' },
          ],
          vendors: [
            { categoryKey: 'venue', need: 'Venue', questions: [], isMustHave: true },
            { categoryKey: 'catering', need: 'Caterer', questions: [], isMustHave: false },
          ],
        },
        usage: { inputTokens: 100, outputTokens: 200 },
        latencyMs: 500,
        modelName: 'fake',
      };

      (generateStructured as any).mockResolvedValue(mockResult);
      mockEventsRepo.create.mockResolvedValue({ id: 'event-123' });

      const input = {
        userId: 'user-123',
        type: 'birthday' as const,
        eventDate: '2025-03-20',
        timezone: 'UTC',
        city: null,
        guestCount: 50,
        currency: 'EUR' as const,
        totalBudgetMinor: 300000,
        userPrompt: 'Birthday party',
        preferences: {},
      };

      await service.generateInitialPlan(input);

      expect(mockTasksRepo.create).toHaveBeenCalledTimes(3);
      expect(mockVendorsRepo.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('suggestBudget', () => {
    it('returns budget suggestions for existing event', async () => {
      const mockEvent = {
        id: 'event-123',
        type: 'wedding',
        guestCount: 100,
        totalBudgetMinor: 5000000,
        currency: 'USD',
      };

      const mockCategories = [
        { categoryKey: 'venue', allocatedMinor: 1000000 },
        { categoryKey: 'catering', allocatedMinor: 2000000 },
      ];

      const mockResult = {
        data: {
          suggestions: [
            { categoryKey: 'venue', recommendedMinor: 1500000, reasoning: 'Adjust' },
          ],
        },
        usage: { inputTokens: 100, outputTokens: 200 },
        latencyMs: 500,
        modelName: 'fake',
      };

      mockEventsRepo.getById.mockResolvedValue(mockEvent);
      mockBudgetRepo.getCategories.mockResolvedValue(mockCategories);
      (generateStructured as any).mockResolvedValue(mockResult);

      const result = await service.suggestBudget({
        eventId: 'event-123',
        userId: 'user-123',
      });

      expect(result).toEqual(mockResult.data);
      expect(mockEventsRepo.getById).toHaveBeenCalledWith('event-123', 'user-123');
      expect(mockBudgetRepo.getCategories).toHaveBeenCalledWith('event-123', 'user-123');
      expect(mockGenRepo.createRun).toHaveBeenCalledWith({
        eventId: 'event-123',
        userId: 'user-123',
        feature: 'budget_suggest',
        modelName: 'fake',
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 500,
      });
    });

    it('throws when event not found', async () => {
      mockEventsRepo.getById.mockResolvedValue(null);

      await expect(
        service.suggestBudget({ eventId: 'nonexistent', userId: 'user-123' })
      ).rejects.toThrow('Event not found');
    });

    it('throws when budget not found', async () => {
      mockEventsRepo.getById.mockResolvedValue({ id: 'event-123' });
      mockBudgetRepo.getCategories.mockResolvedValue(null);

      await expect(
        service.suggestBudget({ eventId: 'event-123', userId: 'user-123' })
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('suggestTasks', () => {
    it('returns task suggestions for existing event', async () => {
      const mockEvent = {
        id: 'event-123',
        type: 'wedding',
        eventDate: '2025-06-15',
        guestCount: 100,
      };

      const mockExistingTasks = [
        { title: 'Existing Task 1' },
        { title: 'Existing Task 2' },
      ];

      const mockResult = {
        data: {
          suggestions: [
            { title: 'New Task', priority: 'high' },
          ],
        },
        usage: { inputTokens: 100, outputTokens: 200 },
        latencyMs: 500,
        modelName: 'fake',
      };

      mockEventsRepo.getById.mockResolvedValue(mockEvent);
      mockTasksRepo.listByEvent.mockResolvedValue(mockExistingTasks);
      (generateStructured as any).mockResolvedValue(mockResult);

      const result = await service.suggestTasks({
        eventId: 'event-123',
        userId: 'user-123',
      });

      expect(result).toEqual(mockResult.data);
      expect(mockTasksRepo.listByEvent).toHaveBeenCalledWith('event-123', 'user-123');
    });

    it('throws when event not found', async () => {
      mockEventsRepo.getById.mockResolvedValue(null);

      await expect(
        service.suggestTasks({ eventId: 'nonexistent', userId: 'user-123' })
      ).rejects.toThrow('Event not found');
    });

    it('throws when tasks not found', async () => {
      mockEventsRepo.getById.mockResolvedValue({ id: 'event-123' });
      mockTasksRepo.listByEvent.mockResolvedValue(null);

      await expect(
        service.suggestTasks({ eventId: 'event-123', userId: 'user-123' })
      ).rejects.toThrow('Tasks not found');
    });
  });

  describe('suggestVendors', () => {
    it('returns vendor suggestions for existing event', async () => {
      const mockEvent = {
        id: 'event-123',
        type: 'wedding',
        guestCount: 100,
      };

      const mockBudgetCategories = [
        { categoryKey: 'venue', allocatedMinor: 1000000 },
      ];

      const mockExistingVendors = [
        { need: 'Existing Vendor' },
      ];

      const mockResult = {
        data: {
          suggestions: [
            { categoryKey: 'catering', need: 'Caterer', isMustHave: true },
          ],
        },
        usage: { inputTokens: 100, outputTokens: 200 },
        latencyMs: 500,
        modelName: 'fake',
      };

      mockEventsRepo.getById.mockResolvedValue(mockEvent);
      mockBudgetRepo.getCategories.mockResolvedValue(mockBudgetCategories);
      mockVendorsRepo.listByEvent.mockResolvedValue(mockExistingVendors);
      (generateStructured as any).mockResolvedValue(mockResult);

      const result = await service.suggestVendors({
        eventId: 'event-123',
        userId: 'user-123',
      });

      expect(result).toEqual(mockResult.data);
      expect(mockBudgetRepo.getCategories).toHaveBeenCalledWith('event-123', 'user-123');
      expect(mockVendorsRepo.listByEvent).toHaveBeenCalledWith('event-123', 'user-123');
    });

    it('throws when event not found', async () => {
      mockEventsRepo.getById.mockResolvedValue(null);

      await expect(
        service.suggestVendors({ eventId: 'nonexistent', userId: 'user-123' })
      ).rejects.toThrow('Event not found');
    });

    it('throws when budget not found', async () => {
      mockEventsRepo.getById.mockResolvedValue({ id: 'event-123' });
      mockBudgetRepo.getCategories.mockResolvedValue(null);

      await expect(
        service.suggestVendors({ eventId: 'event-123', userId: 'user-123' })
      ).rejects.toThrow('Budget not found');
    });

    it('throws when vendors not found', async () => {
      mockEventsRepo.getById.mockResolvedValue({ id: 'event-123' });
      mockBudgetRepo.getCategories.mockResolvedValue([]);
      mockVendorsRepo.listByEvent.mockResolvedValue(null);

      await expect(
        service.suggestVendors({ eventId: 'event-123', userId: 'user-123' })
      ).rejects.toThrow('Vendors not found');
    });
  });

  describe('suggestIdeas', () => {
    it('returns idea suggestions for existing event', async () => {
      const mockEvent = {
        id: 'event-123',
        type: 'birthday',
        guestCount: 50,
        city: 'San Francisco',
        preferences: { theme: 'modern' },
      };

      const mockResult = {
        data: {
          ideas: [
            { title: 'Rooftop party', description: 'Great views' },
          ],
        },
        usage: { inputTokens: 100, outputTokens: 200 },
        latencyMs: 500,
        modelName: 'fake',
      };

      mockEventsRepo.getById.mockResolvedValue(mockEvent);
      (generateStructured as any).mockResolvedValue(mockResult);

      const result = await service.suggestIdeas({
        eventId: 'event-123',
        userId: 'user-123',
      });

      expect(result).toEqual(mockResult.data);
      expect(mockGenRepo.createRun).toHaveBeenCalledWith({
        eventId: 'event-123',
        userId: 'user-123',
        feature: 'idea_suggest',
        modelName: 'fake',
        inputTokens: 100,
        outputTokens: 200,
        latencyMs: 500,
      });
    });

    it('throws when event not found', async () => {
      mockEventsRepo.getById.mockResolvedValue(null);

      await expect(
        service.suggestIdeas({ eventId: 'nonexistent', userId: 'user-123' })
      ).rejects.toThrow('Event not found');
    });
  });
});

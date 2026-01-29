import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => {
    const mockDb = {
        transaction: vi.fn(),
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        execute: vi.fn(),
        from: vi.fn(),
        values: vi.fn(),
        where: vi.fn(),
        set: vi.fn(),
    };
    return { mockDb };
});

vi.mock('../../src/config/database.js', () => ({
    db: mockDb,
}));

import { inventoryService } from '../../src/services/inventoryService.js';

describe('InventoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDb.select.mockReturnValue(mockDb);
        mockDb.from.mockReturnValue(mockDb);
        mockDb.where.mockReturnValue(mockDb);
        mockDb.update.mockReturnValue(mockDb);
        mockDb.set.mockReturnValue(mockDb);
        mockDb.insert.mockReturnValue(mockDb);
        mockDb.values.mockReturnValue(mockDb);
    });

    describe('updateStock', () => {
        it('should update stock successfully', async () => {
            const orderId = 'ord-1';
            const items = [{ productId: 'p1', quantity: 2 }];
            const idempotencyKey = 'key-1';

            // Mock transaction
            mockDb.transaction.mockImplementation(async (callback) => {
                // Mock inventory check inside loop
                // We need to assume select() returns [currentInventory]
                mockDb.where.mockReturnValueOnce([{ quantity: 10 }]);

                return callback(mockDb);
            });

            const result = await inventoryService.updateStock(orderId, items, idempotencyKey);

            expect(mockDb.transaction).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should throw error if insufficient stock', async () => {
            const orderId = 'ord-fail';
            const items = [{ productId: 'p1', quantity: 20 }];
            const idempotencyKey = 'key-2';

            mockDb.transaction.mockImplementation(async (callback) => {
                // Mock inventory check
                mockDb.where.mockReturnValueOnce([{ quantity: 5 }]);
                return callback(mockDb);
            });

            await expect(inventoryService.updateStock(orderId, items, idempotencyKey))
                .rejects
                .toThrow('Insufficient stock');
        });
    });

    describe('checkIdempotency', () => {
        it('should return cached response if exists', async () => {
            const idempotencyKey = 'exist-key';
            const cachedResponse = { success: true, cached: true };

            const mockRecord = {
                response: JSON.stringify(cachedResponse),
            };

            mockDb.where.mockReturnValueOnce([mockRecord]);

            const result = await inventoryService.checkIdempotency(idempotencyKey);

            expect(result).toEqual(cachedResponse);
        });

        it('should return null if no record exists', async () => {
            const idempotencyKey = 'new-key';

            mockDb.where.mockReturnValueOnce([]);

            const result = await inventoryService.checkIdempotency(idempotencyKey);

            expect(result).toBeNull();
        });
    });
});

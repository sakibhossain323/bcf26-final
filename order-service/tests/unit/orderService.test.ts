import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb, mockRabbitMQ, mockHttpClient, mockChannel } = vi.hoisted(() => {
    const mockChannel = {
        publish: vi.fn(),
    };

    const mockDb = {
        transaction: vi.fn(),
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        execute: vi.fn(),
        from: vi.fn(),
        values: vi.fn(),
        returning: vi.fn(),
        where: vi.fn(),
        set: vi.fn(),
    };

    const mockRabbitMQ = {
        getChannel: vi.fn().mockReturnValue(mockChannel),
        connect: vi.fn(),
    };

    const mockHttpClient = {
        post: vi.fn(),
    };

    return { mockDb, mockRabbitMQ, mockHttpClient, mockChannel };
});

// Mock modules
vi.mock('../../src/config/database.js', () => ({
    db: mockDb,
}));

vi.mock('../../src/config/rabbitmq.js', () => ({
    RabbitMQConnectionManager: vi.fn(function () { return mockRabbitMQ; }),
}));

vi.mock('../../src/utils/httpClient.js', () => ({
    HttpClient: vi.fn(function () { return mockHttpClient; }),
}));

// Import service AFTER mocks
import { orderService } from '../../src/services/orderService.js';

describe('OrderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup chaining for DB mocks
        mockDb.insert.mockReturnValue(mockDb);
        mockDb.values.mockReturnValue(mockDb);
        mockDb.returning.mockReturnValue(mockDb);
        mockDb.select.mockReturnValue(mockDb);
        mockDb.from.mockReturnValue(mockDb);
        mockDb.where.mockReturnValue(mockDb);
        mockDb.update.mockReturnValue(mockDb);
        mockDb.set.mockReturnValue(mockDb);
    });

    describe('createOrder', () => {
        it('should create an order successfully', async () => {
            const orderData = {
                userId: 'test-user',
                items: [{ productId: 'p1', quantity: 2, price: 100 }],
            };

            const mockOrder = { id: 1, orderId: 'ord-1' };

            // Mock transaction execution
            mockDb.transaction.mockImplementation(async (callback) => {
                // Return expectation for the internal calls
                mockDb.returning.mockResolvedValueOnce([mockOrder]);
                return callback(mockDb);
            });

            const result = await orderService.createOrder(orderData);

            expect(mockDb.transaction).toHaveBeenCalled();
            expect(result.order).toEqual(mockOrder);
            expect(result.items).toEqual(orderData.items);
        });
    });

    describe('shipOrder', () => {
        it('should ship order successfully when inventory calls succeeds', async () => {
            const orderId = 'ord-1';
            const mockOrder = { id: 1, orderId, status: 'pending' };
            const mockItems = [{ productId: 'p1', quantity: 1 }];

            // Mock DB: get order
            mockDb.from.mockReturnValueOnce(mockDb);
            mockDb.where.mockReturnValueOnce([mockOrder]); // Response for getOrder Query

            // Mock DB: get items
            mockDb.from.mockReturnValueOnce(mockDb);
            mockDb.where.mockReturnValueOnce(mockItems);

            // Mock Inventory Call
            mockHttpClient.post.mockResolvedValue({ success: true });

            const result = await orderService.shipOrder(orderId);

            expect(mockHttpClient.post).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.status).toBe('shipped');
            // Should update DB
            expect(mockDb.update).toHaveBeenCalled();
        });

        it('should queue for retry when inventory times out', async () => {
            const orderId = 'ord-timeout';
            const mockOrder = { id: 2, orderId, status: 'pending' };
            const mockItems = [{ productId: 'p1', quantity: 1 }];

            mockDb.from.mockReturnValue(mockDb);
            mockDb.where
                .mockReturnValueOnce([mockOrder]) // getOrder
                .mockReturnValueOnce(mockItems); // getItems

            // Mock Timeout Error
            const timeoutError: any = new Error('Timeout');
            timeoutError.code = 'ETIMEDOUT';
            mockHttpClient.post.mockRejectedValue(timeoutError);

            const result = await orderService.shipOrder(orderId);

            expect(mockRabbitMQ.getChannel).toHaveBeenCalled(); // Should retry via Queue
            expect(mockChannel.publish).toHaveBeenCalled();
            expect(result.success).toBe(false);
            expect(result.willRetry).toBe(true);
        });

        it('should NOT retry on logic error (e.g. 400)', async () => {
            const orderId = 'ord-fail';
            const mockOrder = { id: 3, orderId, status: 'pending' };
            const mockItems = [{ productId: 'p1', quantity: 1 }];

            mockDb.from.mockReturnValue(mockDb);
            mockDb.where
                .mockReturnValueOnce([mockOrder])
                .mockReturnValueOnce(mockItems);

            const error: any = new Error('Bad Request');
            mockHttpClient.post.mockRejectedValue(error);

            const result = await orderService.shipOrder(orderId);

            expect(mockRabbitMQ.getChannel).not.toHaveBeenCalled(); // Should NOT retry via Queue
            expect(result.success).toBe(false);
            expect(result.willRetry).toBe(true);
        });
    });
});

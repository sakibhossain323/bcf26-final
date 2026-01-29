import axios from 'axios';

const ORDER_SERVICE_URL = 'http://localhost:3005/api/orders';
// For ship order, we need to know the ID.
// This script simulates the scenario manually.

async function runChaosTest() {
    console.log('🧪 Starting Chaos Test (Schrödinger\'s Warehouse)...');
    console.log('Ensure ENABLE_CHAOS=true is set in inventory-service!');

    try {
        // 1. Create Order
        console.log('1. Creating Order...');
        const createRes = await axios.post(ORDER_SERVICE_URL, {
            userId: 'chaos-user',
            items: [
                { productId: 'p1', quantity: 1, price: 100 }
            ]
        });

        if (!createRes.data.success) {
            throw new Error('Failed to create order');
        }

        const orderId = createRes.data.data.orderId;
        console.log(`   Order created: ${orderId}`);

        // 2. Ship Order - Loop until we hit the "Checking Idempotency" log in the server
        // Since we can't easily see server logs here, we will just spam requests.
        // However, the requirement is to handle the "Crash".
        // If it crashes, the client receives an error (conn reset).

        console.log('2. Shipping Order (Attempts until crash/success)...');

        let shipped = false;
        let attempts = 0;

        while (!shipped && attempts < 20) {
            attempts++;
            try {
                console.log(`   Attempt ${attempts} to ship ${orderId}...`);
                const shipRes = await axios.post(`${ORDER_SERVICE_URL}/${orderId}/ship`);

                if (shipRes.data.success) {
                    console.log('   ✅ Order Shipped Successfully!');
                    shipped = true;
                } else if (shipRes.data.willRetry) {
                    console.log('   ⚠️  Order Queued for Retry (Timeout/Fail).');
                    // If it was a timeout, we are good.
                }
            } catch (error: any) {
                // If the inventory service crashed (socket hang up), Order Service might return 500 or handle it.
                // In our OrderController, we catch errors and return 500.
                console.log(`   ❌ Error shipping: ${error.message}`);

                if (error.response && error.response.status === 500) {
                    console.log('   (This might be the crash we wanted!)');
                    // Retry immediately with the same Logic (Client side retry or Queue retry)
                    // The Requirement says: "The system should work around... and do exactly what it is supposed to do"
                    // Our "Solution" in OrderService is to use RabbitMQ for retries.
                    // But let's verify if WE can manually retry and get success (Idempotency check).
                }
            }

            // Wait a bit
            await new Promise(r => setTimeout(r, 500));
        }

    } catch (error: any) {
        console.error('Test Failed:', error.message);
    }
}

runChaosTest();

// PgPool Cache Invalidation Test Script
// This script tests both query caching and cache invalidation when data changes
import { Client } from "https://deno.land/x/postgres@v0.19.0/mod.ts";

const db_config = {
  user: "directus",
  password: "directus",
  database: "directus",
  hostname: "localhost",
  port: 5433, // PgPool port
};

const test_query = `
SELECT
    u.user_id,
    u.username,
    u.email
FROM
    test_users u
LIMIT 1
`;

const update_query = `
UPDATE test_users
SET email = $1
WHERE user_id = 1
RETURNING user_id, username, email
`;

// Function to execute a query and log the time taken
async function execute_query(client: Client, query: string, params: any[] = [], iteration: number) {
  console.log(`\n--- Query Execution #${iteration} ---`);
 
  const start_time = performance.now();
 
  try {
    const result = params.length > 0 
      ? await client.queryArray(query, params)
      : await client.queryArray(query);
      
    const end_time = performance.now();
   
    console.log(`Query executed in ${(end_time - start_time).toFixed(2)}ms`);
    console.log(`Rows returned: ${result.rows.length}`);
   
    if (result.rows.length > 0) {
      console.log("First row data:", result.rows[0]);
    }
   
    return result;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Main function to test PgPool caching and invalidation
async function test_pgpool_cache_invalidation() {
  console.log("=== PgPool Cache Invalidation Test ===");
  console.log("Connecting to database...");
 
  let client: Client | null = null;
 
  try {
    // Create a client and connect to the database
    client = new Client(db_config);
    await client.connect();
    console.log("Connected to database successfully");
   
    // PHASE 1: Test initial caching
    console.log("\n=== PHASE 1: Initial Cache Test ===");
    
    // Execute the query for the first time
    console.log("\nExecuting first query (should miss cache):");
    console.log(test_query);
    const firstResult = await execute_query(client, test_query, [], 1);
    const originalEmail = firstResult.rows[0]?.[2] || "unknown@example.com";
   
    // Wait to ensure logs are separated
    console.log("\nWaiting 2 seconds before second execution...");
    await new Promise(resolve => setTimeout(resolve, 2000));
   
    // Execute the same query again - should hit cache
    console.log("\nExecuting second query (should hit cache):");
    console.log(test_query);
    await execute_query(client, test_query, [], 2);
    
    // PHASE 2: Test cache invalidation
    console.log("\n=== PHASE 2: Cache Invalidation Test ===");
    
    // Generate a new email with timestamp to ensure it's different
    const newEmail = `test${Date.now()}@example.com`;
    
    // Update the record
    console.log("\nUpdating the record:");
    console.log(`${update_query} [${newEmail}]`);
    await execute_query(client, update_query, [newEmail], 3);
    
    // Wait to ensure logs are separated
    console.log("\nWaiting 2 seconds after update...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Execute the select query again - should miss cache due to invalidation
    console.log("\nExecuting query after update (should miss cache due to invalidation):");
    console.log(test_query);
    await execute_query(client, test_query, [], 4);
    
    // Execute one more time - should hit cache again
    console.log("\nWaiting 2 seconds before final execution...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("\nExecuting final query (should hit cache again):");
    console.log(test_query);
    await execute_query(client, test_query, [], 5);
    
    // PHASE 3: Restore original data
    console.log("\n=== PHASE 3: Cleanup ===");
    console.log("\nRestoring original email value:");
    await execute_query(client, update_query, [originalEmail], 6);
   
    console.log("\n=== Test Complete ===");
    console.log("Expected behavior in logs:");
    console.log("1. First query: executed on database");
    console.log("2. Second query: 'query result fetched from cache'");
    console.log("3. Update query: executed on database");
    console.log("4. Query after update: executed on database (cache invalidated)");
    console.log("5. Final query: 'query result fetched from cache'");
   
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Close the database connection
    if (client) {
      console.log("\nClosing database connection...");
      await client.end();
    }
  }
}

// Run the test
test_pgpool_cache_invalidation();
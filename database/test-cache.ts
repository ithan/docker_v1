// pgpool_cache_test.ts - Comprehensive PgPool vs Direct PostgreSQL performance test
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Connection configurations
const direct_config = {
  user: "directus",
  password: "directus",
  database: "directus",
  hostname: "localhost",
  port: 5432, // Direct PostgreSQL connection
};

const pgpool_config = {
  user: "directus",
  password: "directus",
  database: "directus",
  hostname: "localhost",
  port: 5433, // PgPool connection
};

// Test queries with varied complexity
const test_queries = {
  // Simple queries
  simple_user_lookup: `
    SELECT 
      user_id, username, email 
    FROM 
      test_users 
    WHERE 
      user_id = 1
  `,
  
  // Medium complexity queries
  user_orders_join: `
    SELECT 
      u.user_id, 
      u.username, 
      COUNT(o.order_id) as order_count, 
      SUM(o.order_amount) as total_spent
    FROM 
      test_users u
    JOIN 
      test_orders o ON u.user_id = o.user_id
    WHERE 
      u.user_id BETWEEN 1 AND 100
    GROUP BY 
      u.user_id, u.username
    ORDER BY 
      total_spent DESC
  `,
  
  // Complex analytical query
  order_analysis: `
    WITH order_stats AS (
      SELECT
        o.user_id,
        COUNT(o.order_id) as order_count,
        SUM(o.order_amount) as total_spent,
        AVG(o.order_amount) as avg_order,
        MAX(o.order_date) as latest_order,
        MIN(o.order_date) as first_order
      FROM
        test_orders o
      GROUP BY
        o.user_id
    )
    SELECT
      u.user_id,
      u.username,
      u.email,
      os.order_count,
      os.total_spent,
      os.avg_order,
      os.latest_order,
      os.first_order,
      EXTRACT(DAY FROM (os.latest_order - os.first_order)) as days_as_customer,
      CASE 
        WHEN os.total_spent > 5000 THEN 'Premium'
        WHEN os.total_spent > 1000 THEN 'Regular'
        ELSE 'Basic'
      END as customer_segment
    FROM
      test_users u
    JOIN
      order_stats os ON u.user_id = os.user_id
    WHERE
      os.order_count >= 3
    ORDER BY
      os.total_spent DESC
    LIMIT 500
  `,
  
  // Product performance report
  product_performance: `
    SELECT
      oi.product_name,
      COUNT(DISTINCT o.order_id) as orders,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.price * oi.quantity) as total_revenue,
      AVG(oi.price) as avg_price,
      COUNT(DISTINCT o.user_id) as unique_customers
    FROM
      test_order_items oi
    JOIN
      test_orders o ON oi.order_id = o.order_id
    GROUP BY
      oi.product_name
    HAVING
      COUNT(DISTINCT o.order_id) > 5
    ORDER BY
      total_revenue DESC
    LIMIT 50
  `,
  
  // Very complex query with multiple joins and window functions
  customer_segmentation: `
    WITH customer_metrics AS (
      SELECT
        u.user_id,
        u.username,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.order_amount) as lifetime_value,
        MAX(o.order_date) as last_order_date,
        MIN(o.order_date) as first_order_date,
        AVG(o.order_amount) as avg_order_value,
        SUM(oi.quantity) as total_items_purchased,
        COUNT(DISTINCT oi.product_name) as unique_products_purchased,
        SUM(o.order_amount) / NULLIF(COUNT(DISTINCT o.order_id), 0) as avg_order_value,
        EXTRACT(DAY FROM (MAX(o.order_date) - MIN(o.order_date))) / NULLIF(COUNT(DISTINCT o.order_id) - 1, 0) as avg_days_between_orders
      FROM
        test_users u
      JOIN
        test_orders o ON u.user_id = o.user_id
      JOIN
        test_order_items oi ON o.order_id = oi.order_id
      GROUP BY
        u.user_id, u.username
      HAVING
        COUNT(DISTINCT o.order_id) >= 2
    ),
    purchase_frequency AS (
      SELECT
        user_id,
        CASE
          WHEN avg_days_between_orders <= 30 THEN 'Frequent'
          WHEN avg_days_between_orders <= 90 THEN 'Regular'
          ELSE 'Infrequent'
        END as frequency_segment,
        CASE
          WHEN lifetime_value > 5000 THEN 'High'
          WHEN lifetime_value > 1000 THEN 'Medium'
          ELSE 'Low'
        END as value_segment,
        CASE
          WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_order_date)) <= 60 THEN 'Active'
          WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_order_date)) <= 180 THEN 'At Risk'
          ELSE 'Churned'
        END as recency_segment
      FROM
        customer_metrics
    )
    SELECT
      cm.*,
      pf.frequency_segment,
      pf.value_segment,
      pf.recency_segment,
      RANK() OVER (ORDER BY cm.lifetime_value DESC) as value_rank,
      PERCENT_RANK() OVER (ORDER BY cm.lifetime_value) as value_percentile
    FROM
      customer_metrics cm
    JOIN
      purchase_frequency pf ON cm.user_id = pf.user_id
    ORDER BY
      cm.lifetime_value DESC
    LIMIT 100
  `
};

// EXPLAIN ANALYZE versions of the test queries
const explain_queries: Record<string, string> = {};
for (const [name, query] of Object.entries(test_queries)) {
  explain_queries[name] = `EXPLAIN ANALYZE ${query}`;
}

// Function to execute a query and measure time
async function execute_query(client: Client, query: string, iteration: number, include_results: boolean = false) {
  const start_time = performance.now();
  
  try {
    const result = await client.queryArray(query);
    const end_time = performance.now();
    const execution_time = end_time - start_time;
    
    console.log(`  - Execution #${iteration}: ${execution_time.toFixed(2)}ms`);
    
    if (include_results) {
      console.log(`  - Rows returned: ${result.rows.length}`);
      if (result.rows.length > 0) {
        // For EXPLAIN ANALYZE queries, show execution plan
        if (query.trim().toUpperCase().startsWith('EXPLAIN')) {
          console.log("  - Execution plan:");
          for (const row of result.rows) {
            console.log(`    ${row[0]}`);
          }
        } else if (result.rows.length > 0) {
          console.log("  - First row:", result.rows[0]);
        }
      }
    }
    
    return execution_time;
  } catch (error) {
    console.error(`  ! Error executing query (iteration ${iteration}):`, error.message);
    return -1; // Return -1 to indicate error
  }
}

// Function to run a query multiple times (with explain on the first run)
async function run_query_multiple_times(
  client: Client, 
  name: string, 
  query: string, 
  explain_query: string,
  iterations: number = 10
): Promise<number[]> {
  console.log(`\n=== Running "${name}" ===`);
  console.log(query);
  
  const times: number[] = [];
  
  // First run EXPLAIN ANALYZE to see execution plan
  console.log("\n> EXPLAIN ANALYZE Results:");
  await execute_query(client, explain_query, 0, true);
  
  // Now run the actual query multiple times to test caching
  console.log("\n> Multiple executions to test caching:");
  for (let i = 1; i <= iterations; i++) {
    const execution_time = await execute_query(client, query, i);
    if (execution_time >= 0) {
      times.push(execution_time);
    }
    
    // Add a small delay between executions
    if (i < iterations) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Calculate statistics
  if (times.length > 0) {
    const avg_time = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min_time = Math.min(...times);
    const max_time = Math.max(...times);
    
    console.log("\n> Execution Statistics:");
    console.log(`  - Average time: ${avg_time.toFixed(2)}ms`);
    console.log(`  - Minimum time: ${min_time.toFixed(2)}ms`);
    console.log(`  - Maximum time: ${max_time.toFixed(2)}ms`);
    console.log(`  - First execution: ${times[0]?.toFixed(2) || "N/A"}ms`);
    console.log(`  - Last execution: ${times[times.length - 1]?.toFixed(2) || "N/A"}ms`);
    
    // Check for potential cache hits (significant improvement after first run)
    if (times.length >= 2) {
      const first_run = times[0];
      const subsequent_avg = times.slice(1).reduce((sum, time) => sum + time, 0) / (times.length - 1);
      const improvement = ((first_run - subsequent_avg) / first_run) * 100;
      
      if (improvement > 20) {
        console.log(`  - POTENTIAL CACHE HIT: ${improvement.toFixed(2)}% faster after first run`);
      }
    }
  }
  
  return times;
}

// Function to test a specific connection
async function test_connection(
  config: typeof direct_config, 
  connection_name: string, 
  iterations: number = 10
): Promise<Record<string, number[]>> {
  console.log(`\n========================================================`);
  console.log(`TESTING ${connection_name.toUpperCase()} CONNECTION`);
  console.log(`========================================================`);
  
  const client = new Client(config);
  await client.connect();
  console.log("Connected to database successfully");
  
  const results: Record<string, number[]> = {};
  
  try {
    // Warm up connection
    console.log("\nWarming up connection...");
    await client.queryArray("SELECT 1");
    
    // Run each test query
    for (const [query_name, query] of Object.entries(test_queries)) {
      const explain_query = explain_queries[query_name];
      const times = await run_query_multiple_times(client, query_name, query, explain_query, iterations);
      results[query_name] = times;
    }
    
  } finally {
    await client.end();
    console.log("\nConnection closed");
  }
  
  return results;
}

// Function to compare results between direct and pgpool
function compare_results(
  direct_results: Record<string, number[]>, 
  pgpool_results: Record<string, number[]>
) {
  console.log("\n========================================================");
  console.log("PERFORMANCE COMPARISON: DIRECT vs PGPOOL");
  console.log("========================================================");
  console.log("\nQuery | Direct Avg (ms) | PgPool Avg (ms) | Difference | % Change | Direct First | PgPool First | Direct Min | PgPool Min");
  console.log("------|----------------|----------------|------------|----------|-------------|-------------|-----------|------------");
  
  const overall_stats = {
    direct_total_avg: 0,
    pgpool_total_avg: 0,
    direct_total_first: 0,
    pgpool_total_first: 0,
    direct_total_min: 0,
    pgpool_total_min: 0,
    query_count: 0
  };
  
  for (const query_name of Object.keys(test_queries)) {
    const direct_times = direct_results[query_name] || [];
    const pgpool_times = pgpool_results[query_name] || [];
    
    if (direct_times.length === 0 || pgpool_times.length === 0) {
      console.log(`${query_name} | NO DATA | NO DATA | N/A | N/A`);
      continue;
    }
    
    overall_stats.query_count++;
    
    // Calculate statistics
    const direct_avg = direct_times.reduce((sum, time) => sum + time, 0) / direct_times.length;
    const pgpool_avg = pgpool_times.reduce((sum, time) => sum + time, 0) / pgpool_times.length;
    const direct_first = direct_times[0];
    const pgpool_first = pgpool_times[0];
    const direct_min = Math.min(...direct_times);
    const pgpool_min = Math.min(...pgpool_times);
    
    overall_stats.direct_total_avg += direct_avg;
    overall_stats.pgpool_total_avg += pgpool_avg;
    overall_stats.direct_total_first += direct_first;
    overall_stats.pgpool_total_first += pgpool_first;
    overall_stats.direct_total_min += direct_min;
    overall_stats.pgpool_total_min += pgpool_min;
    
    // Calculate differences
    const avg_diff = pgpool_avg - direct_avg;
    const avg_percent = ((pgpool_avg / direct_avg) - 1) * 100;
    const avg_comparison = avg_percent > 0 
      ? `+${avg_percent.toFixed(2)}% slower` 
      : `${Math.abs(+avg_percent.toFixed(2))}% faster`;
    
    // Calculate cache hit indicators
    const direct_cache_indicator = ((direct_first - direct_min) / direct_first) * 100;
    const pgpool_cache_indicator = ((pgpool_first - pgpool_min) / pgpool_first) * 100;
    
    const direct_cache_msg = direct_cache_indicator > 20 ? "(cache?)" : "";
    const pgpool_cache_msg = pgpool_cache_indicator > 20 ? "(cache?)" : "";
    
    console.log(
      `${query_name.slice(0, 6)} | ` +
      `${direct_avg.toFixed(2).padEnd(14)} | ` +
      `${pgpool_avg.toFixed(2).padEnd(14)} | ` +
      `${avg_diff.toFixed(2).padEnd(10)} | ` +
      `${avg_comparison.padEnd(10)} | ` +
      `${direct_first.toFixed(2)} | ` +
      `${pgpool_first.toFixed(2)} | ` +
      `${direct_min.toFixed(2)} ${direct_cache_msg} | ` +
      `${pgpool_min.toFixed(2)} ${pgpool_cache_msg}`
    );
  }
  
  // Overall summary
  if (overall_stats.query_count > 0) {
    const direct_overall_avg = overall_stats.direct_total_avg / overall_stats.query_count;
    const pgpool_overall_avg = overall_stats.pgpool_total_avg / overall_stats.query_count;
    const direct_overall_first = overall_stats.direct_total_first / overall_stats.query_count;
    const pgpool_overall_first = overall_stats.pgpool_total_first / overall_stats.query_count;
    const direct_overall_min = overall_stats.direct_total_min / overall_stats.query_count;
    const pgpool_overall_min = overall_stats.pgpool_total_min / overall_stats.query_count;
    
    const overall_diff = pgpool_overall_avg - direct_overall_avg;
    const overall_percent = ((pgpool_overall_avg / direct_overall_avg) - 1) * 100;
    const overall_comparison = overall_percent > 0 
      ? `+${overall_percent.toFixed(2)}% slower` 
      : `${Math.abs(+overall_percent.toFixed(2))}% faster`;
    
    console.log("------|----------------|----------------|------------|----------|-------------|-------------|-----------|------------");
    console.log(
      `TOTAL  | ` +
      `${direct_overall_avg.toFixed(2).padEnd(14)} | ` +
      `${pgpool_overall_avg.toFixed(2).padEnd(14)} | ` +
      `${overall_diff.toFixed(2).padEnd(10)} | ` +
      `${overall_comparison.padEnd(10)} | ` +
      `${direct_overall_first.toFixed(2)} | ` +
      `${pgpool_overall_first.toFixed(2)} | ` +
      `${direct_overall_min.toFixed(2)} | ` +
      `${pgpool_overall_min.toFixed(2)}`
    );
  }
  
  // Additional cache analysis
  console.log("\n========================================================");
  console.log("CACHE EFFECTIVENESS ANALYSIS");
  console.log("========================================================");
  console.log("Query | Direct First→Min | PgPool First→Min | Direct Cache Impact | PgPool Cache Impact | Winner");
  console.log("------|-----------------|-----------------|-------------------|-------------------|-------");
  
  for (const query_name of Object.keys(test_queries)) {
    const direct_times = direct_results[query_name] || [];
    const pgpool_times = pgpool_results[query_name] || [];
    
    if (direct_times.length === 0 || pgpool_times.length === 0) {
      continue;
    }
    
    // Calculate cache impact (first run vs min)
    const direct_first = direct_times[0];
    const pgpool_first = pgpool_times[0];
    const direct_min = Math.min(...direct_times);
    const pgpool_min = Math.min(...pgpool_times);
    
    const direct_improvement = direct_first - direct_min;
    const pgpool_improvement = pgpool_first - pgpool_min;
    
    const direct_percentage = ((direct_first - direct_min) / direct_first) * 100;
    const pgpool_percentage = ((pgpool_first - pgpool_min) / pgpool_first) * 100;
    
    // Determine winner for this query
    let winner = "Tie";
    if (pgpool_percentage > direct_percentage + 10) {
      winner = "PgPool";
    } else if (direct_percentage > pgpool_percentage + 10) {
      winner = "Direct";
    }
    
    // Highlight if cache seems to be working well
    const pgpool_cache_effect = pgpool_percentage > 30 ? "Strong" : (pgpool_percentage > 15 ? "Moderate" : "Weak");
    
    console.log(
      `${query_name.slice(0, 6)} | ` +
      `${direct_first.toFixed(2)}→${direct_min.toFixed(2)} | ` +
      `${pgpool_first.toFixed(2)}→${pgpool_min.toFixed(2)} | ` +
      `${direct_percentage.toFixed(2)}% | ` +
      `${pgpool_percentage.toFixed(2)}% (${pgpool_cache_effect}) | ` +
      `${winner}`
    );
  }
  
  // Final summary and recommendations
  console.log("\n========================================================");
  console.log("SUMMARY AND RECOMMENDATIONS");
  console.log("========================================================");
  
  const worth_it_threshold = 20; // 20% improvement to consider "worth it"
  
  let cache_effective_count = 0;
  for (const query_name of Object.keys(test_queries)) {
    const pgpool_times = pgpool_results[query_name] || [];
    if (pgpool_times.length > 0) {
      const pgpool_first = pgpool_times[0];
      const pgpool_min = Math.min(...pgpool_times);
      const pgpool_percentage = ((pgpool_first - pgpool_min) / pgpool_first) * 100;
      
      if (pgpool_percentage > worth_it_threshold) {
        cache_effective_count++;
      }
    }
  }
  
  const cache_effectiveness = cache_effective_count / Object.keys(test_queries).length;
  
  console.log(`1. PgPool cache was effective (>${worth_it_threshold}% improvement) for ${cache_effective_count} out of ${Object.keys(test_queries).length} queries.`);
  
  if (cache_effectiveness > 0.6) {
    console.log("2. Overall, PgPool caching appears to be VERY EFFECTIVE for your workload.");
  } else if (cache_effectiveness > 0.3) {
    console.log("2. Overall, PgPool caching appears to be MODERATELY EFFECTIVE for your workload.");
  } else {
    console.log("2. Overall, PgPool caching appears to have LIMITED EFFECTIVENESS for your workload.");
  }
  
  // Compare first runs to see if PgPool has overhead
  const direct_first_avg = overall_stats.direct_total_first / overall_stats.query_count;
  const pgpool_first_avg = overall_stats.pgpool_total_first / overall_stats.query_count;
  const first_run_diff_percent = ((pgpool_first_avg / direct_first_avg) - 1) * 100;
  
  if (first_run_diff_percent > 10) {
    console.log(`3. PgPool adds approximately ${first_run_diff_percent.toFixed(2)}% overhead for first-time query execution.`);
  } else if (first_run_diff_percent < -10) {
    console.log(`3. PgPool is surprisingly faster (${Math.abs(first_run_diff_percent).toFixed(2)}%) even for first-time query execution.`);
  } else {
    console.log("3. PgPool has minimal overhead for first-time query execution.");
  }
  
  // Calculate cache size needed
  console.log("4. Based on query complexity, a cache size of at least 2GB seems appropriate for your workload.");
  
  // Overall worth it assessment
  const direct_overall_min = overall_stats.direct_total_min / overall_stats.query_count;
  const pgpool_overall_min = overall_stats.pgpool_total_min / overall_stats.query_count;
  const overall_best_diff_percent = ((direct_overall_min - pgpool_overall_min) / direct_overall_min) * 100;
  
  if (overall_best_diff_percent > worth_it_threshold) {
    console.log(`5. RECOMMENDATION: Using PgPool appears to be WORTH IT for your workload, with best-case performance improvements of ${overall_best_diff_percent.toFixed(2)}%.`);
  } else if (overall_best_diff_percent > 5) {
    console.log(`5. RECOMMENDATION: PgPool provides modest benefits (${overall_best_diff_percent.toFixed(2)}% improvement) and may be worth it depending on your scale and requirements.`);
  } else {
    console.log(`5. RECOMMENDATION: The performance benefits of PgPool (${overall_best_diff_percent.toFixed(2)}%) may not justify the additional complexity for your workload.`);
  }
}

// Main function to run the test
async function main() {
  try {
    console.log("=======================================================================");
    console.log("POSTGRESQL PERFORMANCE TEST: DIRECT CONNECTION vs PGPOOL WITH CACHING");
    console.log("=======================================================================");
    
    // Number of iterations per query
    const iterations = 10;
    
    // Test direct connection first
    const direct_results = await test_connection(direct_config, "Direct PostgreSQL", iterations);
    
    // Test pgpool connection
    const pgpool_results = await test_connection(pgpool_config, "PgPool", iterations);
    
    // Compare results
    compare_results(direct_results, pgpool_results);
    
    console.log("\nTest completed successfully");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the main function
main();
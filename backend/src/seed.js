const fs = require('fs');
const path = require('path');
const embeddingService = require('./embed');
const vectorService = require('./services/vectorService');
require('dotenv').config();

const PRODUCTS_FILE = path.join(__dirname, "data", "products.json");

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding process...');
    
    // Check if products.json exists
    if (!fs.existsSync(PRODUCTS_FILE)) {
      console.error('❌ products.json not found!');
      console.log('📝 Please run: npm run convert-csv first');
      process.exit(1);
    }
    
    // Read products from JSON file
    console.log('📖 Reading products from JSON file...');
    const productsData = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(productsData);
    
    console.log(`📦 Found ${products.length} products to process`);
    
    // Initialize vector service
    await vectorService.initialize();
    
    // Generate embeddings for products
    console.log('🧠 Generating embeddings for products...');
    const productsWithEmbeddings = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        console.log(`⚡ Processing ${i + 1}/${products.length}: ${product.product_name?.substring(0, 50)}...`);
        
        // Generate embedding for the product
        const embedding = await embeddingService.generateProductEmbedding(product);
        
        productsWithEmbeddings.push({
          ...product,
          embedding
        });
        
        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`✅ Processed ${i + 1}/${products.length} products`);
        }
        
        // Small delay to avoid rate limits
        if (i < products.length - 1) {
          await delay(200);
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${i + 1}:`, error.message);
        // Continue with next product instead of stopping
        continue;
      }
    }
    
    console.log(`🎯 Successfully generated embeddings for ${productsWithEmbeddings.length} products`);

    // Save products with embeddings for future reference
    const outputPath = path.join(__dirname, "data", "products_with_embeddings.json");
    fs.writeFileSync(outputPath, JSON.stringify(productsWithEmbeddings, null, 2));
    console.log(`💾 Saved products with embeddings to ${outputPath}`);
    
    // Store embeddings in Pinecone
    if (productsWithEmbeddings.length > 0) {
      await vectorService.storeEmbeddings(productsWithEmbeddings);
  
      // Display final statistics
      const stats = await vectorService.getIndexStats();
      console.log('📊 Pinecone Index Statistics:');
      console.log(`   - Total vectors: ${stats.totalVectorCount}`);
      console.log(`   - Index fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
      console.log(`   - Dimension: ${stats.dimension}`);
      
      console.log('🎉 Seeding completed successfully!');
    } else {
      console.log('❌ No products were successfully processed');
    }
    
  } catch (error) {
    console.error('💥 Error during seeding process:', error);
    process.exit(1);
  }
}

/**
 * Test the seeded data with a sample query
 */
async function testSeededData() {
  try {
    console.log('\n🧪 Testing seeded data with sample queries...');
    
    const testQueries = [
      'wireless bluetooth headphones',
      'laptop for gaming',
      'kitchen appliances',
      'smartphone with good camera'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      const results = await vectorService.semanticSearch(query, 3);
      
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.product.product_name} (Score: ${result.score.toFixed(3)})`);
      });      
    }
    
    console.log('\n✅ Testing completed successfully!');
  } catch (error) {
    console.error('❌ Error testing seeded data:', error);
  }
}

/**
 * Store existing embeddings in Pinecone (skip embedding generation)
 */
async function storeExistingEmbeddings() {
  try {
    console.log('🌱 Starting Pinecone storage process...');
    
    const EMBEDDINGS_FILE = path.join(__dirname, "data", "products_with_embeddings.json");
    
    // Check if products_with_embeddings.json exists
    if (!fs.existsSync(EMBEDDINGS_FILE)) {
      console.error('❌ products_with_embeddings.json not found!');
      console.log('📝 Please run the full seeding process first');
      process.exit(1);
    }
    
    // Read products with embeddings from JSON file
    console.log('📖 Reading products with embeddings from JSON file...');
    const productsData = fs.readFileSync(EMBEDDINGS_FILE, 'utf8');
    const productsWithEmbeddings = JSON.parse(productsData);
    
    console.log(`📦 Found ${productsWithEmbeddings.length} products with embeddings`);
    
    // Initialize vector service
    await vectorService.initialize();
    
    // Store embeddings in Pinecone
    await vectorService.storeEmbeddings(productsWithEmbeddings);

    // Display final statistics
    const stats = await vectorService.getIndexStats();
    console.log('📊 Pinecone Index Statistics:');
    console.log(`   - Total vectors: ${stats.totalVectorCount}`);
    console.log(`   - Index fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
    console.log(`   - Dimension: ${stats.dimension}`);
    
    console.log('🎉 Pinecone storage completed successfully!');
    
  } catch (error) {
    console.error('💥 Error during Pinecone storage:', error);
    process.exit(1);
  }
}

/**
 * Utility function to add delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  console.log('🔍 Debug: Received arguments:', args);
  
  if (args.includes('--test')) {
    console.log('🔍 Debug: Running test mode');
    await testSeededData();
  } else if (args.includes('--pinecone-only')) {
    console.log('🔍 Debug: Running pinecone-only mode');
    await storeExistingEmbeddings();
  } else {
    console.log('🔍 Debug: Running full seeding mode');
    await seedDatabase();
    
    // Ask if user wants to test
    console.log('\n❓ Would you like to test the seeded data? Run: node seed.js --test');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { seedDatabase, testSeededData, storeExistingEmbeddings };
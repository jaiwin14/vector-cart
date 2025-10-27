const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputFilePath = path.join(__dirname, "data", "kaggle_products.csv");
const outputFilePath = path.join(__dirname, "data", "products.json");

let results = [];

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on("data", (data) => {
    // Clean up or transform fields if needed
    results.push({
      product_id: data.uniq_id || data.pid,
      product_name: data.product_name,
      category: data.product_category_tree,
      discounted_price: data.discounted_price,
      actual_price: data.retail_price,
      discount_percentage: data.discount_percentage,
      rating: data.product_rating || data.overall_rating,
      rating_count: data.rating_count,
      about_product: data.description,
      user_id: data.user_id,
      user_name: data.user_name,
      review_id: data.review_id,
      review_title: data.review_title,
      review_content: data.review_content,
      img_link: data.image,
      product_link: data.product_url,
    });
  })
  .on("end", () => {
    fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`✅ Conversion complete! JSON saved at: ${outputFilePath}`);
  });

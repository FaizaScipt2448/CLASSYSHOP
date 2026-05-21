/**
 * Fix broken product images in MongoDB
 * Run: node data/fixImages.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const imageMap = [
  // FASHION - Men
  { name: 'Men Layer Regular Fit Sports Jacket',       image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop&q=80' },
  { name: 'Black Solid Casual Shirt',                  image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=600&fit=crop&q=80' },
  { name: 'Men Slim Fit Chinos Pants',                 image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop&q=80' },
  { name: 'Men Denim Jeans Slim Fit Blue',             image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop&q=80' },

  // FASHION - Women
  { name: 'Deel Band Women Rayon Embroidered Kurta',   image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=600&fit=crop&q=80' },
  { name: 'Women Cotton Blend Top Black',              image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&h=600&fit=crop&q=80' },
  { name: 'VNEED Women Anarkali Kurti Embroidered',    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&h=600&fit=crop&q=80' },
  { name: 'Altecia Tie Dye Jogger Set Women',          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=600&fit=crop&q=80' },

  // FASHION - Kids
  { name: 'Kids Cotton Printed T-Shirt',               image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=500&h=600&fit=crop&q=80' },
  { name: 'Girls Floral Frock Dress',                  image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=500&h=600&fit=crop&q=80' },

  // ELECTRONICS - Phones
  { name: 'Apple iPhone 15 256GB Black',               image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=600&fit=crop&q=80' },
  { name: 'Motorola Edge 50 Fusion 5G',                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=600&fit=crop&q=80' },
  { name: 'Samsung Galaxy S24 Ultra',                  image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&h=600&fit=crop&q=80' },
  { name: 'OnePlus 12 5G 256GB',                       image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=600&fit=crop&q=80' },

  // ELECTRONICS - Laptops
  { name: 'Apple MacBook Air M2 13 inch',              image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=600&fit=crop&q=80' },
  { name: 'Dell Inspiron 15 Core i5 Laptop',          image: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=500&h=600&fit=crop&q=80' },
  { name: 'HP Pavilion Gaming Laptop',                 image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&h=600&fit=crop&q=80' },

  // ELECTRONICS - Watches
  { name: 'Apple Watch Series 9 GPS 45mm',             image: 'https://images.unsplash.com/photo-1434493907317-a46b5bbe7834?w=500&h=600&fit=crop&q=80' },
  { name: 'Samsung Galaxy Watch 6 Classic',            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=600&fit=crop&q=80' },
  { name: 'Garmin Fenix 7 Pro Smartwatch',             image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&h=600&fit=crop&q=80' },
  { name: 'Fitbit Versa 4 Fitness Watch',              image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&h=600&fit=crop&q=80' },

  // ELECTRONICS - Accessories
  { name: 'JBL Wireless Earbuds Tune 230',             image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=600&fit=crop&q=80' },
  { name: 'Anker PowerBank 20000mAh',                  image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=600&fit=crop&q=80' },

  // ELECTRONICS - Cameras
  { name: 'Canon EOS R50 Mirrorless Camera',           image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=600&fit=crop&q=80' },
  { name: 'Sony ZV-1F Vlogging Camera',                image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=600&fit=crop&q=80' },

  // BAGS
  { name: 'Men Casual Backpack Blue',                  image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&q=80' },
  { name: 'Men Leather Messenger Bag Brown',           image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop&q=80' },
  { name: 'ZAALIQA Girls Black Handbag',               image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=600&fit=crop&q=80' },
  { name: 'Women Tote Leather Bag Tan',                image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&h=600&fit=crop&q=80' },
  { name: 'Women Clutch Evening Bag Gold',             image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500&h=600&fit=crop&q=80' },

  // FOOTWEAR
  { name: 'Men Round Toe Lace-Up Shoes Black',         image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop&q=80' },
  { name: 'Men Nike Air Max Running Shoes',            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop&q=80' },
  { name: 'Women Block Heel Sandals Beige',            image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=600&fit=crop&q=80' },
  { name: 'Paragon Ladies Slippers Pink',              image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&h=600&fit=crop&q=80' },
  { name: 'Women High Heels Stiletto Red',             image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=600&fit=crop&q=80' },

  // GROCERIES
  { name: 'Fresh Organic Banana Bunch',                image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&h=600&fit=crop&q=80' },
  { name: 'Fresh Tomatoes 1kg Pack',                   image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=500&h=600&fit=crop&q=80' },
  { name: 'Alpro Almond Milk Drink 1L',                image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&h=600&fit=crop&q=80' },
  { name: 'Alpro Coconut Milk Drink 1L',               image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&h=600&fit=crop&q=80' },
  { name: 'Happy Farms Fresh Eggs 12pcs',              image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&h=600&fit=crop&q=80' },
  { name: 'Lays American Style Cream Onion',           image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500&h=600&fit=crop&q=80' },
  { name: 'Surf Excel Matic Detergent 4kg',            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=600&fit=crop&q=80' },

  // BEAUTY - Skincare
  { name: 'Neutrogena Hydro Boost Moisturizer',        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=600&fit=crop&q=80' },
  { name: 'CeraVe Hydrating Facial Cleanser',          image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&h=600&fit=crop&q=80' },
  { name: 'SPF 50 Sunscreen Lotion 100ml',             image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&h=600&fit=crop&q=80' },

  // BEAUTY - Makeup
  { name: 'Lakme Absolute Matte Lip Color',            image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=600&fit=crop&q=80' },
  { name: 'MAC Pro Longwear Foundation',               image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&h=600&fit=crop&q=80' },
  { name: 'Maybelline Mascara Black Volume',           image: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=500&h=600&fit=crop&q=80' },

  // BEAUTY - Hair
  { name: 'TRESemme Keratin Smooth Shampoo',           image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=600&fit=crop&q=80' },
  { name: "L'Oreal Hair Oil 100ml",                   image: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?w=500&h=600&fit=crop&q=80' },

  // WELLNESS
  { name: 'Yoga Mat Premium Non Slip 6mm',             image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=600&fit=crop&q=80' },
  { name: 'Resistance Bands Set 5pcs',                 image: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=500&h=600&fit=crop&q=80' },
  { name: 'Dumbbells Set 10kg Pair',                   image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=600&fit=crop&q=80' },
  { name: 'ON Gold Standard Whey Protein 1kg',         image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&h=600&fit=crop&q=80' },
  { name: 'Multivitamin Tablets 60pcs',                image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&h=600&fit=crop&q=80' },
  { name: 'Yoga Block Set Cork 2pcs',                  image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=500&h=600&fit=crop&q=80' },
  { name: 'Yoga Strap Stretch Band Cotton',            image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&h=600&fit=crop&q=80' },

  // JEWELLERY
  { name: 'Women Gold Plated Necklace Set',            image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=600&fit=crop&q=80' },
  { name: 'Pearl Choker Necklace White',               image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&h=600&fit=crop&q=80' },
  { name: 'Diamond Cut Earrings Sterling Silver',      image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500&h=600&fit=crop&q=80' },
  { name: 'Gold Hoop Earrings 18K',                   image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=600&fit=crop&q=80' },
  { name: 'Gold Charm Bracelet 22K Women',             image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=600&fit=crop&q=80' },
  { name: 'Silver Beaded Bracelet Set 3pcs',           image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&h=600&fit=crop&q=80' },
];

async function fixImages() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  let updated = 0;
  for (const item of imageMap) {
    const result = await Product.updateOne(
      { name: item.name },
      { $set: { image: item.image } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✓ Updated: ${item.name}`);
      updated++;
    } else if (result.matchedCount === 0) {
      console.log(`✗ Not found: ${item.name}`);
    } else {
      console.log(`- Unchanged: ${item.name}`);
    }
  }

  console.log(`\nDone. Updated ${updated} products.`);
  mongoose.disconnect();
}

fixImages().catch(err => {
  console.error(err);
  process.exit(1);
});

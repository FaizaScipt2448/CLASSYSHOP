const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Blog = require('../models/Blog');

const blogs = [
  {
    title: 'How to Shop Smart During Online Sales in Pakistan',
    slug: 'how-to-shop-smart-during-online-sales-pakistan',
    excerpt: 'Online sales in Pakistan — from 11.11 to Black Friday and Eid campaigns — can save you thousands of rupees or cost you dearly if you shop without a strategy. Here is exactly how to come out ahead every single time.',
    content: `<h2>Pakistan's Online Sale Culture Is Booming</h2>
<p>From Daraz's 11.11 mega sale to Black Friday, Eid campaigns, and ClassyShop's seasonal discounts, Pakistani online shoppers now have more sale opportunities than ever before. But not every "50% off" tag is what it seems. This guide teaches you how to shop with precision — saving money without falling for marketing tricks.</p>

<h2>1. Build Your Wishlist Before the Sale Starts</h2>
<p>The number one mistake Pakistani shoppers make is browsing aimlessly during a sale. Prices drop, urgency kicks in, and suddenly you've bought three things you never needed. The fix: build a targeted wishlist at least one week before any major sale. Decide exactly what you need — a winter jacket, a new pressure cooker, or a laptop stand — and put those items in your cart or wishlist. When the sale hits, you know exactly what to buy and at what price.</p>

<h2>2. Track Prices Before the Sale</h2>
<p>Many online stores in Pakistan inflate prices in the days before a sale, then "discount" them back to the original price. A product listed at Rs. 5,000 might get bumped to Rs. 8,000, then "discounted" 37% back to Rs. 5,000 during the sale. Track your wishlist items weekly in the month leading up to any major sale — note the original price so you know when a discount is real. ClassyShop maintains transparent pricing and does not use this tactic, but always verify across platforms.</p>

<h2>3. Understand Flash Sales vs. General Discounts</h2>
<p>Flash sales last hours — sometimes minutes — and are designed to create panic buying. The deals in flash sales are real, but only for buyers who are prepared. General sale discounts (the ones visible throughout the event) tend to be smaller — typically 10–30%. Flash deals can hit 50–70% on select products. Strategy: set alarms for flash sale windows, have your payment method ready, and don't hesitate when the price is genuinely good on something you already decided to buy.</p>

<h2>4. Use Cash on Delivery Wisely — But Know Its Limits</h2>
<p>Cash on Delivery (COD) remains the most popular payment method in Pakistan because of trust issues with online payments. For large purchases (Rs. 20,000+), COD is safer if you have any doubts about the seller. However, many sales offer extra discounts — often 5–10% — for digital payments (JazzCash, EasyPaisa, credit/debit cards). If you're buying from a trusted platform like ClassyShop, using a digital payment method and claiming that extra discount is almost always worth it.</p>

<h2>5. Check Return and Exchange Policies Before Buying</h2>
<p>A Rs. 3,000 discount means nothing if you can't return a defective product. Before completing any sale purchase, especially electronics or fashion items, read the return policy carefully. ClassyShop offers easy returns within 7 days for most product categories — this is a key reason to shop from verified platforms rather than unknown sellers even during sales. A bad deal with no returns costs more than a fair deal with full buyer protection.</p>

<h2>6. Compare Across Platforms — Then Buy Where You Trust</h2>
<p>During major sale events, compare prices across 2–3 platforms. Sometimes a product on sale at one store is actually cheaper at regular price on another. But once you find the best price, stick to a platform you trust. ClassyShop's price-match commitment means you don't need to risk an unknown seller for a slightly better deal.</p>

<h2>7. Don't Ignore Category-Specific Timing</h2>
<p>Pakistani sale cycles follow patterns: electronics tend to get their deepest discounts during 11.11 and Black Friday. Fashion peaks during Eid campaigns. Home appliances see their best deals in winter (November–December). Footwear and sports gear discount heavily in summer clearance (June–July). Align your big purchases with the right sale cycle and you'll consistently save 20–40% more than buying at random times.</p>

<h2>Final Thoughts</h2>
<p>Smart online shopping in Pakistan is not about buying the most discounted item — it's about buying what you actually need at the best possible price from a trustworthy seller. Follow these seven rules and every sale becomes an opportunity, not a gamble. Bookmark ClassyShop's sale calendar and let your wishlist do the planning — your bank account will thank you.</p>`,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    author: 'Faiza Sattar',
    category: 'General',
    status: 'published',
    readTime: '7 min read',
    tags: ['Shopping Guide', 'Pakistan', 'Sale Tips', 'Online Shopping', 'Money Saving'],
    isFeatured: true,
    publishedAt: new Date('2025-05-15'),
    date: new Date('2025-05-15'),
    metaTitle: 'How to Shop Smart During Online Sales in Pakistan | ClassyShop',
    metaDescription: 'Learn 7 proven strategies to save money during online sales in Pakistan — from price tracking to COD tips and flash sale tactics. Shop smarter at ClassyShop.',
  },
  {
    title: 'Top Fashion and Lifestyle Trends to Watch This Season',
    slug: 'top-fashion-lifestyle-trends-this-season',
    excerpt: "From quiet luxury to bold traditional fusion and sustainable living, this season's biggest fashion and lifestyle trends are reshaping how Pakistanis shop, dress, and live. Here's your complete guide.",
    content: `<h2>Pakistan's Style Scene Is Evolving Fast</h2>
<p>Pakistani fashion has always been a dynamic blend of tradition and modernity — and in 2025, that blend is more sophisticated than ever. Influenced by global runways, social media, and a growing consciousness around sustainability, Pakistani shoppers are making bolder, smarter choices. Here are the trends you need to know this season.</p>

<h2>1. Quiet Luxury — The Anti-Logo Movement</h2>
<p>The loudest trend this season is actually very quiet. Quiet luxury — the preference for understated, high-quality pieces over logo-heavy streetwear — has arrived in Pakistan's fashion-forward circles. Think tailored shalwar kameez in premium cotton and silk, minimal jewellery with clean lines, and neutral palettes (camel, ivory, slate, sage) that whisper quality rather than scream brand. ClassyShop's curated fashion collection reflects this shift — premium fabrics, minimal branding, maximum elegance.</p>

<h2>2. Traditional Fusion — East Meets Contemporary</h2>
<p>Pakistan's young designers are championing a new aesthetic: traditional silhouettes with contemporary detailing. A kurta with structured blazer shoulders. Embroidered dupattas paired with straight-cut trousers. Khussa with modern footwear design languages. This fusion is not a compromise — it's a statement of cultural confidence. Look for pieces that honour craft while fitting into an active, urban lifestyle.</p>

<h2>3. Sustainable and Conscious Fashion</h2>
<p>Globally, "fast fashion" is under fire. In Pakistan, a growing segment of shoppers — particularly millennials and Gen Z in major cities — is choosing quality over quantity. Buying fewer, better pieces. Preferring natural fibres (cotton, linen, bamboo) over synthetic blends. Supporting local artisans. ClassyShop's emphasis on genuine products with longer lifespans aligns with this movement — a Rs. 5,000 kurta that lasts three years beats a Rs. 1,500 piece that falls apart in three months.</p>

<h2>4. Colour Trends: Warm Earthy Tones and Electric Accents</h2>
<p>This season's colour story is a study in contrast. Warm earthy tones — burnt sienna, terracotta, warm olive, and sand — anchor everyday wardrobes. But electric accents — cobalt blue, fuchsia, citrus yellow — arrive as statement pieces: a bright handbag, bold earrings, a standout dupatta. The formula: build your core wardrobe in earthy neutrals, then add one electric accent piece per outfit for personality.</p>

<h2>5. Athleisure Continues to Dominate</h2>
<p>The pandemic permanently blurred the line between workout wear and everyday wear, and Pakistani shoppers have fully embraced it. High-waist leggings worn with oversized kurtas. Running shoes paired with casual shalwar. Structured bomber jackets over gym outfits. The key is intentionality — athleisure works when individual pieces are high quality and the combination is considered, not accidental. ClassyShop's footwear and fashion categories have responded with curated athleisure options that feel put-together without trying too hard.</p>

<h2>6. Lifestyle: The Wellness Movement Goes Mainstream</h2>
<p>Fashion doesn't exist in isolation — lifestyle is its context. And in 2025, wellness in Pakistan has moved from a niche pursuit to a mainstream priority. Quality sleep products (proper mattresses, temperature-regulating bedding), skincare routines, fitness gear, and ergonomic home office setups are all selling faster than ever. Pakistani consumers are investing in how they live, not just how they look. This shift is reflected in ClassyShop's expanding wellness category — from air purifiers to LED therapy devices to yoga equipment.</p>

<h2>7. Accessories: Jewellery as the Centrepiece</h2>
<p>In a quiet luxury wardrobe, accessories do the talking. Statement earrings — architectural, asymmetric, or traditional gold with modern forms — are this season's biggest jewellery trend. Layered delicate necklaces for daywear. Single bold cuff bracelets. And traditional jadau and kundan jewellery being restyled with contemporary outfits in a way that feels fresh rather than formal. ClassyShop's jewellery collection bridges both worlds — everyday pieces that can be dressed up and statement pieces for occasions.</p>

<h2>How to Apply These Trends</h2>
<p>You don't need to reinvent your wardrobe this season. Pick one or two trends that resonate with your personal style and lifestyle. Add one quality earthtone piece. Try one traditional fusion element. Invest in one wellness upgrade for your home. Small, intentional changes build a wardrobe and lifestyle that feels genuinely your own — not just a copy of what's trending on Instagram.</p>

<p>Explore ClassyShop's fashion, jewellery, footwear, and wellness collections to find pieces that match this season's direction — curated for Pakistani style, built for Pakistani life.</p>`,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    author: 'Faiza Sattar',
    category: 'Fashion',
    status: 'published',
    readTime: '8 min read',
    tags: ['Fashion', 'Lifestyle', 'Trends', 'Style Guide', 'Pakistan', 'Wellness'],
    isFeatured: true,
    publishedAt: new Date('2025-05-12'),
    date: new Date('2025-05-12'),
    metaTitle: 'Top Fashion & Lifestyle Trends This Season | ClassyShop Pakistan',
    metaDescription: 'From quiet luxury to traditional fusion and sustainable living — explore the top fashion and lifestyle trends shaping Pakistan in 2025. Your complete style guide from ClassyShop.',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    for (const blogData of blogs) {
      const existing = await Blog.findOne({ slug: blogData.slug });
      if (existing) {
        console.log(`Skipping (already exists): ${blogData.title}`);
        continue;
      }
      await Blog.create(blogData);
      console.log(`Seeded: ${blogData.title}`);
    }

    console.log('Blog seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();

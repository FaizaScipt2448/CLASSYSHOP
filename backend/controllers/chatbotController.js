const asyncHandler = require('express-async-handler');
const Product      = require('../models/Product');
const Order        = require('../models/Order');
const Blog         = require('../models/Blog');
const UserBehavior = require('../models/UserBehavior');
const { COUPONS }  = require('./cartController');
const { computeEstimatedDelivery } = require('./orderController');

/* ─────────────────────────── NLP Helpers ─────────────────────────── */

const detectIntent = (msg) => {
  const m = msg.toLowerCase().trim();

  if (/^(hi|hello|hey|hola|salam|assalam|good\s*(morning|afternoon|evening)|what'?s?\s*up|sup)\b/.test(m))
    return 'greeting';

  if (/\b(bye|goodbye|see\s*you|thanks|thank\s*you|that'?s?\s*all|thnx|thx|ok\s*bye)\b/.test(m))
    return 'goodbye';

  if (/\b(help|what\s*can\s*you|what\s*do\s*you|features|commands|how\s*do\s*i\s*use|capabilities)\b/.test(m))
    return 'help';

  if (
    /\bblogs?\b/.test(m) ||
    /\b(article|articles|blog\s*post|blog\s*posts|latest\s*blog|read\s*blog|tech\s*blog|beauty\s*blog|fashion\s*blog|show\s*blogs?|list\s*blogs?|any\s*blogs?|our\s*blogs?|website\s*blogs?)\b/.test(m)
  ) return 'blog';

  if (/\b(track|order\s*status|where\s*is\s*my|my\s*order|delivery\s*status|shipment|when\s*will\s*it|order\s*id|show\s*orders|my\s*orders|order\s*history)\b/.test(m))
    return 'order_tracking';

  if (/\b(my\s*cart|what'?s?\s*in\s*(my\s*)?cart|show\s*cart|view\s*cart|cart\s*items|current\s*cart|checkout)\b/.test(m))
    return 'cart_view';

  if (/\b(add\s*to\s*cart|add\s+.+\s*to\s*cart|remove\s*from\s*cart|remove\s*item)\b/.test(m))
    return 'cart_action';

  if (/\b(recommend|suggest|popular|trending|best\s*seller|featured|top\s*rated|what'?s?\s*hot|new\s*arrival|most\s*sold|hit\s*products|top\s*picks)\b/.test(m))
    return 'recommendations';

  if (/\b(return|refund|exchange|policy|cancel|how\s*to\s*return|money\s*back)\b/.test(m))
    return 'faq_return';

  if (/\b(ship|deliver|delivery\s*time|how\s*long|free\s*shipping|when\s*will|dispatch|courier|days)\b/.test(m))
    return 'faq_shipping';

  if (/\b(pay|payment|method|cash\s*on\s*delivery|cod|credit\s*card|debit\s*card|easypaisa|jazzcash|bank\s*transfer|how\s*to\s*pay|accepted\s*payment)\b/.test(m))
    return 'faq_payment';

  if (/\b(coupon|discount\s*code|promo|voucher|offer|deal|code|promo\s*code|apply\s*code|get\s*discount)\b/.test(m))
    return 'coupon';

  if (/\b(compare|vs|versus|difference|which\s*is\s*better)\b/.test(m))
    return 'compare';

  // Apply coupon — check before generic cart action
  if (/\b(apply|use|enter|add|redeem)\b.*\b(coupon|code|promo|discount|voucher)\b|\b[A-Z0-9]{5,12}\b.*\b(coupon|code|promo)\b/i.test(m))
    return 'apply_coupon';

  if (/\b(remove\s+.+\s*from\s*cart|delete\s+.+\s*from\s*cart|remove\s*item|delete\s*item|clear\s*cart)\b/.test(m))
    return 'remove_cart';

  // If it looks like a general knowledge question (not shopping-related), use AI
  if (isGeneralQuestion(m)) return 'general_ai';

  return 'product_search';
};

/* ─── General-question detector ─────────────────────────────────────────── */
const SHOPPING_WORDS = new Set([
  'buy','shop','product','order','cart','price','fashion','electronics','shoes','bag',
  'clothing','beauty','food','grocery','delivery','shipping','coupon','discount','brand',
  'sale','trending','wishlist','return','refund','stock','available','recommend','suggest',
  'necklace','dress','shirt','jeans','phone','laptop','sneakers','purse','makeup','vitamin',
]);

const isGeneralQuestion = (msg) => {
  const words = msg.split(/\s+/);
  if (words.some(w => SHOPPING_WORDS.has(w.toLowerCase()))) return false;
  return [
    /^(what|who|where|when|why|how|which|whose|whom)\b/i,
    /\b(calculate|compute|solve|what\s+is\s+\d+)\b/i,
    /\b(tell\s+me\s+about|explain|describe|define|meaning\s+of)\b/i,
    /\b(write|create|compose)\s+(a|an|some)?\s*(poem|story|essay|code|letter|recipe|joke)\b/i,
    /\b(capital\s+of|president|prime\s+minister|country|city|population)\b/i,
    /\b(history|science|biology|chemistry|physics|geography|mathematics|programming)\b/i,
    /\b(joke|riddle|puzzle|fact|trivia|quote)\b/i,
    /\b(translate|language|meaning|synonym|antonym)\b/i,
    /\b(weather|temperature|forecast)\b/i,
    /^\d[\d\s+\-*/().%]*[\d)]\s*[=?]*$/,   // pure math expression
  ].some(p => p.test(msg));
};

/* ─── AI answer helper (Claude or smart fallback) ───────────────────────── */
const answerWithAI = async (message) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey !== 'your_anthropic_api_key_here') {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `You are a helpful AI assistant embedded in ClassyShop, a Pakistani e-commerce store. Answer general questions concisely and accurately (under 200 words). Use simple Markdown bold (**text**) for emphasis. Always be friendly. If the question is about shopping, guide the user to search on ClassyShop. End with a helpful follow-up question or suggestion when natural.`,
        messages: [{ role: 'user', content: message }],
      });
      return resp.content[0].text.trim();
    } catch (e) {
      console.error('AI answer error:', e.message);
    }
  }

  // ── Smart fallback without API key ──
  const m = message.toLowerCase().trim();

  // Math
  const mathIn = m.match(/(?:what\s+is\s+|calculate\s+|compute\s+|solve\s+)?([\d\s+\-*/().%^]+[=?]*)$/);
  if (mathIn) {
    try {
      const expr = mathIn[1].replace(/[^0-9+\-*/.() ]/g, '').trim();
      if (expr) {
        const result = Function(`"use strict"; return (${expr})`)(); // safe: only numerics
        if (!isNaN(result) && isFinite(result)) {
          return `The answer is **${result}** 🧮\n\nNeed help finding a product on ClassyShop?`;
        }
      }
    } catch {}
  }

  // Time
  if (/\b(time|what\s+time|current\s+time)\b/.test(m)) {
    const t = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });
    return `It's currently **${t}** (Pakistan Standard Time) ⏰\n\nAnything I can help you find on ClassyShop?`;
  }

  // Date
  if (/\b(today|today'?s?\s*date|current\s*date|what\s+day)\b/.test(m)) {
    const d = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' });
    return `Today is **${d}** 📅\n\nGreat day to shop! Can I help you find something?`;
  }

  // Pakistan capital
  if (/capital\s+of\s+pakistan|pakistan.*capital/.test(m)) {
    return `The capital of Pakistan is **Islamabad** 🇵🇰\n\nClassyShop delivers across Pakistan — Islamabad, Karachi, Lahore, and more!`;
  }

  // Jokes
  if (/\b(joke|funny|make\s+me\s+laugh)\b/.test(m)) {
    const jokes = [
      "Why did the shopper bring a ladder to ClassyShop? Because the prices were *over the top!* 😄",
      "What did the bag say to the wallet? You've got it all covered! 👜",
      "Why do fashionistas never get lost? Because they always follow the *trend!* 👗",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)] + '\n\nNeed help finding anything on ClassyShop?';
  }

  // General fallback — acknowledge and invite back
  return `That's an interesting question! 🤔 While I specialize in helping you shop at ClassyShop, I can answer general questions better once our AI integration is fully configured.\n\nMeanwhile, I'm great at:\n• 🔍 Searching products\n• 📦 Tracking orders\n• 🎁 Finding coupons\n\nHow can I help you shop today?`;
};

// Extract coupon code from message (uppercase 4-12 char alphanumeric tokens)
const extractCouponCode = (msg) => {
  // Explicit known codes first
  const upper = msg.toUpperCase();
  const knownCodes = COUPONS.map(c => c.code);
  for (const code of knownCodes) {
    if (upper.includes(code)) return code;
  }
  // Generic: extract token that looks like a promo code
  const match = upper.match(/\b([A-Z][A-Z0-9]{3,11})\b/);
  return match ? match[1] : null;
};

// Extract order ID from message (last 8+ hex chars or full MongoDB ID)
const extractOrderId = (msg) => {
  const full  = msg.match(/\b([a-f0-9]{24})\b/i);
  if (full) return full[1];
  const short = msg.match(/#([a-f0-9A-F]{6,24})/);
  if (short) return short[1];
  return null;
};

const CATEGORY_MAP = {
  fashion:     ['fashion','clothing','clothes','shirt','dress','jeans','kurta','top','outfit','wear','apparel','men','women','kids','salwar','kameez','shalwar'],
  electronics: ['electronics','mobile','phone','laptop','computer','smartwatch','smart watch','camera','tablet','gadget','tech','device','iphone','samsung','dell','hp','lenovo'],
  bags:        ['bag','bags','handbag','purse','backpack','tote','satchel','briefcase'],
  footwear:    ['shoes','footwear','sandals','boots','sneakers','heels','slippers','chappals','joggers'],
  groceries:   ['groceries','grocery','food','vegetables','fruits','dairy','beverages','drinks','juice','milk','rice','wheat'],
  beauty:      ['beauty','makeup','skincare','cosmetics','lipstick','foundation','serum','moisturizer','cream','lotion','perfume'],
  wellness:    ['wellness','fitness','health','yoga','gym','supplement','nutrition','protein','vitamin','exercise'],
  jewellery:   ['jewellery','jewelry','necklace','earring','bracelet','ring','pendant','chain','locket']
};

const extractCategory = (msg) => {
  const m = msg.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => m.includes(kw))) return cat;
  }
  return null;
};

const extractPriceFilter = (msg) => {
  const m = msg.toLowerCase();
  let minPrice = 0, maxPrice = 9999999;

  const parseVal = (s) => {
    s = s.replace(/,/g, '').trim();
    if (s.endsWith('k')) return parseInt(s) * 1000;
    return parseInt(s);
  };

  // currency pattern: optional before OR after the number (Rs./PKR/rs/pkr)
  const cur = '(?:rs\\.?|pkr)?\\s*';
  const curAfter = '\\s*(?:rs\\.?|pkr)?';
  const num = '(\\d[\\d,]*k?)';

  const under = m.match(new RegExp(`(?:under|below|less\\s*than|max|upto|up\\s*to|within|cheaper\\s*than)\\s*${cur}${num}${curAfter}`, 'i'));
  if (under) maxPrice = parseVal(under[1]);

  const above = m.match(new RegExp(`(?:above|over|more\\s*than|min|at\\s*least|starting\\s*from|greater\\s*than)\\s*${cur}${num}${curAfter}`, 'i'));
  if (above) minPrice = parseVal(above[1]);

  const between = m.match(new RegExp(`between\\s*${cur}${num}\\s*(?:and|to|-)\\s*${cur}${num}${curAfter}`, 'i'));
  if (between) { minPrice = parseVal(between[1]); maxPrice = parseVal(between[2]); }

  return { minPrice, maxPrice };
};

const COLORS = ['red','blue','green','black','white','yellow','pink','purple','orange','grey','gray','brown','navy','maroon','beige','golden','silver','teal','coral','cream','off-white'];

const extractColor = (msg) => {
  const m = msg.toLowerCase();
  return COLORS.find(c => m.includes(c)) || null;
};

const extractRating = (msg) => {
  const m = msg.toLowerCase();
  const match = m.match(/(\d+(?:\.\d+)?)\s*(?:star|stars|\*+)\s*(?:and\s*above|or\s*more|\+)?/);
  if (match) return parseFloat(match[1]);
  if (/\b(highly\s*rated|top\s*rated|best\s*rated|good\s*rating|well\s*rated)\b/.test(m)) return 4;
  return null;
};

const extractSearchTerm = (msg) => {
  const stopWords = new Set([
    'show','me','find','search','for','i','want','need','buy','get','see','browse','list',
    'under','below','above','cheap','expensive','best','top','good','the','a','an','some',
    'any','please','can','you','looking','give','tell','recommend','suggest','latest',
    'newest','cheapest','affordable','budget','premium','luxury','discounted','sale',
    'offer','available','items','products','product','item','thing','things','something',
    'everything','all','most','very','really','quite','just','only','also','pkr','rs',
    'rupees','rupee'
  ]);
  return msg.toLowerCase()
    .replace(/rs\.?\s*\d[\d,]*k?/gi, '')            // strip "Rs.20,000"
    .replace(/\bpkr\.?\s*\d[\d,]*k?\b/gi, '')       // strip "PKR 20,000"
    .replace(/\b\d[\d,]*k?\s*(?:rs\.?|pkr)\b/gi, '') // strip "20,000 PKR"
    .replace(/\b\d[\d,]*k?\b/g, '')                 // strip bare numbers "20,000" or "20k"
    .replace(/\b(under|below|above|over|between|and|to|less\s*than|more\s*than|upto|cheaper\s*than)\b/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .join(' ')
    .trim();
};

// Detect sort intent from message
const extractSortOrder = (msg) => {
  const m = msg.toLowerCase();
  if (/\b(cheapest|lowest\s*price|most\s*affordable|budget|cheap|minimum\s*price|low\s*price|price\s*low)\b/.test(m)) return { price: 1 };
  if (/\b(expensive|highest\s*price|most\s*expensive|premium|luxury|max\s*price|high\s*price|price\s*high|priciest)\b/.test(m)) return { price: -1 };
  if (/\b(latest|newest|new\s*arrival|recently\s*added|just\s*arrived|fresh)\b/.test(m)) return { createdAt: -1 };
  if (/\b(best\s*discount|most\s*discount|highest\s*discount|best\s*deal|top\s*deal|sale|offer)\b/.test(m)) return { discount: -1 };
  if (/\b(top\s*rated|best\s*rated|highest\s*rated|most\s*popular|popular|trending|best\s*seller)\b/.test(m)) return { rating: -1 };
  return { sales: -1, rating: -1 }; // default
};

/* ─────────────────────────── Static Blog Fallback ────────────────── */
// Same posts shown in AdminBlogs.js — used when DB collection is empty
const STATIC_BLOGS = [
  {
    _id: 'blog1',
    title: "Top 10 Smartphones to Buy in 2025: What's Worth Your Money",
    excerpt: "From the iPhone 15 Pro Max to the Samsung Galaxy S24 Ultra — we break down specs, camera performance, and value for money to help you pick the right phone this year.",
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: new Date('2025-05-10'),
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  },
  {
    _id: 'blog2',
    title: 'Noise-Cancelling Headphones: Sony vs Bose vs Apple — The Ultimate Showdown',
    excerpt: "We tested the Sony WH-1000XM5, Bose QuietComfort 45, and Apple AirPods Max in real-world conditions. Here's how they compare on sound, comfort, and battery life.",
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: new Date('2025-05-07'),
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  },
  {
    _id: 'blog3',
    title: 'How to Style Your Tech: The Best Laptop Bags & Accessories for 2025',
    excerpt: "Work-from-anywhere culture means your tech gear needs to look as good as it performs. We've curated the best sleeves, totes, and backpacks that blend fashion with function.",
    category: 'Bags',
    author: 'Faiza Sattar',
    date: new Date('2025-05-04'),
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
  },
  {
    _id: 'blog4',
    title: 'Smartwatches in 2025: Apple Watch vs Samsung Galaxy Watch vs Garmin',
    excerpt: "Fitness tracking, ECG, sleep monitoring, and LTE connectivity — we put the three biggest smartwatch platforms head-to-head to find out which one deserves your wrist.",
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: new Date('2025-04-30'),
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
  },
  {
    _id: 'blog5',
    title: 'The Best Wireless Earbuds Under Rs. 15,000 in Pakistan',
    excerpt: "You don't need to spend a fortune for great audio. We've tested dozens of TWS earbuds available in Pakistan and picked the ones that give you the best bang for your rupee.",
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: new Date('2025-04-25'),
    image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80',
  },
  {
    _id: 'blog6',
    title: 'Skincare Meets Tech: Smart Beauty Devices Worth Trying in 2025',
    excerpt: 'From LED face masks to ultrasonic cleansers and AI-powered skin analyzers, beauty technology is booming. Here\'s our guide to which gadgets actually work.',
    category: 'Beauty',
    author: 'Faiza Sattar',
    date: new Date('2025-04-20'),
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
  },
  {
    _id: 'blog7',
    title: 'Gaming Peripherals Guide: Best Keyboards, Mice & Headsets for 2025',
    excerpt: 'Level up your gaming setup with our picks for the best mechanical keyboards, high-DPI mice, and surround-sound headsets — across budget, mid-range, and premium tiers.',
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: new Date('2025-04-15'),
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80',
  },
  {
    _id: 'blog8',
    title: 'How to Choose the Right Running Shoes: A Tech-Driven Approach',
    excerpt: 'Modern running shoes pack carbon-fibre plates, energy-return foam, and embedded sensors. We explain what the tech actually means and which shoes are worth the investment.',
    category: 'Footwear',
    author: 'Faiza Sattar',
    date: new Date('2025-04-10'),
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  },
];

/* ─────────────────────────── Static Data ─────────────────────────── */

// Chatbot-friendly display versions of coupons (for the /coupon intent response)
const DISPLAY_COUPONS = COUPONS.map(c => ({
  code:        c.code,
  discount:    c.type === 'percent' ? `${c.value}% OFF` : c.type === 'flat' ? `Rs.${c.value} OFF` : 'Free Shipping',
  minOrder:    c.minOrder ? `Rs.${c.minOrder.toLocaleString()}` : 'Any order',
  description: c.description,
  expiry:      c.expiry.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}));

const FAQ_RESPONSES = {
  faq_return: {
    message: `**Return & Refund Policy** 📦\n\n✅ **7-Day Returns** — Return most items within 7 days of delivery\n✅ **Refund Time** — 3-5 business days after return is received\n✅ **Exchange** — Wrong size or color? We'll swap it!\n\n**How to Return:**\n1. Go to **My Orders** in your profile\n2. Select the item and click "Return"\n3. Choose return reason\n4. Drop off at any Leopard/TCS outlet\n\n⚠️ Items must be unused, unwashed, in original packaging with tags attached.`,
    quickReplies: ['Shipping policy', 'Payment methods', 'Track my order']
  },
  faq_shipping: {
    message: `**Shipping Information** 🚚\n\n📦 **Standard Delivery:** 3–5 business days\n⚡ **Express Delivery:** 1–2 days (Karachi, Lahore, Islamabad)\n🎉 **FREE Shipping:** On orders above **Rs.10,000**\n💰 **Shipping Fee:** Rs.250 for orders below Rs.10,000\n\n**We deliver to all major cities:**\nKarachi · Lahore · Islamabad · Rawalpindi\nFaisalabad · Multan · Peshawar · Quetta\n\n📞 Customer support: Mon–Sat, 9am–6pm`,
    quickReplies: ['Return policy', 'Track my order', 'Payment methods']
  },
  faq_payment: {
    message: `**Payment Methods** 💳\n\nWe accept all major payment options:\n\n💵 **Cash on Delivery** — Pay when package arrives\n📱 **EasyPaisa** — Send to 0300-0000000\n📱 **JazzCash** — Send to 0300-0000000\n🏦 **Bank Transfer** — Details provided on checkout\n💳 **Credit/Debit Card** — Visa & Mastercard (Sandbox)\n\n🔒 **100% Secure** — All transactions encrypted with 256-bit SSL\n\n⚠️ COD available on orders under Rs.50,000`,
    quickReplies: ['Shipping info', 'Return policy', 'Get coupon']
  }
};

/* ─────────────────────────── Main Handler ─────────────────────────── */

const processMessage = asyncHandler(async (req, res) => {
  const { message, userId } = req.body;

  if (!message?.trim()) {
    return res.json({
      type: 'text',
      message: 'Please type a message! 😊',
      quickReplies: ['Hi!', 'Show trending', 'Track my order']
    });
  }

  const intent = detectIntent(message);

  /* ── Greeting ── */
  if (intent === 'greeting') {
    return res.json({
      type: 'text',
      message: `Hello! 👋 Welcome to **ClassyShop**!\n\nI'm your AI shopping assistant. Here's what I can do:\n\n🔍 **Search** — "Show me shoes under Rs.5,000"\n📦 **Track Orders** — "Where is my order?"\n🛒 **Cart Help** — "What's in my cart?"\n💡 **Recommendations** — "Show trending products"\n🎁 **Coupons** — "Any discount codes?"\n❓ **FAQs** — "What's the return policy?"\n\nHow can I help you today?`,
      quickReplies: ['Show trending products', 'Track my order', 'Get coupons', 'Return policy']
    });
  }

  /* ── Goodbye ── */
  if (intent === 'goodbye') {
    return res.json({
      type: 'text',
      message: 'Thank you for visiting ClassyShop! 😊 Have a wonderful day. Come back anytime! 🛍️',
      quickReplies: ['Browse products', 'View my orders']
    });
  }

  /* ── Help ── */
  if (intent === 'help') {
    return res.json({
      type: 'text',
      message: `**Here's everything I can help with:**\n\n🔍 **Product Search**\n• "Show me electronics under Rs.30,000"\n• "Find women's fashion"\n\n📦 **Order Tracking**\n• "Where is my order?"\n• "Show my recent orders"\n\n🛒 **Cart**\n• "What's in my cart?" / "Checkout"\n\n🎁 **Coupons**\n• "Any promo codes?" / "Apply SAVE10"\n\n📝 **Blogs**\n• "Show latest blog posts"\n• "Beauty tips blog"\n\n🧠 **General Questions**\n• "What is the capital of France?"\n• "Tell me a joke"\n• "What time is it?"\n• Any general knowledge question!\n\n❓ **Policies**\n• "Return policy" / "Shipping info"`,
      quickReplies: ['Search products', 'Show blogs', 'Track order', 'Get coupons']
    });
  }

  /* ── Order Tracking ── */
  if (intent === 'order_tracking') {
    if (!userId) {
      return res.json({
        type: 'text',
        message: '🔐 **Please log in** to track your orders. Once logged in, I can show you real-time status and tracking timeline for all your orders!',
        quickReplies: ['Login', 'Browse products'],
        action: 'redirect_login'
      });
    }
    try {
      // Check if a specific order ID was mentioned
      const specificId = extractOrderId(message);
      if (specificId) {
        let order;
        try {
          order = await Order.findOne({ _id: specificId, user: userId });
        } catch {}
        if (order) {
          const STATUS_LABELS = {
            pending: 'Order Placed', processing: 'Packed & Ready',
            shipped: 'Shipped', out_for_delivery: 'Out for Delivery',
            delivered: 'Delivered', cancelled: 'Cancelled'
          };
          const STEP_ICONS = {
            pending: '🕐', processing: '📦', shipped: '🚚',
            out_for_delivery: '🛵', delivered: '✅', cancelled: '❌'
          };
          const estimated = order.estimatedDelivery || computeEstimatedDelivery(order.createdAt, order.status);
          const timeline = (order.statusHistory || []).map(h =>
            `${STEP_ICONS[h.status] || '•'} **${STATUS_LABELS[h.status] || h.status}** — ${new Date(h.timestamp).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${h.note ? `\n  _${h.note}_` : ''}`
          ).join('\n');
          return res.json({
            type: 'orders',
            message: `Found your order! Here's the tracking:\n\n**Status:** ${STEP_ICONS[order.status] || ''} ${STATUS_LABELS[order.status] || order.status}\n**Estimated Delivery:** ${estimated.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n**Timeline:**\n${timeline || 'No history available'}`,
            data: [{
              _id: order._id, status: order.status, totalPrice: order.totalPrice,
              createdAt: order.createdAt, itemCount: order.orderItems?.length || 0,
              isPaid: order.isPaid, paymentMethod: order.paymentMethod,
              estimatedDelivery: estimated,
              items: order.orderItems?.slice(0, 2).map(i => ({ name: i.name, image: i.image, qty: i.qty, price: i.price }))
            }],
            quickReplies: ['View all orders', 'Continue shopping']
          });
        }
      }

      const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5);
      if (!orders.length) {
        return res.json({
          type: 'text',
          message: "You haven't placed any orders yet. Start shopping and your orders will appear here! 🛍️",
          quickReplies: ['Browse products', 'Show trending', 'Get coupons']
        });
      }
      return res.json({
        type: 'orders',
        message: `📦 Found **${orders.length}** recent order${orders.length > 1 ? 's' : ''}. Click any order to see full tracking timeline:`,
        data: orders.map(o => ({
          _id: o._id, status: o.status, totalPrice: o.totalPrice,
          createdAt: o.createdAt, itemCount: o.orderItems?.length || 0,
          isPaid: o.isPaid, paymentMethod: o.paymentMethod,
          estimatedDelivery: o.estimatedDelivery || computeEstimatedDelivery(o.createdAt, o.status),
          items: o.orderItems?.slice(0, 2).map(i => ({ name: i.name, image: i.image, qty: i.qty, price: i.price }))
        })),
        quickReplies: ['View all orders', 'Browse products', 'Get help']
      });
    } catch {
      return res.json({ type: 'text', message: "Sorry, I couldn't fetch your orders right now. Please try again later.", quickReplies: [] });
    }
  }

  /* ── Cart View ── */
  if (intent === 'cart_view') {
    return res.json({
      type: 'cart_summary',
      message: '🛒 Here\'s your **cart summary**. Click "View Cart" to manage items or proceed to checkout!',
      quickReplies: ['View cart', 'Checkout', 'Apply coupon', 'Continue shopping']
    });
  }

  /* ── Cart Action ── */
  if (intent === 'cart_action') {
    const term = extractSearchTerm(message);
    if (message.toLowerCase().includes('remove')) {
      return res.json({
        type: 'text',
        message: `To remove an item from your cart, visit the **cart page** and click the ✕ button next to the item. Or I can show you your cart right now!`,
        quickReplies: ['View cart', 'Continue shopping']
      });
    }
    // Add to cart via chat — search the product first
    if (term) {
      try {
        const products = await Product.find({
          $or: [
            { name: { $regex: term, $options: 'i' } },
            { brand: { $regex: term, $options: 'i' } },
            { category: { $regex: term, $options: 'i' } }
          ]
        }).limit(4);
        if (products.length) {
          return res.json({
            type: 'products',
            message: `I found these products matching "${term}". Click **ADD TO CART** on any item:`,
            data: products,
            cartAction: true,
            quickReplies: ['View cart', 'Search more']
          });
        }
      } catch {}
    }
    return res.json({
      type: 'cart_summary',
      message: 'Let me show you your current cart! You can manage items from the cart page.',
      quickReplies: ['View cart', 'Continue shopping']
    });
  }

  /* ── Apply Coupon ── */
  if (intent === 'apply_coupon') {
    const code = extractCouponCode(message);
    if (!code) {
      return res.json({
        type: 'text',
        message: "I couldn't detect a coupon code. Please say something like **\"Apply SAVE10\"** or **\"Use code FLAT200\"**.",
        quickReplies: ['Show available coupons', 'Get coupons']
      });
    }
    const coupon = COUPONS.find(c => c.code === code.toUpperCase());
    if (!coupon) {
      return res.json({
        type: 'text',
        message: `❌ Coupon **"${code}"** is not valid. Here are the available coupons you can use:`,
        quickReplies: ['Get coupons', 'Browse products']
      });
    }
    if (new Date() > coupon.expiry) {
      return res.json({
        type: 'text',
        message: `⏰ Sorry, coupon **"${coupon.code}"** has expired. Check our active coupons below!`,
        quickReplies: ['Get coupons', 'Browse products']
      });
    }
    return res.json({
      type: 'apply_coupon',
      message: `✅ Coupon **${coupon.code}** is valid! ${coupon.description}.\n\nApplying it to your cart now...`,
      couponCode: coupon.code,
      couponType: coupon.type,
      couponValue: coupon.value,
      freeShipping: coupon.type === 'shipping',
      quickReplies: ['View my cart', 'Checkout', 'Get more coupons']
    });
  }

  /* ── Remove from Cart ── */
  if (intent === 'remove_cart') {
    const term = extractSearchTerm(message);
    if (term) {
      return res.json({
        type: 'remove_cart',
        message: `I'll help you remove **"${term}"** from your cart. Checking your cart now...`,
        removeQuery: term,
        quickReplies: ['View cart', 'Continue shopping']
      });
    }
    return res.json({
      type: 'cart_summary',
      message: `🛒 Here's your cart. Click the **✕** button next to any item to remove it:`,
      quickReplies: ['View cart page', 'Continue shopping']
    });
  }

  /* ── Recommendations ── */
  if (intent === 'recommendations') {
    try {
      const cat = extractCategory(message);
      let query = {};
      if (cat) {
        query.category = { $regex: new RegExp('^' + cat + '$', 'i') };
      } else {
        query.$or = [{ isPopular: true }, { isFeatured: true }];
      }

      let products = await Product.find(query).sort({ sales: -1, rating: -1 }).limit(6);

      if (!products.length) {
        products = await Product.find({}).sort({ sales: -1, rating: -1 }).limit(6);
      }

      const label = cat
        ? `trending **${cat}** products`
        : 'trending & most popular products';

      return res.json({
        type: 'products',
        message: `🔥 Here are our ${label} that customers love:`,
        data: products,
        quickReplies: ['Show fashion', 'Show electronics', 'Show beauty', 'Get coupons']
      });
    } catch {
      return res.json({ type: 'text', message: "Sorry, couldn't load recommendations right now.", quickReplies: [] });
    }
  }

  /* ── FAQ Responses ── */
  if (FAQ_RESPONSES[intent]) {
    return res.json({ type: 'text', ...FAQ_RESPONSES[intent] });
  }

  /* ── Coupons ── */
  if (intent === 'coupon') {
    return res.json({
      type: 'coupons',
      message: '🎉 **Exclusive coupons just for you!** Copy a code and apply it at checkout:',
      data: DISPLAY_COUPONS,
      quickReplies: ['Apply SAVE10', 'Apply FLAT200', 'View cart', 'Checkout']
    });
  }

  /* ── Compare ── */
  if (intent === 'compare') {
    return res.json({
      type: 'text',
      message: `To compare products, click the **⇄ Compare** icon on any product card. You can compare up to 3 products side-by-side.\n\nWant me to search for specific products to compare?`,
      quickReplies: ['Search electronics', 'Search fashion', 'Show trending']
    });
  }

  /* ── Blogs ── */
  if (intent === 'blog') {
    try {
      const rawTerm = message.toLowerCase()
        .replace(/\b(show|list|get|find|any|our|website|latest|recent|new)\b/g, '')
        .replace(/\bblogs?\b/g, '')
        .replace(/\barticles?\b/g, '')
        .replace(/\bposts?\b/g, '')
        .trim();

      let blogs = [];
      let usedDB = false;

      // Try DB first
      if (rawTerm) {
        blogs = await Blog.find({
          $or: [
            { title:    { $regex: rawTerm, $options: 'i' } },
            { excerpt:  { $regex: rawTerm, $options: 'i' } },
            { category: { $regex: rawTerm, $options: 'i' } },
          ]
        }).sort({ createdAt: -1 }).limit(4);
      }
      if (!blogs.length) {
        blogs = await Blog.find({}).sort({ createdAt: -1 }).limit(4);
      }

      // If DB empty, fall back to static blogs
      if (!blogs.length) {
        const term = rawTerm.toLowerCase();
        blogs = term
          ? STATIC_BLOGS.filter(b =>
              b.title.toLowerCase().includes(term) ||
              b.excerpt.toLowerCase().includes(term) ||
              (b.category || '').toLowerCase().includes(term)
            )
          : STATIC_BLOGS;
        if (!blogs.length) blogs = STATIC_BLOGS; // no keyword match — show all
      } else {
        usedDB = true;
      }

      const label = rawTerm
        ? `blog posts related to **"${rawTerm}"**`
        : 'latest blog posts on ClassyShop';

      return res.json({
        type: 'blogs',
        message: `📝 Here are our ${label}:`,
        data: blogs.slice(0, 4).map(b => ({
          _id:      b._id,
          title:    b.title,
          excerpt:  b.excerpt,
          image:    b.image,
          author:   b.author || 'ClassyShop Team',
          date:     b.date || b.createdAt,
          category: b.category,
        })),
        quickReplies: ['Electronics blogs', 'Beauty blogs', 'Footwear blogs', 'Browse products']
      });
    } catch (err) {
      console.error('Blog chat error:', err.message);
      // Even on error, return static blogs
      return res.json({
        type: 'blogs',
        message: '📝 Here are our latest blog posts:',
        data: STATIC_BLOGS.slice(0, 4),
        quickReplies: ['Browse products', 'Show trending']
      });
    }
  }

  /* ── General AI questions ── */
  if (intent === 'general_ai') {
    try {
      const answer = await answerWithAI(message);
      return res.json({
        type: 'text',
        message: answer,
        quickReplies: ['Show trending products', 'Search products', 'Get coupons', 'Read blogs']
      });
    } catch {
      return res.json({
        type: 'text',
        message: `I'm here to help! 😊 You can ask me anything — shopping, general questions, or even riddles.\n\nFor the best experience with general knowledge questions, our AI integration needs to be configured.\n\nMeanwhile, I excel at helping you shop on ClassyShop!`,
        quickReplies: ['Show trending', 'Track my order', 'Read blogs']
      });
    }
  }

  /* ── Product Search (default) ── */
  const category    = extractCategory(message);
  const { minPrice, maxPrice } = extractPriceFilter(message);
  const searchTerm  = extractSearchTerm(message);
  const color       = extractColor(message);
  const minRating   = extractRating(message);
  const sortOrder   = extractSortOrder(message);

  // Filter out category keywords from search term to avoid redundant searches
  const categoryKeywords = category ? (CATEGORY_MAP[category] || []) : [];
  const finalTerm = searchTerm.split(/\s+/).filter(w => w && !categoryKeywords.includes(w)).join(' ');

  // Build base query (price, category, rating)
  const buildBaseQuery = () => {
    const q = {};
    if (category) q.category = { $regex: new RegExp('^' + category + '$', 'i') };
    if (maxPrice < 9999999) q.price = { ...q.price, $lte: maxPrice };
    if (minPrice > 0)       q.price = { ...q.price, $gte: minPrice };
    if (minRating)          q.rating = { $gte: minRating };
    return q;
  };

  // Add text filter to query
  const withText = (q, term) => {
    if (!term) return q;
    const textConds = [
      { name: { $regex: term, $options: 'i' } },
      { brand: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      ...(!category ? [{ category: { $regex: term, $options: 'i' } }] : []),
      { tags: { $in: [new RegExp(term, 'i')] } }
    ];
    if (q.$or) {
      return { ...q, $and: [{ $or: q.$or }, { $or: textConds }], $or: undefined };
    }
    return { ...q, $or: textConds };
  };

  // Add color filter
  const withColor = (q, col) => {
    if (!col) return q;
    const colorConds = [
      { name: { $regex: col, $options: 'i' } },
      { description: { $regex: col, $options: 'i' } },
      { tags: { $in: [new RegExp(col, 'i')] } }
    ];
    if (q.$or) {
      return { ...q, $and: [{ $or: q.$or }, { $or: colorConds }], $or: undefined };
    }
    return { ...q, $or: colorConds };
  };

  try {
    let products = [];
    let usedFallback = false;

    // Attempt 1: full query (category + price + text + color)
    let query = buildBaseQuery();
    if (finalTerm) query = withText(query, finalTerm);
    if (color)     query = withColor(query, color);
    products = await Product.find(query).sort(sortOrder).limit(6);

    // Attempt 2: drop color constraint
    if (!products.length && color) {
      let q2 = buildBaseQuery();
      if (finalTerm) q2 = withText(q2, finalTerm);
      products = await Product.find(q2).sort(sortOrder).limit(6);
      if (products.length) usedFallback = true;
    }

    // Attempt 3: drop text, keep category + price + rating
    if (!products.length && finalTerm) {
      products = await Product.find(buildBaseQuery()).sort(sortOrder).limit(6);
      if (products.length) usedFallback = true;
    }

    // Attempt 4: category only (no price constraint)
    if (!products.length && category) {
      products = await Product.find({
        category: { $regex: new RegExp('^' + category + '$', 'i') }
      }).sort(sortOrder).limit(6);
      if (products.length) usedFallback = true;
    }

    // Attempt 5: broad text search, no filters at all
    if (!products.length && searchTerm) {
      const words = searchTerm.split(/\s+/).filter(Boolean);
      const patterns = words.map(w => new RegExp(w, 'i'));
      products = await Product.find({
        $or: [
          { name: { $in: patterns } },
          { category: { $in: patterns } },
          { brand: { $in: patterns } },
          { tags: { $elemMatch: { $in: patterns.map(p => p.source) } } }
        ]
      }).sort(sortOrder).limit(6);
      if (products.length) usedFallback = true;
    }

    // Attempt 6: single-word fallback — try each word individually
    if (!products.length && searchTerm) {
      const words = searchTerm.split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        products = await Product.find({
          $or: [
            { name: { $regex: word, $options: 'i' } },
            { category: { $regex: word, $options: 'i' } },
            { brand: { $regex: word, $options: 'i' } },
            { description: { $regex: word, $options: 'i' } }
          ]
        }).sort(sortOrder).limit(6);
        if (products.length) { usedFallback = true; break; }
      }
    }

    // Attempt 7: last resort — return trending products
    if (!products.length) {
      products = await Product.find({}).sort({ sales: -1, rating: -1 }).limit(6);
      return res.json({
        type: 'products',
        message: `I couldn't find an exact match for **"${message}"**, but here are our most popular products you might like:`,
        data: products,
        quickReplies: ['Browse fashion', 'Browse electronics', 'Show coupons', 'Search again']
      });
    }

    // Build response label
    const sortLabel = (() => {
      if (sortOrder.price === 1)       return ' sorted by **lowest price**';
      if (sortOrder.price === -1)      return ' sorted by **highest price**';
      if (sortOrder.createdAt === -1)  return ' (latest arrivals)';
      if (sortOrder.discount === -1)   return ' with **best discounts**';
      if (sortOrder.rating === -1)     return ' (top rated)';
      return '';
    })();

    let responseMsg = usedFallback
      ? `Here are the closest matching products for **"${message}"**`
      : `Found **${products.length}** product${products.length > 1 ? 's' : ''}`;
    if (category && !usedFallback) responseMsg += ` in **${category}**`;
    if (color && !usedFallback) responseMsg += ` in **${color}**`;
    if (maxPrice < 9999999) responseMsg += ` under **Rs.${maxPrice.toLocaleString()}**`;
    if (minPrice > 0) responseMsg += ` above **Rs.${minPrice.toLocaleString()}**`;
    if (minRating) responseMsg += ` rated **${minRating}★+**`;
    responseMsg += sortLabel + ':';

    return res.json({
      type: 'products',
      message: responseMsg,
      data: products,
      quickReplies: ['Show cheapest', 'Show latest', 'Filter by price', 'Get coupon']
    });
  } catch (err) {
    return res.json({ type: 'text', message: 'Sorry, search failed. Please try again.', quickReplies: [] });
  }
});

/* ── Autocomplete Suggestions ── */
const getSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  const products = await Product.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } }
    ]
  }).select('name brand category image price').limit(6);
  res.json(products);
});

/* ── "Customers Also Bought" — co-purchase + category fallback ── */
const getRelated = asyncHandler(async (req, res) => {
  const { productId, category } = req.query;
  const Order = require('../models/Order');

  let results = [];

  if (productId) {
    const ordersWithProduct = await Order.find({
      'orderItems.product': productId
    }).select('orderItems').limit(100);

    if (ordersWithProduct.length > 0) {
      const productCount = {};
      ordersWithProduct.forEach(order => {
        order.orderItems.forEach(item => {
          const key = item.product?.toString();
          if (key && key !== productId) {
            productCount[key] = (productCount[key] || 0) + 1;
          }
        });
      });
      const topIds = Object.entries(productCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id);
      if (topIds.length > 0) {
        const fetched = await Product.find({ _id: { $in: topIds } });
        results = fetched.sort(
          (a, b) => (productCount[b._id.toString()] || 0) - (productCount[a._id.toString()] || 0)
        );
      }
    }
  }

  // Fallback: same-category products by sales + rating
  if (results.length < 4) {
    const catSafe = (category || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const extra = await Product.find({
      _id: { $nin: [productId, ...results.map(p => p._id)] },
      category: { $regex: new RegExp('^' + catSafe, 'i') }
    }).sort({ sales: -1, rating: -1 }).limit(4 - results.length);
    results = [...results, ...extra];
  }

  res.json(results.slice(0, 4));
});

module.exports = { processMessage, getSuggestions, getRelated };

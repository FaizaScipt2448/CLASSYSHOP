/* Smart product content generator — no API key needed.
   Analyzes product name to detect category, brand, type, then
   builds dynamic description, SEO meta, and physical attributes. */

// ── Category detection ──────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'jewellery',
    keywords: ['necklace','bracelet','ring','earring','pendant','chain','anklet','bangle','choker','locket','jewel','jewelry','gold','silver','diamond','pearl','gem','stone','crystal','plated','kundan','meenakari','polki'],
    brands: ['Tiffany & Co.','Pandora','Swarovski','Cartier','Malabar Gold','ClassyShop Jewels','Zaveri Pearls','Voylla'],
    subcats: { necklace:'Necklaces', bracelet:'Bracelets', ring:'Rings', earring:'Earrings', pendant:'Pendants', chain:'Chains', bangle:'Bangles', choker:'Chokers', anklet:'Anklets', locket:'Lockets', default:'Fashion Jewellery' },
    weight:[8,80], wUnit:'g', dims:[[15,8,2],[25,15,4]],
  },
  {
    key: 'electronics',
    keywords: ['headphone','earphone','earbuds','speaker','laptop','computer','tablet','phone','smartphone','camera','tv','television','monitor','keyboard','mouse','charger','cable','adapter','router','smartwatch','gaming','console','printer','scanner','projector','drone','microphone','webcam','hard drive','ssd','ram','gpu','led'],
    brands: ['Sony','Samsung','Apple','JBL','Bose','Anker','Xiaomi','Huawei','OnePlus','LG','Panasonic','Logitech','HP','Dell','Lenovo','Asus','Acer','Canon','Nikon'],
    subcats: { headphone:'Headphones & Earphones', earphone:'Headphones & Earphones', earbuds:'Headphones & Earphones', speaker:'Speakers', laptop:'Laptops', phone:'Smartphones', tablet:'Tablets', camera:'Cameras', tv:'Televisions', monitor:'Monitors', keyboard:'Computer Accessories', mouse:'Computer Accessories', charger:'Chargers & Cables', smartwatch:'Smartwatches', gaming:'Gaming', default:'Electronics' },
    weight:[200,2000], wUnit:'g', dims:[[10,10,5],[40,30,20]],
  },
  {
    key: 'footwear',
    keywords: ['shoe','sneaker','boot','sandal','slipper','heel','flat','pump','loafer','oxford','moccasin','espadrille','wedge','stiletto','trainer','runner','jogger','khussa','chappal'],
    brands: ['Nike','Adidas','Puma','Reebok','New Balance','Converse','Vans','Clarks','Bata','Service','Servis','Hush Puppies'],
    subcats: { sneaker:'Sneakers', boot:'Boots', sandal:'Sandals', slipper:'Slippers', heel:'Heels', flat:'Flats', pump:'Pumps', loafer:'Loafers', trainer:'Sports Shoes', runner:'Running Shoes', khussa:'Khussa & Traditional', chappal:'Chappals', default:'Shoes' },
    weight:[300,800], wUnit:'g', dims:[[30,15,15],[40,20,20]],
  },
  {
    key: 'bags',
    keywords: ['bag','purse','backpack','tote','clutch','handbag','satchel','briefcase','luggage','pouch','wallet','crossbody','shoulder bag','messenger','duffle','gym bag','diaper bag'],
    brands: ['Michael Kors','Coach','Gucci','Tory Burch','Guess','Charles & Keith','Zara','H&M','Aldo','Forever 21'],
    subcats: { backpack:'Backpacks', tote:'Tote Bags', clutch:'Clutches', wallet:'Wallets', briefcase:'Briefcases', luggage:'Luggage', pouch:'Pouches', crossbody:'Crossbody Bags', default:'Handbags' },
    weight:[300,1200], wUnit:'g', dims:[[30,25,12],[50,40,20]],
  },
  {
    key: 'beauty',
    keywords: ['cream','serum','moisturizer','sunscreen','spf','foundation','lipstick','lip gloss','mascara','eyeliner','blush','powder','primer','toner','cleanser','face wash','mask','scrub','lotion','perfume','fragrance','concealer','contour','highlighter','eyeshadow','bb cream','cc cream','makeup','cosmetic','nail','kajal','kohl'],
    brands: ["L'Oréal",'Maybelline','MAC Cosmetics','Nykaa','Bioré','Neutrogena','The Ordinary','Olay','Pond\'s','Lakme','Revlon','NYX','Charlotte Tilbury','Fenty Beauty','Huda Beauty','Dermique'],
    subcats: { cream:'Face Creams', serum:'Serums', sunscreen:'Sun Protection', foundation:'Foundation', lipstick:'Lip Color', mascara:'Eye Makeup', eyeliner:'Eye Makeup', primer:'Face Primer', toner:'Toners', cleanser:'Face Wash & Cleansers', mask:'Face Masks', scrub:'Face Scrubs', perfume:'Perfumes & Fragrances', nail:'Nail Care', default:'Skincare' },
    weight:[50,300], wUnit:'g', dims:[[8,5,8],[15,10,15]],
  },
  {
    key: 'wellness',
    keywords: ['vitamin','supplement','protein','whey','omega','shampoo','conditioner','hair oil','body wash','soap','toothpaste','mouthwash','deodorant','sanitizer','hand wash','detox','collagen','biotin','zinc','iron','calcium','magnesium','probiotic','multivitamin','herbal','ayurvedic','essential oil','diffuser'],
    brands: ['Dove','Head & Shoulders','Pantene','Himalaya','Garnier','Nivea','TRESemmé','Sunsilk','Lifebuoy','Dettol','Colgate','Oral-B','Nature\'s Bounty','GNC','Centrum','Now Foods'],
    subcats: { shampoo:'Shampoos', conditioner:'Conditioners', soap:'Soaps & Body Wash', vitamin:'Vitamins & Supplements', protein:'Protein Supplements', toothpaste:'Oral Care', deodorant:'Deodorants', oil:'Hair Oils', default:'Health & Wellness' },
    weight:[100,500], wUnit:'g', dims:[[7,7,20],[12,12,28]],
  },
  {
    key: 'fashion',
    keywords: ['shirt','t-shirt','tshirt','dress','jeans','trouser','pant','kurta','shalwar','kameez','jacket','coat','sweater','hoodie','top','blouse','skirt','suit','tuxedo','abaya','hijab','dupatta','lawn','cotton','linen','silk','chiffon','velvet','suit','waistcoat','cardigan','shorts','leggings','tracksuit'],
    brands: ['Zara','H&M','UNIQLO','Bonanza Satrangi','Alkaram Studio','Gul Ahmed','Khaadi','Sapphire','Breakout','Outfitters','Chen One','Ethnic','Junaid Jamshed','Beechtree'],
    subcats: { shirt:'Shirts & T-Shirts', dress:'Dresses', jeans:'Jeans & Trousers', kurta:'Kurtas & Shalwar Kameez', jacket:'Jackets & Coats', sweater:'Sweaters & Hoodies', top:'Tops & Blouses', skirt:'Skirts', abaya:'Abayas & Modest Wear', suit:'Suits & Formal Wear', default:'Clothing' },
    weight:[200,600], wUnit:'g', dims:[[35,25,3],[55,45,5]],
  },
  {
    key: 'groceries',
    keywords: ['tea','coffee','rice','flour','oil','spice','masala','sauce','ketchup','biscuit','snack','chocolate','juice','milk','yogurt','ghee','butter','cheese','sugar','salt','pasta','noodle','cereal','oats','honey','jam','pickle','chutney','daal','lentil','pulses'],
    brands: ['Nestlé','Unilever','Tapal','Lipton','Knorr','National Foods','Shan','Olpers','Rooh Afza','Haleeb','Mezan','Rafhan','Dawn','Gourmet'],
    subcats: { tea:'Tea & Coffee', coffee:'Tea & Coffee', rice:'Rice & Grains', oil:'Cooking Oils & Ghee', spice:'Spices & Masalas', biscuit:'Biscuits & Snacks', chocolate:'Chocolates & Sweets', juice:'Juices & Drinks', dairy:'Dairy Products', default:'Food & Groceries' },
    weight:[200,2000], wUnit:'g', dims:[[10,10,15],[25,20,30]],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function detectCategory(lower) {
  let best = null, bestScore = 0;
  for (const cat of CATEGORIES) {
    const score = cat.keywords.reduce((s, kw) => s + (lower.includes(kw) ? kw.length : 0), 0);
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best || CATEGORIES.find(c => c.key === 'fashion');
}

function detectSubcat(lower, cat) {
  for (const [kw, label] of Object.entries(cat.subcats)) {
    if (kw !== 'default' && lower.includes(kw)) return label;
  }
  return cat.subcats.default;
}

function detectBrand(lower, catBrands) {
  for (const b of catBrands) {
    if (lower.includes(b.toLowerCase())) return b;
  }
  return catBrands[Math.floor(Math.random() * Math.min(4, catBrands.length))];
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randDims(cat) {
  const [lo, hi] = cat.dims;
  return {
    length: randInt(lo[0], hi[0]),
    width:  randInt(lo[1], hi[1]),
    height: randInt(lo[2], hi[2]),
    dimensionUnit: 'cm',
  };
}

function randWeight(cat) {
  const val = randInt(cat.weight[0], cat.weight[1]);
  if (cat.wUnit === 'kg' || val >= 1000) {
    return { weightValue: (val / 1000).toFixed(2), weightUnit: 'kg', packageWeightValue: ((val + randInt(100,300)) / 1000).toFixed(2), packageWeightUnit: 'kg' };
  }
  return { weightValue: val, weightUnit: 'g', packageWeightValue: val + randInt(50, 200), packageWeightUnit: 'g' };
}

function titleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// ── Description builder ──────────────────────────────────────────────────────
const DESC_TEMPLATES = {
  jewellery: (name, brand, price) => {
    const types = ['weddings','Eid celebrations','formal dinners','festive occasions','daily elegance'];
    const occ = types[randInt(0,types.length-1)];
    const materials = ['18K gold-plated brass','sterling silver-plated alloy','premium zinc alloy with rhodium finish','hypoallergenic stainless steel with gold finish'];
    const mat = materials[randInt(0,materials.length-1)];
    return `Introducing the ${name} — a breathtaking piece of wearable art crafted to turn heads and spark compliments. Made from ${mat}, this piece delivers the look of luxury jewellery at an accessible price, making fine style available to every woman.\n\nEach detail has been thoughtfully designed: the secure clasp ensures it stays in place throughout the day, the finish resists tarnishing for lasting brilliance, and the lightweight construction means you can wear it for hours without discomfort. The hypoallergenic materials make it safe for all skin types, including sensitive skin.\n\nWhether you're dressing up for ${occ} or adding a refined accent to a casual outfit, the ${name} delivers versatile glamour. Presented in elegant packaging, it makes a perfect gift for mothers, sisters, and friends. Order today from ClassyShop with fast delivery across Pakistan.`;
  },
  electronics: (name, brand, price) => {
    const uses = ['music lovers','professionals working from home','gamers','students','commuters'];
    const use = uses[randInt(0,uses.length-1)];
    return `The ${name} by ${brand} is engineered for ${use} who demand performance without compromise. Built with cutting-edge technology and premium components, it delivers a superior experience that sets a new standard in its class.\n\nKey features include advanced connectivity, intuitive controls, and a robust build quality designed to withstand daily use. The ergonomic design ensures comfort during extended sessions, while energy-efficient engineering keeps running costs low. Compatible with all major platforms and devices, setup takes minutes.\n\nBacked by ${brand}'s global quality standards, the ${name} comes with a manufacturer warranty and dedicated after-sales support. With ClassyShop's fast nationwide delivery, upgrade your tech experience today — your order arrives at your doorstep anywhere in Pakistan.`;
  },
  footwear: (name, brand, price) => {
    const occasions = ['casual outings','daily wear','office looks','weekend adventures','sports and fitness'];
    const occ = occasions[randInt(0,occasions.length-1)];
    return `Step out in confidence with the ${name} from ${brand} — where style meets all-day comfort. Designed for ${occ}, these shoes combine a sleek contemporary silhouette with materials engineered to keep your feet comfortable through every step.\n\nThe cushioned insole provides superior shock absorption, reducing fatigue even on long days. The durable outsole offers reliable grip on both indoor and outdoor surfaces. Premium upper materials breathe naturally, keeping your feet fresh, while the reinforced stitching ensures the pair stays looking new through seasons of wear.\n\nAvailable in multiple sizes to find your perfect fit, the ${name} pairs effortlessly with everything from jeans to formal trousers. Order now on ClassyShop and enjoy fast delivery across Pakistan — comfort and style delivered to your door.`;
  },
  bags: (name, brand, price) => {
    const styles = ['everyday carry','work essentials','weekend trips','casual outings','evening events'];
    const style = styles[randInt(0,styles.length-1)];
    return `Meet the ${name} by ${brand} — the perfect companion for your ${style}. Crafted from high-quality materials with meticulous attention to detail, this bag combines fashion-forward design with practical functionality that fits your modern lifestyle.\n\nThe spacious interior features multiple organized compartments to keep your essentials neatly arranged and easily accessible. The sturdy zippers and reinforced handles are built for daily rigors, while the premium hardware adds a luxurious finishing touch. Adjustable straps ensure a comfortable carry whether worn over the shoulder or across the body.\n\nVersatile enough to complement both casual and professional outfits, the ${name} is available now on ClassyShop. With secure packaging and swift delivery across Pakistan, your perfect bag is just a click away.`;
  },
  beauty: (name, brand, price) => {
    const benefits = ['hydration and radiance','anti-aging and firmness','oil control and clarity','even skin tone','deep nourishment'];
    const benefit = benefits[randInt(0,benefits.length-1)];
    return `Discover the transformative power of ${name} by ${brand} — your new skincare essential for ${benefit}. Formulated with clinically-tested, dermatologist-approved ingredients, this product delivers visible results from the very first use.\n\nThe lightweight, non-greasy formula absorbs quickly into the skin, working at a cellular level to address your specific skincare concerns. Free from harsh parabens, sulfates, and artificial fragrances, it's gentle enough for daily use on all skin types, including sensitive skin. The concentrated formula means a little goes a long way — offering excellent value per application.\n\nJoin thousands of satisfied customers across Pakistan who have made ${name} their daily ritual. Order now on ClassyShop and experience the difference of premium skincare — delivered fast to your doorstep.`;
  },
  wellness: (name, brand, price) => {
    return `Transform your self-care routine with ${name} by ${brand} — a trusted wellness essential crafted from carefully selected ingredients for maximum effectiveness. Whether you're building a healthier lifestyle or maintaining your current routine, this product delivers consistent results you can feel.\n\nFormulated to the highest quality standards, ${name} goes through rigorous testing to ensure purity, potency, and safety. The carefully balanced formula works in harmony with your body's natural processes, providing support without harsh side effects. Suitable for daily use, it integrates seamlessly into any routine.\n\nMillions of health-conscious consumers worldwide trust ${brand} for their wellness journey. Now available in Pakistan exclusively on ClassyShop — order today and take the next step toward a healthier, happier you.`;
  },
  fashion: (name, brand, price) => {
    const seasons = ['summer','winter','all-season','festive','casual'];
    const season = seasons[randInt(0,seasons.length-1)];
    const fabrics = ['premium cotton blend','soft breathable fabric','high-quality woven material','durable yet comfortable textile'];
    const fabric = fabrics[randInt(0,fabrics.length-1)];
    return `Redefine your wardrobe with the ${name} from ${brand} — a ${season} essential that blends contemporary style with everyday comfort. Made from ${fabric}, it offers a flattering fit and a look that effortlessly transitions from day to night.\n\nThe thoughtful design details — precision stitching, quality hardware, and a well-considered cut — reflect the brand's commitment to garments that look as good as they feel. Easy to care for and resistant to fading, this piece maintains its shape and color wash after wash, making it a reliable wardrobe staple for the long term.\n\nComplete the look with your favorite accessories and footwear. The ${name} is available now in multiple sizes on ClassyShop — Pakistan's trusted fashion destination. Order online today for fast nationwide delivery.`;
  },
  groceries: (name, brand, price) => {
    return `Stock your pantry with the finest quality ${name} from ${brand} — a household staple trusted by families across Pakistan for its consistent quality, authentic taste, and reliable freshness. Sourced from premium ingredients and processed under strict hygiene standards, every pack delivers the same great quality you expect.\n\n${brand}'s commitment to quality means no artificial colors, no harmful additives, and full transparency about ingredients. The resealable packaging locks in freshness and extends shelf life, so nothing goes to waste. Whether used in everyday cooking or as a quick convenient option on busy days, ${name} fits naturally into your family's routine.\n\nNow available on ClassyShop at the best prices, delivered fresh to your home anywhere in Pakistan. Add it to your cart today and enjoy the taste and quality your family deserves.`;
  },
};

// ── SEO builder ──────────────────────────────────────────────────────────────
const SEO_TEMPLATES = {
  jewellery: (name, brand) => ({
    metaDescription: `Buy ${name} online in Pakistan. ${brand} quality jewellery with premium finish. Perfect for weddings & Eid. Fast delivery. Shop on ClassyShop.`,
    baseKeywords: `${name.toLowerCase()}, buy jewellery online pakistan, ${brand.toLowerCase()} jewellery, women jewellery pakistan, gold plated jewellery, fashion jewellery pakistan, artificial jewellery, jewellery set, online jewellery shop pakistan, classyshop jewellery, zewarat online, best jewellery pakistan`,
  }),
  electronics: (name, brand) => ({
    metaDescription: `Buy ${name} by ${brand} in Pakistan. Best price, genuine product, fast delivery. Top-rated electronics on ClassyShop. Order now.`,
    baseKeywords: `${name.toLowerCase()}, ${brand.toLowerCase()}, buy ${brand.toLowerCase()} online pakistan, electronics pakistan, best price pakistan, online shopping electronics, classyshop electronics, genuine electronics pakistan, tech gadgets pakistan`,
  }),
  footwear: (name, brand) => ({
    metaDescription: `Shop ${name} by ${brand} in Pakistan. Comfortable, durable, stylish footwear. Free delivery available. Find your size on ClassyShop.`,
    baseKeywords: `${name.toLowerCase()}, ${brand.toLowerCase()} shoes, buy shoes online pakistan, footwear pakistan, comfortable shoes pakistan, ${brand.toLowerCase()} pakistan, online shoe shopping, classyshop footwear, best shoes pakistan, joote online`,
  }),
  bags: (name, brand) => ({
    metaDescription: `Buy ${name} by ${brand} in Pakistan. Stylish, spacious & durable bags for every occasion. Fast delivery across Pakistan on ClassyShop.`,
    baseKeywords: `${name.toLowerCase()}, ${brand.toLowerCase()} bag, buy bags online pakistan, handbags pakistan, women bags pakistan, designer bags pakistan, classyshop bags, purse online pakistan, bag shopping online`,
  }),
  beauty: (name, brand) => ({
    metaDescription: `Shop ${name} by ${brand} in Pakistan. Dermatologist-tested skincare with visible results. Genuine product, fast delivery. ClassyShop Beauty.`,
    baseKeywords: `${name.toLowerCase()}, ${brand.toLowerCase()}, buy skincare online pakistan, beauty products pakistan, skincare pakistan, ${brand.toLowerCase()} pakistan, genuine cosmetics pakistan, classyshop beauty, online beauty shop, skin care products`,
  }),
  wellness: (name, brand) => ({
    metaDescription: `Buy ${name} by ${brand} in Pakistan. Premium quality wellness & health products. Authentic, fast delivery. Shop now on ClassyShop.`,
    baseKeywords: `${name.toLowerCase()}, ${brand.toLowerCase()}, health products pakistan, wellness pakistan, buy supplements online pakistan, ${brand.toLowerCase()} pakistan, classyshop wellness, healthcare products, personal care pakistan`,
  }),
  fashion: (name, brand) => ({
    metaDescription: `Shop ${name} by ${brand} in Pakistan. Trendy, comfortable & affordable fashion. Multiple sizes available. Fast nationwide delivery on ClassyShop.`,
    baseKeywords: `${name.toLowerCase()}, ${brand.toLowerCase()}, buy clothes online pakistan, fashion pakistan, women fashion pakistan, men fashion pakistan, latest fashion pakistan, classyshop fashion, online clothes shopping, kapray online`,
  }),
  groceries: (name, brand) => ({
    metaDescription: `Buy ${name} by ${brand} online in Pakistan. Fresh quality groceries at best price. Delivered to your door. Shop now on ClassyShop.`,
    baseKeywords: `${name.toLowerCase()}, ${brand.toLowerCase()}, buy groceries online pakistan, online grocery pakistan, ${brand.toLowerCase()} pakistan, fresh groceries, classyshop groceries, grocery delivery pakistan, online supermarket pakistan`,
  }),
};

// ── Main export ──────────────────────────────────────────────────────────────
export function generateProductContent(name, priceStr) {
  const price = Number(priceStr) || 999;
  const lower = name.toLowerCase();

  const cat = detectCategory(lower);
  const brand = detectBrand(lower, cat.brands);
  const subcategory = detectSubcat(lower, cat);
  const physical = { ...randDims(cat), ...randWeight(cat) };

  const originalPrice = Math.round(price * (1.1 + Math.random() * 0.2));
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  const countInStock = randInt(18, 180);

  const popRoll = Math.random();
  const descFn = DESC_TEMPLATES[cat.key] || DESC_TEMPLATES.fashion;
  const seoFn  = SEO_TEMPLATES[cat.key]  || SEO_TEMPLATES.fashion;
  const seo = seoFn(titleCase(name), brand);

  const nameTitle = titleCase(name);
  const metaTitle = `${nameTitle} | ClassyShop`.slice(0, 60);

  // Add product-specific keywords from the name itself
  const nameTokens = name.split(/\s+/).filter(t => t.length > 3).join(', ');
  const metaKeywords = [nameTokens, seo.baseKeywords].filter(Boolean).join(', ');

  return {
    description:        descFn(nameTitle, brand, price),
    brand,
    category:           cat.key,
    subcategory,
    originalPrice,
    discount,
    countInStock,
    isFeatured:  popRoll > 0.65 ? 'yes' : 'no',
    isLatest:    popRoll > 0.45 ? 'yes' : 'no',
    isPopular:   popRoll > 0.35 ? 'yes' : 'no',
    weightValue:         physical.weightValue,
    weightUnit:          physical.weightUnit,
    packageWeightValue:  physical.packageWeightValue,
    packageWeightUnit:   physical.packageWeightUnit,
    length:              physical.length,
    width:               physical.width,
    height:              physical.height,
    dimensionUnit:       physical.dimensionUnit,
    size: cat.key === 'fashion' ? 'S, M, L, XL'
        : cat.key === 'footwear' ? 'UK 6, 7, 8, 9, 10'
        : '',
    metaTitle,
    metaDescription: seo.metaDescription.slice(0, 155),
    metaKeywords,
  };
}

import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME  = 'ClassyShop';
const SITE_URL   = 'https://classyshop.pk';
const DEFAULT_IMG = `${SITE_URL}/og-image.jpg`;
const DEFAULT_KEYWORDS = 'online shopping Pakistan, ClassyShop, fashion, electronics, bags, footwear, beauty, wellness, jewellery, groceries, mega store';

/**
 * Drop-in SEO component. All props optional — falls back to site-level defaults.
 *
 * Props:
 *   title        — page title (appended with " | ClassyShop")
 *   description  — meta description (max ~160 chars)
 *   keywords     — comma-separated keywords
 *   image        — OG/Twitter share image URL
 *   url          — canonical URL (full)
 *   type         — OG type: "website" | "product" | "article"
 *   noIndex      — if true, adds noindex,nofollow (for cart/checkout/login)
 *   jsonLd       — JSON-LD object or array to inject as structured data
 *   breadcrumbs  — array of { name, url } for BreadcrumbList schema
 *   product      — product object for Product schema
 */
const SEOHead = ({
  title,
  description,
  keywords,
  image        = DEFAULT_IMG,
  url,
  type         = 'website',
  noIndex      = false,
  jsonLd,
  breadcrumbs,
  product,
}) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Pakistan's Big Mega Store`;

  const metaDesc = description ||
    'ClassyShop — Pakistan\'s premier online mega store for Fashion, Electronics, Bags, Footwear, Beauty, Wellness, Jewellery & Groceries.';

  const metaKeywords = keywords
    ? `${keywords}, ${DEFAULT_KEYWORDS}`
    : DEFAULT_KEYWORDS;

  const canonical = url ? `${SITE_URL}${url}` : undefined;

  // ── JSON-LD helpers ──
  const schemas = [];

  if (breadcrumbs && breadcrumbs.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        ...breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: b.name,
          item: `${SITE_URL}${b.url}`,
        })),
      ],
    });
  }

  if (product) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      brand: { '@type': 'Brand', name: product.brand },
      sku: product._id,
      category: product.category,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PKR',
        price: product.price,
        availability: product.countInStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: canonical,
        seller: { '@type': 'Organization', name: SITE_NAME },
      },
      ...(product.rating && product.numReviews > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.numReviews,
          bestRating: 5,
          worstRating: 1,
        },
      } : {}),
    });
  }

  if (jsonLd) {
    const extra = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    schemas.push(...extra);
  }

  return (
    <Helmet>
      {/* ── Primary ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* ── Open Graph ── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_PK" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ClassyShopPK" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={image} />

      {/* ── JSON-LD Structured Data ── */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;

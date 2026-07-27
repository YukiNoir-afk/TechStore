import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, url }) => {
  const defaultTitle = 'TechStore - Mua sắm đồ công nghệ chính hãng';
  const defaultDescription = 'TechStore chuyên cung cấp các sản phẩm công nghệ, điện thoại, laptop, phụ kiện chính hãng với giá tốt nhất thị trường.';
  const defaultImage = 'https://tech-store-zfhl.vercel.app/logo.png'; // Assuming a logo or default image exists
  const defaultUrl = 'https://tech-store-zfhl.vercel.app';

  const seo = {
    title: title ? `${title} | TechStore` : defaultTitle,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: url ? `${defaultUrl}${url}` : defaultUrl,
  };

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{seo.title}</title>
      <meta name='description' content={seo.description} />

      {/* Open Graph tags (Facebook, LinkedIn, etc.) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seo.url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
    </Helmet>
  );
};

export default SEO;

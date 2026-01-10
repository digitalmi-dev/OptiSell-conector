/**
 * Tipuri Shopify pentru mapping
 */

/**
 * Shopify Product Variant
 */
export class ShopifyVariant {
  constructor(data) {
    this.id = data.id || null;
    this.product_id = data.product_id || null;
    this.title = data.title || 'Default Title';
    this.price = data.price || '0.00';
    this.compare_at_price = data.compare_at_price || null;
    this.sku = data.sku || '';
    this.barcode = data.barcode || '';
    this.inventory_quantity = data.inventory_quantity || 0;
    this.inventory_management = data.inventory_management || 'shopify';
    this.inventory_policy = data.inventory_policy || 'deny';
    this.weight = data.weight || null;
    this.weight_unit = data.weight_unit || 'kg';
    this.requires_shipping = data.requires_shipping !== undefined ? data.requires_shipping : true;
    this.taxable = data.taxable !== undefined ? data.taxable : true;
  }
}

/**
 * Shopify Product Image
 */
export class ShopifyImage {
  constructor(data) {
    this.id = data.id || null;
    this.product_id = data.product_id || null;
    this.position = data.position || 1;
    this.src = data.src || '';
    this.alt = data.alt || '';
    this.width = data.width || null;
    this.height = data.height || null;
  }
}

/**
 * Shopify Product
 */
export class ShopifyProduct {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.body_html = data.body_html || '';
    this.vendor = data.vendor || '';
    this.product_type = data.product_type || '';
    this.handle = data.handle || '';
    this.tags = data.tags || '';
    this.status = data.status || 'draft'; // active, archived, draft
    this.variants = (data.variants || []).map(v => new ShopifyVariant(v));
    this.images = (data.images || []).map(img => new ShopifyImage(img));
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.published_at = data.published_at || null;
  }

  /**
   * Mapare la format intern OptiSell
   */
  toOptiSellProduct() {
    const variant = this.variants[0] || new ShopifyVariant({});
    const mainImage = this.images[0] || null;

    return {
      id: this.id?.toString() || null,
      shopifyId: this.id?.toString() || null,
      name: this.title,
      description: this.body_html,
      shortDescription: this.body_html?.substring(0, 200) || '',
      sku: variant.sku || '',
      ean: variant.barcode || '',
      price: variant.price || '0.00',
      comparePrice: variant.compare_at_price || null,
      stock: variant.inventory_quantity || 0,
      brand: this.vendor || '',
      category: this.product_type || '',
      tags: this.tags || '',
      weight: variant.weight ? variant.weight.toString() : '',
      active: this.status === 'active',
      image: mainImage?.src || null,
      images: this.images.map(img => ({ url: img.src, alt: img.alt })),
      createdAt: this.created_at || null,
      updatedAt: this.updated_at || null
    };
  }
}

/**
 * Shopify Products Response
 */
export class ShopifyProductsResponse {
  constructor(data) {
    this.products = (data.products || []).map(p => new ShopifyProduct(p));
    this.page_info = data.page_info || null;
  }
}

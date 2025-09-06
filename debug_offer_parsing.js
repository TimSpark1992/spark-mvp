// Debug script to test offer parsing logic
const offer = {
  "id": "07bc674b-f40f-4928-be79-b5bc574fb1fa",
  "campaign_id": "be9e2307-d8bc-4292-b6f7-17ddcd0b07ca",
  "brand_id": "84eb94eb-1aca-4104-a161-e3df03d4759d",
  "creator_id": "5b408260-4d3d-4392-a589-0a485a4152a9",
  "items": "[{\"deliverable_type\":\"IG_Reel\",\"quantity\":2,\"base_price_cents\":7150,\"rush_fee_pct\":10}]",
  "subtotal_cents": 15730,
  "platform_fee_pct": 20,
  "platform_fee_cents": 3146,
  "total_cents": 18876,
  "currency": "USD",
  "status": "drafted",
  "expires_at": "2025-09-26T15:59:59+00:00",
  "notes": "Test description"
};

// Simulate formatPrice function
const formatPrice = (priceCents, currency = 'USD') => {
  if (priceCents === null || priceCents === undefined || isNaN(priceCents) || priceCents < 0) {
    return `$0.00`
  }
  const price = priceCents / 100
  return `$${price.toFixed(2)}`
}

console.log('🔍 Debug Offer Parsing:');
console.log('Raw offer.items:', offer.items, 'Type:', typeof offer.items);

// Parse the items JSONB field to get offer details
let parsedItems = []
try {
  parsedItems = typeof offer.items === 'string' ? JSON.parse(offer.items) : offer.items || []
  console.log('📊 Parsed items:', parsedItems);
} catch (error) {
  console.error('❌ Error parsing offer items:', error);
  parsedItems = []
}

const firstItem = parsedItems[0] || {}
console.log('🎯 First item extracted:', firstItem);
console.log('💰 First item base_price_cents:', firstItem.base_price_cents, 'Type:', typeof firstItem.base_price_cents);

// Test the formatPrice function with the value
const testPrice = formatPrice(firstItem.base_price_cents || 0, offer.currency || 'USD')
console.log('🧪 Testing formatPrice with base_price_cents:', firstItem.base_price_cents, '-> Result:', testPrice);

// Simulate what formData would look like
const formData = {
  ...offer,
  deliverable_type: firstItem.deliverable_type || '',
  quantity: firstItem.quantity || 1,
  base_price_cents: firstItem.base_price_cents || 0,
  rush_fee_pct: firstItem.rush_fee_pct || 0,
  deadline: offer.expires_at ? offer.expires_at.split('T')[0] : '',
  description: offer.notes || ''
}

console.log('💾 Form data:', {
  deliverable_type: formData.deliverable_type,
  quantity: formData.quantity,
  base_price_cents: formData.base_price_cents,
  rush_fee_pct: formData.rush_fee_pct
});

console.log('🧮 Final calculation test - Base price * quantity:', formData.base_price_cents * formData.quantity);
console.log('🧮 Final formatPrice test (Base Price):', formatPrice(formData.base_price_cents * formData.quantity, formData.currency));

// Test each step separately
console.log('\n=== STEP BY STEP DEBUGGING ===');
console.log('Step 1 - Raw base_price_cents:', firstItem.base_price_cents);
console.log('Step 2 - Quantity:', formData.quantity);
console.log('Step 3 - Multiplication:', firstItem.base_price_cents * formData.quantity);
console.log('Step 4 - Format result:', formatPrice(firstItem.base_price_cents * formData.quantity, 'USD'));

// Test potential issues
console.log('\n=== POTENTIAL ISSUES ===');
console.log('Is base_price_cents a number?', typeof firstItem.base_price_cents === 'number');
console.log('Is quantity a number?', typeof formData.quantity === 'number');
console.log('Is multiplication result a number?', typeof (firstItem.base_price_cents * formData.quantity) === 'number');
console.log('Is multiplication result > 0?', (firstItem.base_price_cents * formData.quantity) > 0);
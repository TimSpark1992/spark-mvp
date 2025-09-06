// Test OfferSheet parsing logic to debug Base Price $0.00 issue
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

// Simulate formatPrice function exactly as in /app/lib/formatters.js
const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' }
]

const formatPrice = (priceCents, currency = 'USD') => {
  // Handle null, undefined, or invalid price values
  if (priceCents === null || priceCents === undefined || isNaN(priceCents) || priceCents < 0) {
    const currencyInfo = CURRENCIES.find(c => c.code === currency)
    return `${currencyInfo?.symbol || '$'}0.00`
  }
  
  const price = priceCents / 100
  const currencyInfo = CURRENCIES.find(c => c.code === currency)
  return `${currencyInfo?.symbol || '$'}${price.toFixed(2)}`
}

console.log('🧪 TESTING OFFERSHEET PARSING LOGIC');
console.log('=====================================');

// Step 1: Simulate OfferSheet useEffect for non-create mode 
console.log('Step 1: Raw offer data');
console.log('🔍 OfferSheet: Processing offer data:', JSON.stringify(offer, null, 2));
console.log('🔍 Raw offer.items:', offer.items, 'Type:', typeof offer.items);

// Step 2: Parse the items JSONB field
let parsedItems = []
try {
  parsedItems = typeof offer.items === 'string' ? JSON.parse(offer.items) : offer.items || []
  console.log('\nStep 2: Parse items JSONB');
  console.log('📊 Parsed items:', parsedItems);
} catch (error) {
  console.error('❌ Error parsing offer items:', error);
  parsedItems = []
}

const firstItem = parsedItems[0] || {}
console.log('\nStep 3: Extract first item');
console.log('🎯 First item extracted:', firstItem);
console.log('💰 First item base_price_cents:', firstItem.base_price_cents, 'Type:', typeof firstItem.base_price_cents);

// Step 3: Test formatPrice function
const testPrice = formatPrice(firstItem.base_price_cents || 0, offer.currency || 'USD')
console.log('\nStep 4: Test formatPrice function');
console.log('🧪 Testing formatPrice with base_price_cents:', firstItem.base_price_cents, '-> Result:', testPrice);

// Step 4: Simulate formData creation
const formData = {
  ...offer,
  // Extract data from the first item for display
  deliverable_type: firstItem.deliverable_type || '',
  quantity: firstItem.quantity || 1,
  base_price_cents: firstItem.base_price_cents || 0,
  rush_fee_pct: firstItem.rush_fee_pct || 0,
  deadline: offer.expires_at ? offer.expires_at.split('T')[0] : '',
  description: offer.notes || ''
}

console.log('\nStep 5: Create formData');
console.log('💾 Setting form data:', {
  deliverable_type: formData.deliverable_type,
  quantity: formData.quantity,
  base_price_cents: formData.base_price_cents,
  rush_fee_pct: formData.rush_fee_pct
});

// Step 5: Test View mode display calculations
console.log('\nStep 6: View mode display calculations');
console.log('🧮 Final calculation test - Base price * quantity:', formData.base_price_cents * formData.quantity);

// This is what the View mode should display
const viewModeBasePrice = formatPrice(formData.base_price_cents * formData.quantity, formData.currency);
console.log('🧮 View mode Base Price display:', viewModeBasePrice);

// Additional debugging for potential issues  
console.log('\nStep 7: Debugging potential issues');
console.log('❓ Is formData.base_price_cents truthy?', !!formData.base_price_cents);
console.log('❓ Is formData.base_price_cents === 0?', formData.base_price_cents === 0);
console.log('❓ Is formData.quantity truthy?', !!formData.quantity);
console.log('❓ Is multiplication result correct?', formData.base_price_cents * formData.quantity === 14300);

// Test edge cases that might cause $0.00
console.log('\nStep 8: Test edge cases');
console.log('Edge case 1 - formatPrice(0):', formatPrice(0));
console.log('Edge case 2 - formatPrice(null):', formatPrice(null));
console.log('Edge case 3 - formatPrice(undefined):', formatPrice(undefined));
console.log('Edge case 4 - formatPrice(NaN):', formatPrice(NaN));
console.log('Edge case 5 - formatPrice(""):', formatPrice(""));

// Test what happens if there's a type mismatch
console.log('\nStep 9: Test type conversion issues');
const stringValue = "7150";
console.log('String value test - formatPrice("7150"):', formatPrice(stringValue));
console.log('String multiplication - "7150" * 2:', stringValue * 2);
console.log('Type check - typeof "7150":', typeof stringValue);

console.log('\n🎯 EXPECTED RESULTS:');
console.log('- Base price should show: $143.00 (7150 cents * 2 quantity = 14300 cents)');
console.log('- Single item price: $71.50 (7150 cents)');
console.log('- Parsing should work correctly with no errors');

console.log('\n📋 SUMMARY:');
if (viewModeBasePrice === '$143.00') {
  console.log('✅ SUCCESS: Parsing logic works correctly - Base Price should show $143.00');
} else {
  console.log('❌ ISSUE: Expected $143.00 but got:', viewModeBasePrice);
}
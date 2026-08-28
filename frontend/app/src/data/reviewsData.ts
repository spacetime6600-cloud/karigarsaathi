export interface BuyerReview {
  id: string;
  reviewerName: string;
  reviewerLocation: string;
  isVerifiedBuyer: boolean;
  rating: number; // 1 to 5
  ratingsBreakdown: {
    productQuality: number;
    craftAuthenticity: number;
    communication: number;
  };
  productId: string;
  productTitle: string;
  productImage: string;
  craft: string;
  state: string;
  reviewText: string;
  date: string;
  helpfulCount: number;
}

export const BUYER_REVIEWS: BuyerReview[] = [
  {
    id: 'rev_01',
    reviewerName: 'Ananya Sharma',
    reviewerLocation: 'Bangalore, Karnataka',
    isVerifiedBuyer: true,
    rating: 5,
    ratingsBreakdown: {
      productQuality: 5,
      craftAuthenticity: 5,
      communication: 5,
    },
    productId: 'prod_jamdani_01',
    productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
    productImage: '/craft-thumbnails/as-craft.svg',
    craft: 'Traditional Jamdani Weaving',
    state: 'Assam',
    reviewText:
      'The drape and hand-feel of this Jamdani saree are exceptional. The Craft Passport QR code allowed me to see the exact pit-loom video and dye process used by Biren in Assam. Truly authentic handmade heritage.',
    date: '2026-08-21',
    helpfulCount: 14,
  },
  {
    id: 'rev_02',
    reviewerName: 'Rohan Deshmukh',
    reviewerLocation: 'Pune, Maharashtra',
    isVerifiedBuyer: true,
    rating: 5,
    ratingsBreakdown: {
      productQuality: 5,
      craftAuthenticity: 5,
      communication: 4,
    },
    productId: 'prod_bluepottery_02',
    productTitle: 'Cobalt Floral Jaipur Blue Pottery Urn',
    productImage: '/craft-thumbnails/rj-craft.svg',
    craft: 'Jaipur Blue Pottery',
    state: 'Rajasthan',
    reviewText:
      'The cobalt glaze is vibrant and arrived very securely packaged. Knowing that no clay is used and it is made of pure quartz stone made this a prized conversation piece in our living room.',
    date: '2026-08-23',
    helpfulCount: 9,
  },
  {
    id: 'rev_03',
    reviewerName: 'Meera Nambiar',
    reviewerLocation: 'Kochi, Kerala',
    isVerifiedBuyer: true,
    rating: 5,
    ratingsBreakdown: {
      productQuality: 5,
      craftAuthenticity: 5,
      communication: 5,
    },
    productId: 'prod_pattachitra_03',
    productTitle: 'Tree of Life Raghurajpur Pattachitra Scroll',
    productImage: '/craft-thumbnails/od-craft.svg',
    craft: 'Pattachitra Painting',
    state: 'Odisha',
    reviewText:
      'The micro-detailing with natural stone pigments on treated silk is breathtaking. The direct enquiry process through KarigarSaathi connected me straight with the Chitrakar artist family.',
    date: '2026-08-25',
    helpfulCount: 11,
  },
  {
    id: 'rev_04',
    reviewerName: 'Vikramaditya Sengupta',
    reviewerLocation: 'Kolkata, West Bengal',
    isVerifiedBuyer: true,
    rating: 4,
    ratingsBreakdown: {
      productQuality: 5,
      craftAuthenticity: 5,
      communication: 4,
    },
    productId: 'prod_dhokra_04',
    productTitle: 'Bastar Lost-Wax Cast Bell Metal Elephant',
    productImage: '/craft-thumbnails/cg-craft.svg',
    craft: 'Bastar Dhokra Metalwork',
    state: 'Chhattisgarh',
    reviewText:
      'Solid bell metal with an antique, tactile finish. Each spiral wire pattern is distinct. The artisan shipped it with a handwritten note explaining the Bastar motif.',
    date: '2026-08-26',
    helpfulCount: 6,
  },
];

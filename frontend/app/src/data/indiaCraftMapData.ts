import biharMadhubaniHeroJpg from '@/assets/craft-regions/bihar-madhubani-hero.jpg';
import catPotteryJpg from '@/assets/marketplace/craft-category-pottery.jpg';
import catTextilesJpg from '@/assets/marketplace/craft-category-textiles.jpg';
import catWoodcraftJpg from '@/assets/marketplace/craft-category-woodcraft.jpg';
import catMetalworkJpg from '@/assets/marketplace/craft-category-metalwork.jpg';
import catPaintingJpg from '@/assets/marketplace/craft-category-painting.jpg';
import catCaneJpg from '@/assets/marketplace/craft-category-cane.jpg';
import craftStoryLoomJpg from '@/assets/marketplace/craft-story-loom.jpg';

export interface RegionSource {
  title: string;
  url: string;
}

export interface RegionImage {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
}

export interface FeaturedCraft {
  name: string;
  shortDescription: string;
  image: RegionImage;
}

export interface CraftRegion {
  id: string;
  code: string;
  name: string;
  type: 'state' | 'union-territory';
  geographicRegion: string;
  introduction: string;
  heroImage: RegionImage;
  featuredCrafts: FeaturedCraft[];
  materials: string[];
  communities: string[];
  whyItMatters: string;
  sources: RegionSource[];

  // Legacy/Tooltip Compatibility fields
  region?: 'Northern' | 'Southern' | 'Eastern' | 'Western' | 'Central' | 'North-Eastern' | 'Island';
  cultureSummary?: string;
  hallmarkCraft?: string;
  cultureImage?: RegionImage;
  crafts?: string[];
  artisanTraditions?: string[];
}

export const INDIA_CRAFT_REGIONS: CraftRegion[] = [
  // =========================================================================
  // 28 STATES
  // =========================================================================
  {
    id: 'andhra-pradesh',
    code: 'AP',
    name: 'Andhra Pradesh',
    type: 'state',
    geographicRegion: 'Southern India',
    region: 'Southern',
    introduction: 'Renowned for centuries of master handloom weaving, freehand Kalamkari pen-work using natural vegetable dyes, and vibrant soft-wood toy carving.',
    cultureSummary: 'Renowned for centuries of master handloom weaving, freehand Kalamkari pen-work using natural vegetable dyes, and vibrant soft-wood toy carving.',
    hallmarkCraft: 'Srikalahasti Kalamkari & Kondapalli Toys',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Srikalahasti Kalamkari natural dye textile art and Kondapalli softwood toys',
      credit: 'Ministry of Textiles, Govt. of India',
      sourceUrl: 'http://www.handicrafts.nic.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Srikalahasti Kalamkari natural vegetable dye textile art and Kondapalli softwood toys',
    },
    featuredCrafts: [
      {
        name: 'Srikalahasti Kalamkari',
        shortDescription: 'Freehand pen-drawn mythological narratives using natural botanical dyes and milk treatments.',
        image: {
          src: catPaintingJpg,
          alt: 'Srikalahasti Kalamkari hand-drawn textile panel'
        }
      },
      {
        name: 'Kondapalli Softwood Toys',
        shortDescription: 'Lightweight figurines carved from Tella Poniki wood and finished with organic vegetable colors.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Kondapalli carved wooden dancing doll'
        }
      },
      {
        name: 'Uppada Jamdani Weaving',
        shortDescription: 'Translucent non-mechanical handloom silk sarees woven with intricate cotton and zari extra wefts.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Uppada Jamdani handloom silk saree'
        }
      }
    ],
    materials: ['Mulberry Silk', 'Cotton', 'Tella Poniki Softwood', 'Natural Vegetable Dyes'],
    communities: ['Srikalahasti Kalamkari Guilds', 'Kondapalli Woodcarvers', 'Uppada Jamdani Weavers'],
    whyItMatters: 'Preserves ancient hand-drawn Kalamkari and natural botanical mordant dyeing techniques passed down across temple artisan lineages.',
    sources: [
      { title: 'Development Commissioner (Handicrafts), Ministry of Textiles', url: 'http://www.handicrafts.nic.in' },
      { title: 'GI Registry of India - Andhra Pradesh', url: 'https://ipindia.gov.in' }
    ],
    crafts: ['Srikalahasti Kalamkari', 'Kondapalli Toys', 'Uppada Jamdani Silk Sarees', 'Mangalagiri Cotton Fabrics', 'Etikoppaka Lacquer Toys'],
    artisanTraditions: ['Sri Kalahasti Kalamkari Guilds', 'Kondapalli Woodcarver Communities', 'Uppada Jamdani Handloom Weavers']
  },
  {
    id: 'arunachal-pradesh',
    code: 'AR',
    name: 'Arunachal Pradesh',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'Rich indigenous tribal traditions encompassing Monpa wood carving, Apatani loin-loom geometric textiles, and intricate Wancho beadwork.',
    cultureSummary: 'Rich indigenous tribal traditions encompassing Monpa wood carving, Apatani loin-loom geometric textiles, and intricate Wancho beadwork.',
    hallmarkCraft: 'Monpa Wood Carving & Apatani Weaves',
    heroImage: {
      src: catWoodcraftJpg,
      alt: 'Monpa hand-carved ritual mask and Apatani geometric tribal textile',
      credit: 'NEHHDC',
      sourceUrl: 'https://nehhdc.com'
    },
    cultureImage: {
      src: catWoodcraftJpg,
      alt: 'Monpa hand-carved ritual mask and Apatani geometric textile',
    },
    featuredCrafts: [
      {
        name: 'Monpa Wood Carving & Masks',
        shortDescription: 'Sacred Himalayan masks chiseled from wild brier wood for traditional Buddhist cham dances.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Monpa hand-carved Buddhist mask'
        }
      },
      {
        name: 'Apatani Loin Loom Weaves',
        shortDescription: 'Distinctive striped cotton shawls hand-woven on portable back-strap loin looms.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Apatani geometric woven shawl'
        }
      },
      {
        name: 'Wancho Beadwork',
        shortDescription: 'Vibrant geometric headbands, necklaces, and baskets created with traditional glass beadwork.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Wancho tribal beadwork necklace'
        }
      }
    ],
    materials: ['Wild Brier Wood', 'Endemic Bamboo & Cane', 'Eri Silk', 'Cotton'],
    communities: ['Monpa Woodcarvers of Tawang', 'Apatani Women Weavers of Ziro', 'Wancho Bead Artisans of Longding'],
    whyItMatters: 'Sustains tribal ecological balance through sustainable bamboo harvesting and sacred Himalayan totem woodcarving.',
    sources: [
      { title: 'North Eastern Handicrafts and Handlooms Development Corporation', url: 'https://nehhdc.com' },
      { title: 'Department of Textile and Handicrafts, Govt of Arunachal Pradesh', url: 'http://textiles.arunachal.gov.in' }
    ],
    crafts: ['Monpa Wood Carving & Masks', 'Apatani Loin Loom Weaves', 'Wancho Wood Carving & Beadwork', 'Cane & Bamboo Utility Baskets'],
    artisanTraditions: ['Monpa Monastery Craftsmen', 'Apatani Women Weavers', 'Wancho Chieftain Woodcarvers']
  },
  {
    id: 'assam',
    code: 'AS',
    name: 'Assam',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'World-famous for wild golden Muga and white Eri peace silks, Sarthebari bell metal casting, and Majuli Island Vaishnavite sacred theatrical masks.',
    cultureSummary: 'World-famous for wild golden Muga and white Eri peace silks, Sarthebari bell metal casting, and Majuli Island Vaishnavite sacred theatrical masks.',
    hallmarkCraft: 'Golden Muga Silk & Sarthebari Bell Metal',
    heroImage: {
      src: craftStoryLoomJpg,
      alt: 'Assam Golden Muga silk handloom weaving and Sarthebari cast bell metal craft',
      credit: 'Directorate of Handloom & Textiles, Assam',
      sourceUrl: 'https://handloomtextiles.assam.gov.in'
    },
    cultureImage: {
      src: craftStoryLoomJpg,
      alt: 'Assam Golden Muga silk handloom weaving and Sarthebari cast bell metal craft',
    },
    featuredCrafts: [
      {
        name: 'Muga & Eri Silk Weaving',
        shortDescription: 'Lustrous golden endemic silk woven on wooden throw-shuttle looms in Sualkuchi.',
        image: {
          src: craftStoryLoomJpg,
          alt: 'Assam Muga silk handloom weaving'
        }
      },
      {
        name: 'Sarthebari Bell Metal',
        shortDescription: 'Hand-hammered bronze dining vessels and traditional cymbals crafted by hereditary coppersmiths.',
        image: {
          src: catMetalworkJpg,
          alt: 'Sarthebari beaten bell metal vessel'
        }
      },
      {
        name: 'Majuli Island Masks',
        shortDescription: 'Bamboo and clay theatrical masks worn during classical Bhaona performance epics.',
        image: {
          src: catPotteryJpg,
          alt: 'Majuli Vaishnavite bamboo theatre mask'
        }
      }
    ],
    materials: ['Golden Muga Silk', 'Eri Peace Silk', 'Bell Metal (Bronze Alloy)', 'River Silt Clay', 'Bamboo'],
    communities: ['Sualkuchi Weavers Guild', 'Sarthebari Bell Metal Artisans', 'Majuli Satra Theatrical Mask Masters'],
    whyItMatters: 'Home to Muga silk—the world’s strongest natural filament found only in the Brahmaputra valley—and ancient beaten bronze lineages.',
    sources: [
      { title: 'Directorate of Handloom & Textiles, Assam', url: 'https://handloomtextiles.assam.gov.in' },
      { title: 'Assam Silk Development Board', url: 'https://sericulture.assam.gov.in' }
    ],
    crafts: ['Muga & Eri Silk Weaving', 'Sarthebari Bell Metal Craft', 'Majuli Traditional Mask Making', 'Sitalpati Cool Reed Mats'],
    artisanTraditions: ['Sualkuchi Silk Weavers Cluster', 'Sarthebari Bell Metal Artisans', 'Majuli Mask Masters']
  },
  {
    id: 'bihar',
    code: 'BR',
    name: 'Bihar',
    type: 'state',
    geographicRegion: 'Eastern India',
    region: 'Eastern',
    introduction: 'Cradle of Mithila Madhubani painting, sacred golden Sikki grass craft, and historic Bhagalpuri Tussar silk weaving.',
    cultureSummary: 'Cradle of Mithila Madhubani painting, sacred golden Sikki grass craft, and historic Bhagalpuri Tussar silk weaving.',
    hallmarkCraft: 'Madhubani / Mithila Painting & Sikki Grass Craft',
    heroImage: {
      src: biharMadhubaniHeroJpg,
      alt: 'Mithila artisan in Bihar hand-painting intricate Madhubani tree of life with natural pigments',
      credit: 'KarigarSaathi Documentation Initiative',
      sourceUrl: 'https://karigarsaathi.in'
    },
    cultureImage: {
      src: biharMadhubaniHeroJpg,
      alt: 'Mithila artisan in Bihar hand-painting intricate Madhubani tree of life with natural pigments',
    },
    featuredCrafts: [
      {
        name: 'Madhubani Painting',
        shortDescription: 'Narrative folk painting made with natural pigments, rice paste and fine linework.',
        image: {
          src: biharMadhubaniHeroJpg,
          alt: 'Mithila Madhubani painting on handmade paper'
        }
      },
      {
        name: 'Sikki Grass Craft',
        shortDescription: 'Golden wild river grass hand-coiled into decorative storage containers and ritual figurines.',
        image: {
          src: catCaneJpg,
          alt: 'Hand-woven golden Sikki grass basket'
        }
      },
      {
        name: 'Bhagalpuri Tussar Silk',
        shortDescription: 'Organic textured wild silk spun and hand-woven on traditional pit looms.',
        image: {
          src: catTextilesJpg,
          alt: 'Bhagalpuri handspun Tussar silk saree'
        }
      }
    ],
    materials: ['Natural Botanical Pigments', 'Rice Paste', 'Sikki Grass', 'Tussar Wild Silk'],
    communities: ['Mithila Women Artist Collectives', 'Sikki Craft Groups', 'Bhagalpur Master Silk Weavers'],
    whyItMatters: 'Preserves centuries of matriarchal storytelling, oral epics, and ecological harmony through handmade narrative art.',
    sources: [
      { title: 'Upendra Maharathi Shilp Anusandhan Sansthan, Patna', url: 'http://umshilp.bihar.gov.in' },
      { title: 'GI Registry of India - Bihar', url: 'https://ipindia.gov.in' }
    ],
    crafts: ['Madhubani / Mithila Painting', 'Bhagalpuri Tussar Silk', 'Sikki Grass Golden Fibre Craft', 'Sujani Kantha Embroidery', 'Tikuli Art on Enamel Wood'],
    artisanTraditions: ['Mithila Women Artist Collectives (Madhubani & Ranti)', 'Bhagalpur Master Silk Weavers', 'Madhubani Sikki Grass Crafts Groups']
  },
  {
    id: 'chhattisgarh',
    code: 'CG',
    name: 'Chhattisgarh',
    type: 'state',
    geographicRegion: 'Central India',
    region: 'Central',
    introduction: 'Epicenter of Bastar tribal metal casting using ancient lost-wax techniques, hand-chiseled wrought iron, and organic terracotta votives.',
    cultureSummary: 'Epicenter of Bastar tribal metal casting using ancient lost-wax techniques, hand-chiseled wrought iron, and organic terracotta votives.',
    hallmarkCraft: 'Bastar Dhokra & Wrought Iron Metalwork',
    heroImage: {
      src: catPotteryJpg,
      alt: 'Bastar Dhokra bell metal casting and wrought iron animal sculpture',
      credit: 'Chhattisgarh Handicrafts Development Board',
      sourceUrl: 'http://chhattisgarhhandicrafts.com'
    },
    cultureImage: {
      src: catMetalworkJpg,
      alt: 'Bastar Dhokra bell metal casting and wrought iron animal sculpture',
    },
    featuredCrafts: [
      {
        name: 'Bastar Dhokra Metalwork',
        shortDescription: 'Ancient lost-wax bell metal casting using natural beeswax cords and clay molds.',
        image: {
          src: catPotteryJpg,
          alt: 'Bastar Dhokra cast brass elephant'
        }
      },
      {
        name: 'Loha Shilp Wrought Iron',
        shortDescription: 'Hand-hammered recycled iron crafted by blacksmiths without welding.',
        image: {
          src: catPotteryJpg,
          alt: 'Hand-hammered wrought iron deer'
        }
      },
      {
        name: 'Bastar Terracotta',
        shortDescription: 'Hollow, unglazed votive pottery sculpted by hand for village deities and shrines.',
        image: {
          src: catPotteryJpg,
          alt: 'Bastar ritual terracotta horse'
        }
      }
    ],
    materials: ['Bell Metal Brass', 'Recycled Iron', 'Natural Beeswax', 'River Clay'],
    communities: ['Ghadwa Lost-Wax Casting Guilds', 'Lohar Blacksmiths', 'Kumhar Potters of Bastar'],
    whyItMatters: 'Preserves the unbroken 4,000-year-old lost-wax casting technique traced directly to the Indus Valley civilization.',
    sources: [
      { title: 'Chhattisgarh Handicrafts Development Board (Shabari)', url: 'http://chhattisgarhhandicrafts.com' }
    ],
    crafts: ['Bastar Dhokra Bell Metal', 'Bastar Wrought Iron (Loha Shilp)', 'Bastar Terracotta', 'Kosa Wild Silk Weaving'],
    artisanTraditions: ['Ghadwa Caste Metalsmiths', 'Lohar Blacksmiths of Bastar', 'Kosa Silk Weavers of Champa']
  },
  {
    id: 'goa',
    code: 'GA',
    name: 'Goa',
    type: 'state',
    geographicRegion: 'Western India',
    region: 'Western',
    introduction: 'Distinctive coastal craft heritage blending indigenous Konkan terracotta, coconut shell carving, and Portuguese-influenced Azulejos ceramic tilework.',
    cultureSummary: 'Distinctive coastal craft heritage blending indigenous Konkan terracotta, coconut shell carving, and Portuguese-influenced Azulejos ceramic tilework.',
    hallmarkCraft: 'Kunbi Handloom & Coconut Shell Carving',
    heroImage: {
      src: catPotteryJpg,
      alt: 'Goan Kunbi handloom saree with checked weave and carved coconut craft',
      credit: 'Goa Handicrafts Rural & Small Scale Industries Development Corp',
      sourceUrl: 'https://goahandicrafts.com'
    },
    cultureImage: {
      src: catWoodcraftJpg,
      alt: 'Goan Kunbi handloom saree with checked weave and carved coconut craft',
    },
    featuredCrafts: [
      {
        name: 'Kunbi Saree Weaving',
        shortDescription: 'Tribal red-and-white checked cotton sarees traditionally dyed using wild plant extracts.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Kunbi checked cotton saree'
        }
      },
      {
        name: 'Coconut Shell Carving',
        shortDescription: 'Utilitarian bowls, spoons, and lamps hand-carved and polished from dried coconut shells.',
        image: {
          src: catPaintingJpg,
          alt: 'Carved coconut shell bowl'
        }
      },
      {
        name: 'Azulejos Tile Painting',
        shortDescription: 'Hand-painted glazed ceramic tiles carrying Indo-Portuguese botanical and coastal motifs.',
        image: {
          src: catPotteryJpg,
          alt: 'Hand-painted Goan ceramic tile'
        }
      }
    ],
    materials: ['Unbleached Cotton', 'Mature Coconut Shells', 'Local Red Terracotta', 'Ceramic Glazes'],
    communities: ['Kunbi Tribal Weavers of Quepem', 'Bicholim Potter Communities', 'Coastal Coconut Carvers'],
    whyItMatters: 'Preserves indigenous agricultural tribal textiles revived from near-extinction and sustainable coastal craft practices.',
    sources: [
      { title: 'Goa Handicrafts Rural & Small Scale Industries Development Corp', url: 'https://goahandicrafts.com' }
    ],
    crafts: ['Kunbi Cotton Saree Weaving', 'Coconut Shell Craft', 'Azulejos Glazed Tiles', 'Bicholim Brass Metalware'],
    artisanTraditions: ['Kunbi Tribal Weavers', 'Bicholim Metalsmiths', 'Konkan Shell Craftsmen']
  },
  {
    id: 'gujarat',
    code: 'GJ',
    name: 'Gujarat',
    type: 'state',
    geographicRegion: 'Western India',
    region: 'Western',
    introduction: 'A vibrant global hub of textile mastery, home to double-Ikat Patola, castor oil Rogan art, and intricate Kutchi mirrorwork embroidery.',
    cultureSummary: 'A vibrant global hub of textile mastery, home to double-Ikat Patola, castor oil Rogan art, and intricate Kutchi mirrorwork embroidery.',
    hallmarkCraft: 'Patan Patola & Kutch Rogan Painting',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Patan double-ikat Patola weave and Kutch Rogan art castor oil painting',
      credit: 'Gujarat State Handloom and Handicrafts Development Corp',
      sourceUrl: 'https://gurjari.gujarat.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Patan double-ikat Patola weave and Kutch Rogan art castor oil painting',
    },
    featuredCrafts: [
      {
        name: 'Patan Patola Double Ikat',
        shortDescription: 'Mathematically aligned silk sarees where warp and weft are both tie-dyed before weaving.',
        image: {
          src: catPaintingJpg,
          alt: 'Patan Patola double ikat silk weave'
        }
      },
      {
        name: 'Rogan Art of Nirona',
        shortDescription: 'Intricate patterns painted with thick castor oil pigment paste using a metal stylus without touching cloth.',
        image: {
          src: catPaintingJpg,
          alt: 'Kutch Rogan art fabric panel'
        }
      },
      {
        name: 'Kutch Rabari & Mutwa Embroidery',
        shortDescription: 'Fine needlework combining tiny mirrors, herringbone stitches, and geometric silk borders.',
        image: {
          src: catPaintingJpg,
          alt: 'Kutch hand embroidery with mirrors'
        }
      }
    ],
    materials: ['Mulberry Silk', 'Boiled Castor Oil Paste', 'Natural Mineral Pigments', 'Convex Mirrors'],
    communities: ['Salvi Master Patola Weavers', 'Khatri Rogan Artisans of Nirona', 'Rabari & Mutwa Women Embroiderers'],
    whyItMatters: 'Preserves the world’s most intricate mathematical double-ikat weaving and unique rare oil painting techniques.',
    sources: [
      { title: 'Gujarat State Handloom and Handicrafts Development Corp (Garvi Gurjari)', url: 'https://gurjari.gujarat.gov.in' }
    ],
    crafts: ['Patan Patola Double Ikat', 'Rogan Art Painting', 'Kutch Mirrorwork Embroidery', 'Ajrakh Block Printing', 'Bandhani Tie-Dye'],
    artisanTraditions: ['Salvi Patola Guild', 'Khatri Rogan Family', 'Ajrakhpur Block Printers']
  },
  {
    id: 'haryana',
    code: 'HR',
    name: 'Haryana',
    type: 'state',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Celebrated for heavy winter Panipat durries, traditional hand-beaten Rewari brassware, and rustic Sarkanda grass basketry.',
    cultureSummary: 'Celebrated for heavy winter Panipat durries, traditional hand-beaten Rewari brassware, and rustic Sarkanda grass basketry.',
    hallmarkCraft: 'Panipat Handloom Durries & Rewari Brassware',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Panipat geometric woven durrie rug and hand-beaten Rewari brass jug',
      credit: 'Department of Industries and Commerce, Haryana',
      sourceUrl: 'https://haryanaindustries.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Panipat geometric woven durrie rug and hand-beaten Rewari brass jug',
    },
    featuredCrafts: [
      {
        name: 'Panipat Handloom Durries',
        shortDescription: 'Heavy-duty cotton and wool floor coverings woven on horizontal pit looms with geometric motifs.',
        image: {
          src: catMetalworkJpg,
          alt: 'Panipat woven cotton durrie'
        }
      },
      {
        name: 'Rewari Hand-Beaten Brassware',
        shortDescription: 'Seamless cooking and serving vessels hand-beaten and shaped by traditional coppersmiths.',
        image: {
          src: catMetalworkJpg,
          alt: 'Rewari traditional brass vessel'
        }
      },
      {
        name: 'Sarkanda Grass Craft',
        shortDescription: 'Eco-friendly stools (moorhas) and storage baskets woven from wild perennial wetland grass.',
        image: {
          src: catMetalworkJpg,
          alt: 'Handmade Sarkanda grass stool'
        }
      }
    ],
    materials: ['Coarse Cotton & Recycled Wool', 'Brass Alloy', 'Wild Sarkanda Reeds', 'Hemp Fibre'],
    communities: ['Panipat Master Loom Weavers', 'Thathera Coppersmiths of Rewari', 'Farrukhnagar Basketry Clusters'],
    whyItMatters: 'Anchors northern India’s sustainable recycled yarn weaving economy and heritage metal beating traditions.',
    sources: [
      { title: 'Department of Industries and Commerce, Haryana', url: 'https://haryanaindustries.gov.in' }
    ],
    crafts: ['Panipat Handloom Durries', 'Rewari Hand-Beaten Brassware', 'Sarkanda Wetland Grass Stools', 'Jhajjar Clay Pottery'],
    artisanTraditions: ['Panipat Durrie Guilds', 'Rewari Thatheras', 'Farrukhnagar Reed Weavers']
  },
  {
    id: 'himachal-pradesh',
    code: 'HP',
    name: 'Himachal Pradesh',
    type: 'state',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Mountain craft sanctuary celebrated for geometric Kullu shawls, two-sided Chamba Rumal miniature needlework, and Kangra miniature paintings.',
    cultureSummary: 'Mountain craft sanctuary celebrated for geometric Kullu shawls, two-sided Chamba Rumal miniature needlework, and Kangra miniature paintings.',
    hallmarkCraft: 'Kullu Shawls & Chamba Rumal Needlework',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Kullu geometric border woollen shawl and Chamba Rumal double-sided silk embroidery',
      credit: 'Himachal Pradesh State Handicrafts and Handloom Corp (HIMKRAFT)',
      sourceUrl: 'https://himkraft.hp.gov.in'
    },
    cultureImage: {
      src: catTextilesJpg,
      alt: 'Kullu geometric border woollen shawl and Chamba Rumal double-sided silk embroidery',
    },
    featuredCrafts: [
      {
        name: 'Kullu & Kinnauri Shawls',
        shortDescription: 'Fine mountain wool shawls featuring vibrant dovetail-joint geometric patterned borders.',
        image: {
          src: catTextilesJpg,
          alt: 'Kullu patterned wool shawl'
        }
      },
      {
        name: 'Chamba Rumal Needlework',
        shortDescription: 'Double-sided silk embroidery creating identical pictorial mythological scenes on front and back.',
        image: {
          src: catTextilesJpg,
          alt: 'Chamba Rumal silk embroidered coverlet'
        }
      },
      {
        name: 'Kangra Miniature Painting',
        shortDescription: 'Delicate Pahari court miniature paintings made with natural stone pigments and fine squirrel hair brushes.',
        image: {
          src: catPaintingJpg,
          alt: 'Kangra Pahari miniature painting'
        }
      }
    ],
    materials: ['Indigenous Sheep Wool', 'Pashmina Fleece', 'Untwisted Silk Floss', 'Handmade Sialkot Paper'],
    communities: ['Kullu Valley Weaver Cooperatives', 'Chamba Women Needlework Guilds', 'Kangra Pahari Painters'],
    whyItMatters: 'Preserves the rare dorukha (double-sided) embroidery and high-altitude Himalayan weaving lineages.',
    sources: [
      { title: 'Himachal Pradesh State Handicrafts and Handloom Corp (HIMKRAFT)', url: 'https://himkraft.hp.gov.in' }
    ],
    crafts: ['Kullu & Kinnauri Woollen Shawls', 'Chamba Rumal Double-Sided Embroidery', 'Kangra Pahari Miniature Painting', 'Chamba Chappal Leatherwork'],
    artisanTraditions: ['Bhutti Weavers Cooperative', 'Chamba Embroidery Circles', 'Pahari Miniature Lineages']
  },
  {
    id: 'jharkhand',
    code: 'JH',
    name: 'Jharkhand',
    type: 'state',
    geographicRegion: 'Eastern India',
    region: 'Eastern',
    introduction: 'Tribal heartland recognized for sacred Sohrai and Khovar mud mural art, lost-wax Malhor bell metal, and handspun Kuchai wild silk.',
    cultureSummary: 'Tribal heartland recognized for sacred Sohrai and Khovar mud mural art, lost-wax Malhor bell metal, and handspun Kuchai wild silk.',
    hallmarkCraft: 'Sohrai-Khovar Painting & Kuchai Silk',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Sohrai tribal mud wall art with animal silhouettes and Kuchai wild silk yarn',
      credit: 'Jharkhand Silk, Textile and Handicraft Development Corp (JHARCRAFT)',
      sourceUrl: 'https://jharcraft.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Sohrai tribal mud wall art with animal silhouettes and Kuchai wild silk yarn',
    },
    featuredCrafts: [
      {
        name: 'Sohrai & Khovar Painting',
        shortDescription: 'Mural painting using black manganese earth and white kaolin clay to celebrate wildlife and marriage.',
        image: {
          src: catPotteryJpg,
          alt: 'Sohrai tribal animal painting'
        }
      },
      {
        name: 'Kuchai Wild Tussar Silk',
        shortDescription: 'Organic cocoons harvested sustainably from Arjun trees and woven on tribal pit looms.',
        image: {
          src: catPaintingJpg,
          alt: 'Kuchai handloom wild silk fabric'
        }
      },
      {
        name: 'Malhor Dhokra Metalcraft',
        shortDescription: 'Lost-wax bronze bells, lamps, and tribal deities cast using ancestral river clay cores.',
        image: {
          src: catPotteryJpg,
          alt: 'Malhor cast bell metal figure'
        }
      }
    ],
    materials: ['Natural Ochre & Kaolin Clay', 'Kuchai Tussar Silk', 'Brass Alloy', 'Bamboo'],
    communities: ['Sohrai & Khovar Women Painters of Hazaribagh', 'Kuchai Silk Weavers', 'Malhor Metalsmiths'],
    whyItMatters: 'Guards indigenous matrilineal eco-mural traditions celebrating the seasonal harvest and animal welfare.',
    sources: [
      { title: 'Jharkhand Silk, Textile and Handicraft Development Corp (JHARCRAFT)', url: 'https://jharcraft.in' }
    ],
    crafts: ['Sohrai & Khovar Mural Painting', 'Kuchai Organic Tussar Silk', 'Malhor Dhokra Metalwork', 'Bamboo Tribal Baskets'],
    artisanTraditions: ['Hazaribagh Women Artists', 'Santhal & Oraon Weavers', 'Malhor Casting Clusters']
  },
  {
    id: 'karnataka',
    code: 'KA',
    name: 'Karnataka',
    type: 'state',
    geographicRegion: 'Southern India',
    region: 'Southern',
    introduction: 'Heritage craft epicenter of natural lacquered Channapatna wooden toys, silver-inlaid Bidriware, Mysore Mulberry silk, and fragrant Sandalwood carving.',
    cultureSummary: 'Heritage craft epicenter of natural lacquered Channapatna wooden toys, silver-inlaid Bidriware, Mysore Mulberry silk, and fragrant Sandalwood carving.',
    hallmarkCraft: 'Channapatna Wooden Toys & Bidriware Inlay',
    heroImage: {
      src: catMetalworkJpg,
      alt: 'Channapatna lacquered wooden toy and Bidriware silver-inlaid zinc alloy vase',
      credit: 'Karnataka State Handicrafts Development Corp (Cauvery)',
      sourceUrl: 'https://cauveryhandicrafts.net'
    },
    cultureImage: {
      src: catMetalworkJpg,
      alt: 'Channapatna lacquered wooden toy and Bidriware silver-inlaid zinc alloy vase',
    },
    featuredCrafts: [
      {
        name: 'Channapatna Wooden Toys',
        shortDescription: 'Lathe-turned Wrightia tinctoria wood polished with non-toxic vegetable dyes and organic shellac.',
        image: {
          src: catMetalworkJpg,
          alt: 'Channapatna lacquered wooden toy'
        }
      },
      {
        name: 'Bidriware Silver Inlay',
        shortDescription: 'Zinc-copper alloy blackened with Bidar fort soil and chiseled with pure silver inlay wire.',
        image: {
          src: catMetalworkJpg,
          alt: 'Bidriware silver inlaid vase'
        }
      },
      {
        name: 'Mysore Mulberry Silk',
        shortDescription: 'Pure gold zari brocade silk sarees woven under strict state master standards.',
        image: {
          src: catMetalworkJpg,
          alt: 'Mysore silk zari border saree'
        }
      }
    ],
    materials: ['Ivory Wood (Wrightia Tinctoria)', 'Zinc-Copper Alloy', 'Pure Silver Wire', 'Mulberry Silk', 'Natural Shellac'],
    communities: ['Channapatna Toy Artisans', 'Bidar Bidri Craftsmen Guild', 'Mysore Silk Weaving Clusters'],
    whyItMatters: 'Combines non-toxic organic toy turning with centuries of royal Deccan silver inlay metallurgy.',
    sources: [
      { title: 'Karnataka State Handicrafts Development Corp (Cauvery)', url: 'https://cauveryhandicrafts.net' }
    ],
    crafts: ['Channapatna Wooden Toys & Lacquerware', 'Bidriware Silver Metal Inlay', 'Mysore Silk Sarees', 'Kinhal Decorative Wood Art', 'Ilkal Cotton-Silk Sarees'],
    artisanTraditions: ['Channapatna Lacquerware Artisans', 'Bidar Bidri Craftsmen Guild', 'Ilkal Handloom Weavers']
  },
  {
    id: 'kerala',
    code: 'KL',
    name: 'Kerala',
    type: 'state',
    geographicRegion: 'Southern India',
    region: 'Southern',
    introduction: 'Celebrated for metal alloy Aranmula Kannadi front-surface mirrors, Balaramapuram Kasavu gold-bordered cottons, and golden coir weaving.',
    cultureSummary: 'Celebrated for metal alloy Aranmula Kannadi front-surface mirrors, Balaramapuram Kasavu gold-bordered cottons, and golden coir weaving.',
    hallmarkCraft: 'Aranmula Metal Mirror & Kasavu Handlooms',
    heroImage: {
      src: catMetalworkJpg,
      alt: 'Aranmula cast metal reflective mirror and Balaramapuram Kasavu gold border cotton saree',
      credit: 'Directorate of Handlooms and Textiles, Kerala',
      sourceUrl: 'https://keralahandlooms.gov.in'
    },
    cultureImage: {
      src: catMetalworkJpg,
      alt: 'Aranmula cast metal reflective mirror and Balaramapuram Kasavu gold border cotton saree',
    },
    featuredCrafts: [
      {
        name: 'Aranmula Kannadi',
        shortDescription: 'Rare front-surface optical mirror cast from a secret copper-tin alloy without glass backing.',
        image: {
          src: catMetalworkJpg,
          alt: 'Aranmula metal mirror'
        }
      },
      {
        name: 'Balaramapuram Kasavu Weaves',
        shortDescription: 'Unbleached cream cotton fabrics woven with pure gold zari borders on traditional pit looms.',
        image: {
          src: catMetalworkJpg,
          alt: 'Kerala Kasavu gold border mundu'
        }
      },
      {
        name: 'Coconut Coir Craft',
        shortDescription: 'Durable floor coverings, ropes, and mats spun from retting coconut husk fibres.',
        image: {
          src: catMetalworkJpg,
          alt: 'Woven coconut coir mat'
        }
      }
    ],
    materials: ['Copper-Tin Mirror Alloy', 'Fine Unbleached Cotton', 'Pure Zari Wire', 'Coconut Husk Coir'],
    communities: ['Aranmula Vishwakarma Masters', 'Balaramapuram Weavers Guild', 'Alappuzha Coir Cooperatives'],
    whyItMatters: 'Home to the world’s only metallurgical front-surface mirror casting lineage and sustainable natural coir crafting.',
    sources: [
      { title: 'Kerala State Handicrafts Apex Co-operative Society (SURABHI)', url: 'https://surabhi.org' }
    ],
    crafts: ['Aranmula Metal Mirror (Kannadi)', 'Balaramapuram Kasavu Cotton Weaves', 'Coir Floor Mats', 'Bell Metal Uruli Casting', 'Nettur Petti Wooden Jewel Box'],
    artisanTraditions: ['Aranmula Mirror Guild', 'Balaramapuram Weavers', 'Mannar Bronze Casters']
  },
  {
    id: 'madhya-pradesh',
    code: 'MP',
    name: 'Madhya Pradesh',
    type: 'state',
    geographicRegion: 'Central India',
    region: 'Central',
    introduction: 'Heartland of sheer Chanderi and Maheshwari silk-cotton handlooms, Bagh botanical wooden block prints, and Gond tribal narrative paintings.',
    cultureSummary: 'Heartland of sheer Chanderi and Maheshwari silk-cotton handlooms, Bagh botanical wooden block prints, and Gond tribal narrative paintings.',
    hallmarkCraft: 'Chanderi Handloom & Bagh Block Print',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Chanderi translucent silk saree and Bagh botanical block printed textile',
      credit: 'Sant Ravidas MP Handicrafts and Handloom Development Corp (Mrignayanee)',
      sourceUrl: 'https://mrignayanee.com'
    },
    cultureImage: {
      src: catTextilesJpg,
      alt: 'Chanderi translucent silk saree and Bagh botanical block printed textile',
    },
    featuredCrafts: [
      {
        name: 'Chanderi Handloom Weaving',
        shortDescription: 'Featherlight translucent silk-cotton sarees woven with intricate gold zari butis.',
        image: {
          src: catTextilesJpg,
          alt: 'Chanderi handloom silk-cotton saree'
        }
      },
      {
        name: 'Bagh Block Print',
        shortDescription: 'Geometric red-and-black textile printing using river-washed wooden blocks and natural alizarin dyes.',
        image: {
          src: catPaintingJpg,
          alt: 'Bagh block printed fabric'
        }
      },
      {
        name: 'Gond Tribal Painting',
        shortDescription: 'Dot and fine line paintings depicting forest spirits, sacred trees, and wildlife.',
        image: {
          src: catPaintingJpg,
          alt: 'Gond tribal animal painting'
        }
      }
    ],
    materials: ['Fine Silk & Cotton', 'Teak Wood Carved Blocks', 'Natural Alizarin Dyes', 'River Bed Mud'],
    communities: ['Chanderi Master Weavers Guild', 'Khatri Bagh Block Printers', 'Gond Artist Collectives of Patangarh'],
    whyItMatters: 'Preserves royal Narmada river handloom techniques and indigenous tribal dot-and-line art systems.',
    sources: [
      { title: 'Sant Ravidas MP Handicrafts and Handloom Development Corp (Mrignayanee)', url: 'https://mrignayanee.com' }
    ],
    crafts: ['Chanderi Silk-Cotton Handloom', 'Maheshwari Sarees', 'Bagh Wooden Block Printing', 'Gond Tribal Painting', 'Bell Metal Tikamgarh'],
    artisanTraditions: ['Chanderi Weavers', 'Bagh Khatri Family', 'Gond Painters of Dindori']
  },
  {
    id: 'maharashtra',
    code: 'MH',
    name: 'Maharashtra',
    type: 'state',
    geographicRegion: 'Western India',
    region: 'Western',
    introduction: 'Home to royal Paithani peacock silk sarees, geometric Warli rice-paste tribal paintings, and handcrafted Kolhapuri leather footwear.',
    cultureSummary: 'Home to royal Paithani peacock silk sarees, geometric Warli rice-paste tribal paintings, and handcrafted Kolhapuri leather footwear.',
    hallmarkCraft: 'Paithani Silk Weaving & Warli Painting',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Paithani silk saree with peacock zari pallu and Warli tribal white rice-paste painting',
      credit: 'Maharashtra Small Scale Industries Development Corp (MSSIDC)',
      sourceUrl: 'https://mssidc.maharashtra.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Paithani silk saree with peacock zari pallu and Warli tribal white rice-paste painting',
    },
    featuredCrafts: [
      {
        name: 'Paithani Silk Sarees',
        shortDescription: 'Royal handloom sarees featuring tapestry-woven gold zari borders and polychrome peacock pallus.',
        image: {
          src: catPaintingJpg,
          alt: 'Paithani peacock zari pallu'
        }
      },
      {
        name: 'Warli Tribal Painting',
        shortDescription: 'Monochromatic ritual wall paintings made with rice flour paste on ochre cow dung mud backgrounds.',
        image: {
          src: catPaintingJpg,
          alt: 'Warli tribal spiral dance painting'
        }
      },
      {
        name: 'Kolhapuri Footwear',
        shortDescription: 'Vegetable-tanned leather footwear braided and stitched entirely with leather cords without nails.',
        image: {
          src: catPaintingJpg,
          alt: 'Handcrafted Kolhapuri leather sandal'
        }
      }
    ],
    materials: ['Mulberry Silk', 'Pure Silver-Gold Zari', 'Rice Flour Paste', 'Vegetable Tanned Leather', 'Red Ochre Mud'],
    communities: ['Yeola & Paithan Weavers Guilds', 'Warli Tribal Artists of Dahanu', 'Kolhapur Master Cobblers'],
    whyItMatters: 'Maintains ancient Western Ghats tribal ritual murals and centuries of Maratha royal silk tapestry weaving.',
    sources: [
      { title: 'Maharashtra Small Scale Industries Development Corp (MSSIDC)', url: 'https://mssidc.maharashtra.gov.in' }
    ],
    crafts: ['Paithani Handloom Silk Weaving', 'Warli Tribal Painting', 'Kolhapuri Handcrafted Leather Chappals', 'Sawantwadi Lacquerware', 'Himroo Brocade'],
    artisanTraditions: ['Yeola Paithani Weavers', 'Warli Tribal Artists', 'Kolhapur Chappal Clusters']
  },
  {
    id: 'manipur',
    code: 'MN',
    name: 'Manipur',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'Distinctive craft realm celebrated for wheel-less Longpi black stone pottery, fine Kauna wetland reed basketry, and royal Shaphee Lanphee embroidered shawls.',
    cultureSummary: 'Distinctive craft realm celebrated for wheel-less Longpi black stone pottery, fine Kauna wetland reed basketry, and royal Shaphee Lanphee embroidered shawls.',
    hallmarkCraft: 'Longpi Black Pottery & Kauna Reed Craft',
    heroImage: {
      src: catPotteryJpg,
      alt: 'Longpi black serpentinite stone cooking pot and woven Kauna wetland reed bag',
      credit: 'Manipur Handlooms and Handicrafts Development Corp',
      sourceUrl: 'https://panthoibi.mn.gov.in'
    },
    cultureImage: {
      src: catCaneJpg,
      alt: 'Longpi black serpentinite stone cooking pot and woven Kauna wetland reed bag',
    },
    featuredCrafts: [
      {
        name: 'Longpi Black Pottery',
        shortDescription: 'Wheel-less cookware shaped by hand from crushed black serpentinite stone and weathered clay.',
        image: {
          src: catPotteryJpg,
          alt: 'Longpi black stone teapot'
        }
      },
      {
        name: 'Kauna Wetland Reed Basketry',
        shortDescription: 'Flexible cushions, bags, and mats woven from water-resistant natural wetland reeds.',
        image: {
          src: catCaneJpg,
          alt: 'Woven Kauna reed tote bag'
        }
      },
      {
        name: 'Shaphee Lanphee Shawls',
        shortDescription: 'Traditional ceremonial shawls hand-embroidered with mythical motifs on black handspun cotton.',
        image: {
          src: catCaneJpg,
          alt: 'Shaphee Lanphee embroidered shawl'
        }
      }
    ],
    materials: ['Serpentinite Stone & Clay', 'Kauna Wetland Reeds', 'Handspun Cotton', 'Bamboo'],
    communities: ['Tangkhul Naga Potters of Longpi', 'Kauna Reed Weavers of Thoubal', 'Meitei Women Embroiderers'],
    whyItMatters: 'Preserves the world’s rare wheel-less stone metallurgy cookware and zero-waste wetland reed weaving.',
    sources: [
      { title: 'Manipur Handlooms and Handicrafts Development Corp (Panthoibi)', url: 'https://panthoibi.mn.gov.in' }
    ],
    crafts: ['Longpi Serpentinite Black Pottery', 'Kauna Reed Craft', 'Shaphee Lanphee Shawl Embroidery', 'Wangkhei Phee Transparent Weaving'],
    artisanTraditions: ['Longpi Tangkhul Potters', 'Kauna Wetland Weavers', 'Imphal Handloom Guilds']
  },
  {
    id: 'meghalaya',
    code: 'ML',
    name: 'Meghalaya',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'Abode of the clouds celebrated for cool water-resistant Sitalpati mats, organic Eri peace silk, and intricate Khasi cane and bamboo knits.',
    cultureSummary: 'Abode of the clouds celebrated for cool water-resistant Sitalpati mats, organic Eri peace silk, and intricate Khasi cane and bamboo knits.',
    hallmarkCraft: 'Ryndia (Eri Silk) & Khasi Bamboo Weaves',
    heroImage: {
      src: catCaneJpg,
      alt: 'Ryndia hand-spun organic Eri peace silk shawl and Khasi conical cane rain shield (Knup)',
      credit: 'Department of Commerce and Industries, Meghalaya',
      sourceUrl: 'https://megindustry.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Ryndia hand-spun organic Eri peace silk shawl and Khasi conical cane rain shield (Knup)',
    },
    featuredCrafts: [
      {
        name: 'Ryndia Eri Peace Silk',
        shortDescription: 'Non-violent wild silk spun without boiling the moth and naturally dyed with turmeric and iron.',
        image: {
          src: catCaneJpg,
          alt: 'Ryndia organic Eri silk scarf'
        }
      },
      {
        name: 'Khasi Bamboo Rain Shields (Knup)',
        shortDescription: 'Waterproof conical rain shields woven with layers of broad forest leaves and fine cane mesh.',
        image: {
          src: catPotteryJpg,
          alt: 'Khasi bamboo rain shield'
        }
      },
      {
        name: 'Larnai Black Clay Pottery',
        shortDescription: 'Hand-sculpted earthenware made from local dark clay and seasoned with wild plant wash.',
        image: {
          src: catPotteryJpg,
          alt: 'Larnai black clay earthen pot'
        }
      }
    ],
    materials: ['Eri Peace Silk', 'Forest Cane & Bamboo', 'Wild Botanical Dyes', 'Larnai Black Clay'],
    communities: ['Ri-Bhoi Women Eri Silk Spinners', 'Khasi & Jaintia Cane Weavers', 'Larnai Clay Potters'],
    whyItMatters: 'Preserves non-violent Ahimsa silk traditions and rainwater-resistant rainforest plant architecture.',
    sources: [
      { title: 'Department of Commerce and Industries, Meghalaya', url: 'https://megindustry.gov.in' }
    ],
    crafts: ['Ryndia Eri Silk Weaving', 'Khasi & Garo Bamboo Craft', 'Larnai Black Pottery', 'Cane Stools & Mats'],
    artisanTraditions: ['Ri-Bhoi Silk Women Weavers', 'Jaintia Hill Cane Artisans', 'Larnai Potters']
  },
  {
    id: 'mizoram',
    code: 'MZ',
    name: 'Mizoram',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'Mountain state renowned for sacred Puan handloom textiles with symbolic linear motifs, and master-level bamboo basketry.',
    cultureSummary: 'Mountain state renowned for sacred Puan handloom textiles with symbolic linear motifs, and master-level bamboo basketry.',
    hallmarkCraft: 'Puan Handloom Weaving & Bamboo Baskets',
    heroImage: {
      src: catCaneJpg,
      alt: 'Mizo Puanchei ceremonial handloom skirt and woven bamboo Thul basket',
      credit: 'Commerce and Industries Department, Mizoram',
      sourceUrl: 'https://industries.mizoram.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Mizo Puanchei ceremonial handloom skirt and woven bamboo Thul basket',
    },
    featuredCrafts: [
      {
        name: 'Puanchei & Ngotekherh Weaves',
        shortDescription: 'Traditional ceremonial handloom wraps woven on loin looms with striking red, white, and black stripes.',
        image: {
          src: catCaneJpg,
          alt: 'Mizo Puanchei woven textile'
        }
      },
      {
        name: 'Mizo Thul Storage Baskets',
        shortDescription: 'Double-walled woven bamboo baskets with close-fitting conical lids used for heirloom storage.',
        image: {
          src: catCaneJpg,
          alt: 'Mizo Thul woven bamboo basket'
        }
      },
      {
        name: 'Bamboo Smoking Pipes & Hats',
        shortDescription: 'Intricately turned and carved bamboo pipes and woven sun hats crafted from hill bamboo.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Mizo hand-carved bamboo craft'
        }
      }
    ],
    materials: ['Handspun Cotton', 'Seasoned Hill Bamboo', 'Forest Cane', 'Natural Indigo & Madder Dyes'],
    communities: ['Mizo Women Loin Loom Weavers', 'Aizawl Bamboo Craftsmen Guild', 'Thenzawl Handloom Clusters'],
    whyItMatters: 'Maintains ancient matrilineal loin-loom textile motifs and sustainable bamboo forestry practices.',
    sources: [
      { title: 'Commerce and Industries Department, Mizoram (ZOHANDCO)', url: 'https://industries.mizoram.gov.in' }
    ],
    crafts: ['Puanchei & Ngotekherh Handloom Weaving', 'Mizo Bamboo Basketry (Thul)', 'Cane Mats & Headgear'],
    artisanTraditions: ['Thenzawl Handloom Weavers', 'Aizawl Bamboo Artisans', 'Lunglei Cane Craft Guilds']
  },
  {
    id: 'nagaland',
    code: 'NL',
    name: 'Nagaland',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'Highland tribal territory celebrated for bold symbolic Naga warrior shawls, Konyak wood carving, and natural stinging nettle fibre spinning.',
    cultureSummary: 'Highland tribal territory celebrated for bold symbolic Naga warrior shawls, Konyak wood carving, and natural stinging nettle fibre spinning.',
    hallmarkCraft: 'Naga Tribal Shawls & Konyak Wood Carving',
    heroImage: {
      src: catWoodcraftJpg,
      alt: 'Angami Naga red-and-black warrior shawl and Konyak hand-carved ceremonial wooden sculpture',
      credit: 'Directorate of Industries and Commerce, Nagaland',
      sourceUrl: 'https://industry.nagaland.gov.in'
    },
    cultureImage: {
      src: catWoodcraftJpg,
      alt: 'Angami Naga red-and-black warrior shawl and Konyak hand-carved ceremonial wooden sculpture',
    },
    featuredCrafts: [
      {
        name: 'Naga Tribal Shawls',
        shortDescription: 'Back-strap loin loom textiles featuring distinct clan emblems, hornbill motifs, and extra weft embroidery.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Naga tribal handwoven shawl'
        }
      },
      {
        name: 'Konyak Wood Carving',
        shortDescription: 'Expressive clan totems, doors, and smoking pipes chiseled from seasoned solid timber.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Konyak hand-carved wooden sculpture'
        }
      },
      {
        name: 'Stinging Nettle (Liba) Weaving',
        shortDescription: 'Wild stinging nettle stalks retted, spun into coarse strong yarn, and hand-woven into durable cloth.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Natural nettle fibre cloth'
        }
      }
    ],
    materials: ['Wild Nettle Fibre', 'Cotton Yarn', 'Seasoned Hardwood', 'Glass Seed Beads', 'Natural Dyes'],
    communities: ['Angami & Ao Women Weavers', 'Konyak Master Woodcarvers of Mon', 'Chakhesang Nettle Craftsmen'],
    whyItMatters: 'Guards indigenous back-strap loom weaving lineages and sustainable wild nettle harvesting without synthetic chemicals.',
    sources: [
      { title: 'Nagaland Handloom & Handicrafts Development Corp (NHHDC)', url: 'https://industry.nagaland.gov.in' }
    ],
    crafts: ['Naga Tribal Shawls (Chakhesang, Angami, Ao)', 'Konyak Wood Carving', 'Nettle Fibre Textile Weaving', 'Cane & Bamboo Baskets'],
    artisanTraditions: ['Konyak Woodcarvers of Mon', 'Chakhesang Women Weavers', 'Angami Loin Loom Masters']
  },
  {
    id: 'odisha',
    code: 'OD',
    name: 'Odisha',
    type: 'state',
    geographicRegion: 'Eastern India',
    region: 'Eastern',
    introduction: 'Rich coastal craft center celebrated for Raghurajpur miniature Pattachitra paintings, Cuttack silver filigree (Tarakasi), and Sambalpuri Ikat textiles.',
    cultureSummary: 'Rich coastal craft center celebrated for Raghurajpur miniature Pattachitra paintings, Cuttack silver filigree (Tarakasi), and Sambalpuri Ikat textiles.',
    hallmarkCraft: 'Pattachitra Painting & Cuttack Silver Filigree',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Raghurajpur artisan painting fine Pattachitra line work on silk canvas',
      credit: 'Directorate of Textiles and Handicrafts, Odisha',
      sourceUrl: 'https://textiles.odisha.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Raghurajpur artisan painting fine Pattachitra line work on silk canvas',
    },
    featuredCrafts: [
      {
        name: 'Raghurajpur Pattachitra',
        shortDescription: 'Intricate temple scroll paintings made with stone mineral pigments on tamarind-treated silk canvas.',
        image: {
          src: catPaintingJpg,
          alt: 'Pattachitra miniature scroll painting'
        }
      },
      {
        name: 'Cuttack Silver Filigree (Tarakasi)',
        shortDescription: 'Delicate lace-like ornaments fashioned from hair-thin pure silver wires without cast molds.',
        image: {
          src: catPaintingJpg,
          alt: 'Cuttack Tarakasi silver filigree'
        }
      },
      {
        name: 'Sambalpuri Bandha Ikat',
        shortDescription: 'Tie-and-dyed warp and weft silk and cotton sarees hand-woven with curved floral motifs.',
        image: {
          src: catTextilesJpg,
          alt: 'Sambalpuri Bandha handloom saree'
        }
      }
    ],
    materials: ['Treated Tussar Silk Canvas', 'Fine Silver Wire', 'Natural Stone Pigments', 'Mulberry Silk', 'Bell Metal'],
    communities: ['Chitrakar Artists of Raghurajpur', 'Cuttack Tarakasi Silversmiths', 'Bargarh Bandha Weavers'],
    whyItMatters: 'Preserves ancient Jagannath temple devotional scroll art and master wire filigree metallurgy.',
    sources: [
      { title: 'Directorate of Textiles and Handicrafts, Odisha (Utkalika)', url: 'https://utkalikaodisha.com' },
      { title: 'Boyanika - Odisha State Handloom Weavers Cooperative', url: 'https://boyanika.com' }
    ],
    crafts: ['Pattachitra Scroll Painting & Palm Leaf Inscription', 'Cuttack Silver Filigree (Tarakasi)', 'Sambalpuri Bandha Ikat', 'Pipili Applique Work', 'Bastar-Odisha Dhokra'],
    artisanTraditions: ['Raghurajpur Heritage Crafts Village', 'Cuttack Silversmiths Guild', 'Bargarh Weavers Cooperative']
  },
  {
    id: 'punjab',
    code: 'PB',
    name: 'Punjab',
    type: 'state',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Fertile northern hub renowned for vibrant Phulkari geometric silk floss embroidery, hand-beaten Jandiala Guru brass utensils, and leather juttis.',
    cultureSummary: 'Fertile northern hub renowned for vibrant Phulkari geometric silk floss embroidery, hand-beaten Jandiala Guru brass utensils, and leather juttis.',
    hallmarkCraft: 'Phulkari Embroidery & Jandiala Brassware',
    heroImage: {
      src: catMetalworkJpg,
      alt: 'Phulkari hand-embroidered geometric silk floral dupatta and Jandiala Guru brass utensil',
      credit: 'Punjab Small Industries and Export Corp (Phulkari)',
      sourceUrl: 'https://psiec.punjab.gov.in'
    },
    cultureImage: {
      src: catMetalworkJpg,
      alt: 'Phulkari hand-embroidered geometric silk floral dupatta and Jandiala Guru brass utensil',
    },
    featuredCrafts: [
      {
        name: 'Phulkari & Bagh Embroidery',
        shortDescription: 'Darning-stitch floral and geometric needlework embroidered on coarse Khaddar cotton with untwisted silk floss.',
        image: {
          src: catTextilesJpg,
          alt: 'Phulkari hand-embroidered dupatta'
        }
      },
      {
        name: 'Jandiala Guru Thathera Metalcraft',
        shortDescription: 'UNESCO-inscribed copper and brass vessels beaten and shaped by hand using traditional wooden mallets.',
        image: {
          src: catMetalworkJpg,
          alt: 'Jandiala Guru beaten brass pot'
        }
      },
      {
        name: 'Punjabi Jutti Footwear',
        shortDescription: 'Hand-stitched leather shoes embellished with fine metallic dabka, zari, and thread embroidery.',
        image: {
          src: catMetalworkJpg,
          alt: 'Embroidered Punjabi leather jutti'
        }
      }
    ],
    materials: ['Khaddar Handspun Cotton', 'Untwisted Pat Silk Floss', 'Brass & Copper Sheets', 'Tanned Leather'],
    communities: ['Phulkari Women Needlework Guilds', 'Thathera Coppersmiths of Jandiala Guru', 'Muktsar Jutti Artisans'],
    whyItMatters: 'Home to India’s only UNESCO-inscribed intangible cultural heritage craft of traditional copper and brass utensil making.',
    sources: [
      { title: 'Punjab Small Industries and Export Corp (Phulkari)', url: 'https://psiec.punjab.gov.in' }
    ],
    crafts: ['Phulkari & Bagh Needlework', 'Jandiala Guru UNESCO Brass Utensils', 'Punjabi Embroidered Juttis', 'Hoshiarpur Wooden Inlay'],
    artisanTraditions: ['Patiala & Amritsar Women Embroiderers', 'Jandiala Guru Thathera Guild', 'Muktsar Cobblers']
  },
  {
    id: 'rajasthan',
    code: 'RJ',
    name: 'Rajasthan',
    type: 'state',
    geographicRegion: 'Western India',
    region: 'Western',
    introduction: 'Celebrated craft epicenter of glazed Jaipur Blue Pottery, Bagru and Sanganer botanical block printing, and Molela votive terracotta plaques.',
    cultureSummary: 'Celebrated craft epicenter of glazed Jaipur Blue Pottery, Bagru and Sanganer botanical block printing, and Molela votive terracotta plaques.',
    hallmarkCraft: 'Jaipur Blue Pottery & Bagru Block Print',
    heroImage: {
      src: catPotteryJpg,
      alt: 'Jaipur cobalt glazed Blue Pottery urn and botanical ceramic craft',
      credit: 'Rajasthan Small Industries Corp (Rajasthali)',
      sourceUrl: 'https://rajasthali.gov.in'
    },
    cultureImage: {
      src: catPotteryJpg,
      alt: 'Jaipur cobalt glazed Blue Pottery urn and botanical ceramic craft',
    },
    featuredCrafts: [
      {
        name: 'Jaipur Blue Pottery',
        shortDescription: 'Clay-free ceramic formed from quartz stone and glass frit, hand-painted with cobalt oxide floral scrolls.',
        image: {
          src: catPotteryJpg,
          alt: 'Jaipur Blue Pottery urn'
        }
      },
      {
        name: 'Bagru & Sanganeri Block Print',
        shortDescription: 'Hand-carved wooden block textile printing using natural madder, indigo, and harda mordants.',
        image: {
          src: catTextilesJpg,
          alt: 'Bagru natural dye block print'
        }
      },
      {
        name: 'Molela Terracotta Plaques',
        shortDescription: 'Hollow, unglazed river clay panels sculpted by hand and sun-dried for tribal shrines.',
        image: {
          src: catPotteryJpg,
          alt: 'Molela votive clay plaque'
        }
      }
    ],
    materials: ['Crushed Quartz Stone', 'Glass Frit', 'Natural Plant Dyes', 'River Banas Clay', 'Teak Block Stamps'],
    communities: ['Kripal Kumbh Blue Pottery Masters', 'Chhipa Block Printers of Bagru', 'Molela Kumhar Sculptors'],
    whyItMatters: 'Preserves the world’s rare non-clay ceramic turning and desert botanical dyeing traditions.',
    sources: [
      { title: 'Rajasthan Small Industries Corp (Rajasthali)', url: 'https://rajasthali.gov.in' }
    ],
    crafts: ['Jaipur Blue Pottery', 'Bagru & Sanganeri Wooden Block Printing', 'Molela Votive Terracotta', 'Kota Doria Handloom Weaving', 'Thewa Gold-on-Glass Jewellery'],
    artisanTraditions: ['Chhipa Block Printing Community', 'Jaipur Blue Pottery Guild', 'Molela Terracotta Sculptors']
  },
  {
    id: 'sikkim',
    code: 'SK',
    name: 'Sikkim',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'Himalayan sanctuary of sacred Buddhist Thangka painting, Tibetan hand-knotted woollen carpets, and Lepcha back-strap handloom textiles.',
    cultureSummary: 'Himalayan sanctuary of sacred Buddhist Thangka painting, Tibetan hand-knotted woollen carpets, and Lepcha back-strap handloom textiles.',
    hallmarkCraft: 'Tibetan Thangka Painting & Hand-Knotted Carpets',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Sikkimese Buddhist Thangka scroll painting on silk and hand-knotted dragon wool carpet',
      credit: 'Directorate of Handicrafts and Handloom, Sikkim',
      sourceUrl: 'https://sikkim.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Sikkimese Buddhist Thangka scroll painting on silk and hand-knotted dragon wool carpet',
    },
    featuredCrafts: [
      {
        name: 'Buddhist Thangka Painting',
        shortDescription: 'Sacred scroll paintings depicting Buddhist deities rendered with crushed mineral pigments and gold dust on silk.',
        image: {
          src: catPaintingJpg,
          alt: 'Sikkim Buddhist Thangka scroll'
        }
      },
      {
        name: 'Hand-Knotted Tibetan Carpets',
        shortDescription: 'High-density pure sheep wool rugs knotted on vertical wooden looms with Buddhist cloud motifs.',
        image: {
          src: catPaintingJpg,
          alt: 'Hand-knotted wool carpet'
        }
      },
      {
        name: 'Lepcha Loin Loom Weaving',
        shortDescription: 'Indigenous geometric cotton and nettle cloth woven on portable loin looms by Lepcha women.',
        image: {
          src: catCaneJpg,
          alt: 'Lepcha handwoven textile'
        }
      }
    ],
    materials: ['Crushed Mineral Pigments', 'Pure Gold Dust', 'Tibetan Sheep Wool', 'Wild Nettle Fibre', 'Silk Brocade'],
    communities: ['Gangtok Thangka Masters', 'Bhutia Carpet Weaving Cooperatives', 'Lepcha Indigenous Weavers'],
    whyItMatters: 'Protects canonical Himalayan Buddhist iconographic painting rules and highland wool knotting arts.',
    sources: [
      { title: 'Directorate of Handicrafts and Handloom, Sikkim (DHH)', url: 'https://sikkim.gov.in' }
    ],
    crafts: ['Buddhist Thangka Painting', 'Tibetan Hand-Knotted Wool Carpets', 'Lepcha Back-Strap Weaving', 'Choktse Foldable Carved Wooden Tables'],
    artisanTraditions: ['DHH Gangtok Master Painters', 'Bhutia Carpet Guilds', 'Dzongu Lepcha Weavers']
  },
  {
    id: 'tamil-nadu',
    code: 'TN',
    name: 'Tamil Nadu',
    type: 'state',
    geographicRegion: 'Southern India',
    region: 'Southern',
    introduction: 'Ancient Dravidian craft cradle known for Kanchipuram heavy mulberry silk sarees, Swamimalai lost-wax bronze sculptures, and gold-leaf Tanjore paintings.',
    cultureSummary: 'Ancient Dravidian craft cradle known for Kanchipuram heavy mulberry silk sarees, Swamimalai lost-wax bronze sculptures, and gold-leaf Tanjore paintings.',
    hallmarkCraft: 'Kanchipuram Silk & Swamimalai Bronze Casting',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Kanchipuram gold zari silk saree and Swamimalai lost-wax cast bronze Nataraja',
      credit: 'Tamil Nadu Handicrafts Development Corp (Poompuhar)',
      sourceUrl: 'https://poompuhar.com'
    },
    cultureImage: {
      src: catMetalworkJpg,
      alt: 'Kanchipuram gold zari silk saree and Swamimalai lost-wax cast bronze Nataraja',
    },
    featuredCrafts: [
      {
        name: 'Kanchipuram Silk Sarees',
        shortDescription: 'Heavy mulberry silk sarees woven with interlocking korvai borders and pure gold zari threads.',
        image: {
          src: catMetalworkJpg,
          alt: 'Kanchipuram silk saree'
        }
      },
      {
        name: 'Swamimalai Bronze Casting',
        shortDescription: 'Lost-wax panchaloha bronze sculptures crafted following strict Chola canonical Shilpa Shastra proportions.',
        image: {
          src: catPaintingJpg,
          alt: 'Swamimalai lost-wax bronze sculpture'
        }
      },
      {
        name: 'Tanjore Painting',
        shortDescription: 'Devotional panel paintings embellished with 22-karat gold foil, Jaipur stones, and gesso relief work.',
        image: {
          src: catPaintingJpg,
          alt: 'Tanjore gold foil painting'
        }
      }
    ],
    materials: ['Mulberry Silk', 'Pure Gold Zari', 'Panchaloha 5-Metal Alloy', '22k Gold Foil', 'Teak Wood'],
    communities: ['Kanchipuram Master Weavers Guild', 'Swamimalai Sthapathy Sculptors', 'Thanjavur Traditional Painters'],
    whyItMatters: 'Preserves the millennium-old Chola lost-wax bronze casting lineages and temple gold foil iconography.',
    sources: [
      { title: 'Tamil Nadu Handicrafts Development Corp (Poompuhar)', url: 'https://poompuhar.com' },
      { title: 'Co-optex - Tamil Nadu Handloom Weavers Co-operative', url: 'https://cooptex.gov.in' }
    ],
    crafts: ['Kanchipuram Silk Saree Weaving', 'Swamimalai Bronze Icon Casting', 'Tanjore Gold Foil Painting', 'Pattamadai Korai Grass Mats', 'Toda Tribal Embroidery'],
    artisanTraditions: ['Kanchi Weavers Guild', 'Swamimalai Sthapathy Caste', 'Thanjavur Painting Lineages']
  },
  {
    id: 'telangana',
    code: 'TG',
    name: 'Telangana',
    type: 'state',
    geographicRegion: 'Southern India',
    region: 'Southern',
    introduction: 'Deccan textile and metal sanctuary home to Pochampally geometric Ikat, scroll-like Cheriyal narrative paintings, and silver filigree of Karimnagar.',
    cultureSummary: 'Deccan textile and metal sanctuary home to Pochampally geometric Ikat, scroll-like Cheriyal narrative paintings, and silver filigree of Karimnagar.',
    hallmarkCraft: 'Pochampally Ikat & Cheriyal Scroll Painting',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Pochampally geometric tie-dye Ikat silk saree and Cheriyal narrative scroll painting',
      credit: 'Telangana State Handicrafts Development Corp (Golconda)',
      sourceUrl: 'https://tshdc.telangana.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Pochampally geometric tie-dye Ikat silk saree and Cheriyal narrative scroll painting',
    },
    featuredCrafts: [
      {
        name: 'Pochampally Ikat (Tie-and-Dye)',
        shortDescription: 'Geometric dyed patterns created by aligning tie-dyed silk threads with mathematical precision on handlooms.',
        image: {
          src: catPaintingJpg,
          alt: 'Pochampally Ikat silk saree'
        }
      },
      {
        name: 'Cheriyal Scroll Painting',
        shortDescription: 'Narrative scrolls painted with natural mineral colours on Khadi canvas treated with tamarind paste.',
        image: {
          src: catPaintingJpg,
          alt: 'Cheriyal narrative scroll painting'
        }
      },
      {
        name: 'Karimnagar Silver Filigree',
        shortDescription: 'Delicate openwork jewellery and decorative boxes formed from twisted pure silver wires.',
        image: {
          src: catPaintingJpg,
          alt: 'Karimnagar silver filigree box'
        }
      }
    ],
    materials: ['Mulberry Silk & Cotton', 'Pure Silver Wire', 'Natural Stone Pigments', 'Tamarind Seed Paste', 'Brass'],
    communities: ['Pochampally Ikat Weavers Guild', 'Cheriyal Nakashi Painters of Siddipet', 'Karimnagar Silversmiths'],
    whyItMatters: 'Guards the UNESCO-recognized Pochampally ikat craft community and rare Telangana storytelling scroll painting.',
    sources: [
      { title: 'Telangana State Handicrafts Development Corp (Golconda)', url: 'https://tshdc.telangana.gov.in' }
    ],
    crafts: ['Pochampally Ikat Silk Weaving', 'Cheriyal Scroll Paintings & Masks', 'Karimnagar Silver Filigree', 'Gadwal Handloom Silk Sarees', 'Pembarthi Metalware'],
    artisanTraditions: ['Pochampally Handloom Guilds', 'Nakashi Cheriyal Family', 'Karimnagar Filigree Guild']
  },
  {
    id: 'tripura',
    code: 'TR',
    name: 'Tripura',
    type: 'state',
    geographicRegion: 'North-Eastern India',
    region: 'North-Eastern',
    introduction: 'Verdant bamboo landscape renowned for ultra-fine split bamboo screen mats, delicate tribal loin-loom Rignai textiles, and carved wood crafts.',
    cultureSummary: 'Verdant bamboo landscape renowned for ultra-fine split bamboo screen mats, delicate tribal loin-loom Rignai textiles, and carved wood crafts.',
    hallmarkCraft: 'Tripura Bamboo Screen Craft & Rignai Weaving',
    heroImage: {
      src: catWoodcraftJpg,
      alt: 'Tripura ultra-fine split bamboo screen mat and tribal Rignai woven wrap',
      credit: 'Tripura Handloom & Handicrafts Development Corp (Purbasha)',
      sourceUrl: 'https://purbasha.tripura.gov.in'
    },
    cultureImage: {
      src: catCaneJpg,
      alt: 'Tripura ultra-fine split bamboo screen mat and tribal Rignai woven wrap',
    },
    featuredCrafts: [
      {
        name: 'Tripura Bamboo Screens & Mats',
        shortDescription: 'Feather-thin bamboo splints hand-woven into smooth, flexible screens and tabletop mats.',
        image: {
          src: catCaneJpg,
          alt: 'Tripura fine bamboo mat'
        }
      },
      {
        name: 'Rignai & Rikutu Handloom Weaves',
        shortDescription: 'Tribal cotton waist wraps woven on back-strap looms with intricate geometric diamond motifs.',
        image: {
          src: catCaneJpg,
          alt: 'Tripura Rignai tribal textile'
        }
      },
      {
        name: 'Cane Furniture & Lamps',
        shortDescription: 'Organic steam-bent cane light fixtures, armchairs, and baskets crafted by tribal guilds.',
        image: {
          src: catCaneJpg,
          alt: 'Tripura handcrafted cane lamp'
        }
      }
    ],
    materials: ['Muli & Barak Bamboo', 'Forest Cane', 'Cotton Yarn', 'Natural Plant Dyes'],
    communities: ['Agartala Bamboo Craftsmen', 'Tripuri & Reang Tribal Women Weavers', 'Dharmanagar Cane Workers'],
    whyItMatters: 'Demonstrates world-leading precision bamboo splitting techniques that produce fabrics from wood.',
    sources: [
      { title: 'Tripura Handloom & Handicrafts Development Corp (Purbasha)', url: 'https://purbasha.tripura.gov.in' }
    ],
    crafts: ['Tripura Split Bamboo Screen Mats', 'Rignai & Rikutu Tribal Handlooms', 'Cane Furniture & Sculptures'],
    artisanTraditions: ['Purbasha Bamboo Guilds', 'Tripuri Tribal Weavers', 'Kailashahar Cane Workshops']
  },
  {
    id: 'uttar-pradesh',
    code: 'UP',
    name: 'Uttar Pradesh',
    type: 'state',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Immense historic craft powerhouse celebrated for Varanasi gold zari Banarasi brocades, delicate Lucknow Chikankari needlework, and Moradabad brassware.',
    cultureSummary: 'Immense historic craft powerhouse celebrated for Varanasi gold zari Banarasi brocades, delicate Lucknow Chikankari needlework, and Moradabad brassware.',
    hallmarkCraft: 'Banarasi Silk Brocade & Lucknow Chikankari',
    heroImage: {
      src: catMetalworkJpg,
      alt: 'Varanasi gold zari Banarasi silk brocade and Lucknow white-on-white Chikankari embroidery',
      credit: 'UP Institute of Design and Handicrafts',
      sourceUrl: 'http://upidr.in'
    },
    cultureImage: {
      src: catTextilesJpg,
      alt: 'Varanasi gold zari Banarasi silk brocade and Lucknow white-on-white Chikankari embroidery',
    },
    featuredCrafts: [
      {
        name: 'Banarasi Silk Brocade',
        shortDescription: 'Royal handloom silk sarees woven with heavy gold zari threads and intricate Mughal floral jaals.',
        image: {
          src: catTextilesJpg,
          alt: 'Banarasi gold brocade saree'
        }
      },
      {
        name: 'Lucknow Chikankari Needlework',
        shortDescription: 'White-on-white shadow embroidery utilizing 32 distinct needlework stitches on fine muslin cloth.',
        image: {
          src: catTextilesJpg,
          alt: 'Lucknow Chikankari embroidery'
        }
      },
      {
        name: 'Moradabad Hand-Engraved Brass',
        shortDescription: 'Hand-cast brass and copper vessels intricately engraved with traditional floral and paisley patterns.',
        image: {
          src: catMetalworkJpg,
          alt: 'Moradabad engraved brass vase'
        }
      }
    ],
    materials: ['Katan Mulberry Silk', 'Pure Gold-Silver Zari', 'Fine Cotton Muslin', 'Cast Brass & Copper', 'Sheesham Wood'],
    communities: ['Varanasi Master Weavers Guild', 'Lucknow Women Chikankari Collectives', 'Moradabad Coppersmiths'],
    whyItMatters: 'Preserves the world’s most refined Mughal royal court embroidery and gold-thread silk jacquard lineages.',
    sources: [
      { title: 'Department of Micro, Small & Medium Enterprises and Export Promotion, UP', url: 'http://diupmsme.upsdc.gov.in' }
    ],
    crafts: ['Varanasi Banarasi Silk Brocade', 'Lucknow Chikankari & Zardozi Needlework', 'Moradabad Hand-Engraved Brassware', 'Bhadohi Hand-Knotted Carpets', 'Saharanpur Wood Carving'],
    artisanTraditions: ['Varanasi Master Weavers Guild', 'Lucknow Chikankari Collectives', 'Moradabad Coppersmiths', 'Bhadohi Carpet Weavers']
  },
  {
    id: 'uttarakhand',
    code: 'UK',
    name: 'Uttarakhand',
    type: 'state',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Himalayan state recognized for sacred Aipan ritual floor paintings, high-altitude Bhotia sheep-wool carpets, and hand-turned Tamta copperware.',
    cultureSummary: 'Himalayan state recognized for sacred Aipan ritual floor paintings, high-altitude Bhotia sheep-wool carpets, and hand-turned Tamta copperware.',
    hallmarkCraft: 'Aipan Folk Art & Bhotia Wool Weaves',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Kumaoni Aipan ritual red-and-white floor art and Bhotia tribal woollen Dan carpet',
      credit: 'Uttarakhand Handloom and Handicraft Development Council (Himadri)',
      sourceUrl: 'https://himadri.uk.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Kumaoni Aipan ritual red-and-white floor art and Bhotia tribal woollen Dan carpet',
    },
    featuredCrafts: [
      {
        name: 'Aipan Folk Art',
        shortDescription: 'Ritual geometric motifs painted with white rice paste on terracotta red-ochre backgrounds.',
        image: {
          src: catPotteryJpg,
          alt: 'Kumaon Aipan geometric art'
        }
      },
      {
        name: 'Bhotia Woollen Dan Carpets',
        shortDescription: 'Heavy-pile highland carpets hand-knotted from local Tibetan sheep wool on upright mountain looms.',
        image: {
          src: catPaintingJpg,
          alt: 'Bhotia hand-knotted wool rug'
        }
      },
      {
        name: 'Almora Tamta Copperware',
        shortDescription: 'Hand-beaten copper water dispensers and traditional cooking vessels made by hereditary metalsmiths.',
        image: {
          src: catMetalworkJpg,
          alt: 'Almora hand-beaten copper vessel'
        }
      }
    ],
    materials: ['Red Ochre (Geru) Mud', 'Rice Flour Paste', 'Himalayan Sheep Wool', 'Hand-Hammered Copper', 'Ringal Bamboo'],
    communities: ['Kumaoni Women Aipan Artists', 'Bhotia Tribal Weavers of Chamoli', 'Almora Tamta Coppersmiths'],
    whyItMatters: 'Guards sacred Himalayan geometric floor mandala traditions and high-altitude pastoralist wool crafting.',
    sources: [
      { title: 'Uttarakhand Handloom and Handicraft Development Council (Himadri)', url: 'https://himadri.uk.gov.in' }
    ],
    crafts: ['Aipan Ritual Folk Art', 'Bhotia Woollen Weaves (Dan Carpets & Shawls)', 'Almora Hand-Hammered Copperware', 'Ringal Bamboo Basketry'],
    artisanTraditions: ['Kumaoni Women Aipan Guilds', 'Bhotia Pastoralist Weavers', 'Tamta Coppersmith Community']
  },
  {
    id: 'west-bengal',
    code: 'WB',
    name: 'West Bengal',
    type: 'state',
    geographicRegion: 'Eastern India',
    region: 'Eastern',
    introduction: 'Rich delta craft heritage home to Baluchari mythological silk brocades, intricate recycled Kantha quilting, and Bankura terracotta horses.',
    cultureSummary: 'Rich delta craft heritage home to Baluchari mythological silk brocades, intricate recycled Kantha quilting, and Bankura terracotta horses.',
    hallmarkCraft: 'Baluchari Silk & Bankura Terracotta',
    heroImage: {
      src: catPotteryJpg,
      alt: 'Bishnupur Baluchari mythological silk saree and Bankura terracotta long-eared horse',
      credit: 'West Bengal State Handicrafts Development Corp (Manjusha)',
      sourceUrl: 'https://manjusha.wbmse.gov.in'
    },
    cultureImage: {
      src: catPotteryJpg,
      alt: 'Bishnupur Baluchari mythological silk saree and Bankura terracotta long-eared horse',
    },
    featuredCrafts: [
      {
        name: 'Baluchari & Jamdani Silk',
        shortDescription: 'Jacquard handloom sarees depicting epic Mahabharata and Ramayana scenes on decorative silk pallus.',
        image: {
          src: catTextilesJpg,
          alt: 'Baluchari mythological silk saree'
        }
      },
      {
        name: 'Nakshi Kantha Quilting',
        shortDescription: 'Narrative running-stitch embroidery stitched on layered cotton fabric using colorful recycled threads.',
        image: {
          src: catPotteryJpg,
          alt: 'Nakshi Kantha embroidered quilt'
        }
      },
      {
        name: 'Bankura Terracotta Horses',
        shortDescription: 'Tall, erect-eared terracotta horses hand-moulded and wood-fired in village kilns of Panchmura.',
        image: {
          src: catPotteryJpg,
          alt: 'Bankura terracotta horse'
        }
      }
    ],
    materials: ['Mulberry & Tussar Silk', 'Layered Cotton Khaddar', 'Alluvial Delta Clay', 'Brass & Bell Metal'],
    communities: ['Bishnupur Master Silk Weavers', 'Bolpur-Santiniketan Kantha Guilds', 'Panchmura Kumhar Sculptors'],
    whyItMatters: 'Preserves the world’s oldest sustainable upcycled textile embroidery and iconic Indian folk terracotta sculptures.',
    sources: [
      { title: 'West Bengal State Handicrafts Development Corp (Manjusha)', url: 'https://manjusha.wbmse.gov.in' },
      { title: 'Tantuja - West Bengal State Handloom Weavers Co-op', url: 'https://tantuja.in' }
    ],
    crafts: ['Baluchari Mythological Silk Sarees', 'Nakshi Kantha Embroidery', 'Bankura Panchmura Terracotta', 'Bikna Dokra Metalcraft', 'Shantiniketan Leather Goods'],
    artisanTraditions: ['Bishnupur Weavers Guild', 'Santiniketan Kantha Women Collectives', 'Panchmura Terracotta Artisans']
  },

  // =========================================================================
  // 8 UNION TERRITORIES
  // =========================================================================
  {
    id: 'andaman-and-nicobar',
    code: 'AN',
    name: 'Andaman and Nicobar Islands',
    type: 'union-territory',
    geographicRegion: 'Island Territory',
    region: 'Island',
    introduction: 'Archipelago craft culture characterized by indigenous Nicobari woven cane mats, polished coconut shell homeware, and sustainable sea-shell craftsmanship.',
    cultureSummary: 'Archipelago craft culture characterized by indigenous Nicobari woven cane mats, polished coconut shell homeware, and sustainable sea-shell craftsmanship.',
    hallmarkCraft: 'Nicobari Mats & Coconut Shell Craft',
    heroImage: {
      src: catCaneJpg,
      alt: 'Nicobari hand-woven reed mat and polished Andaman coconut shell lamp',
      credit: 'Directorate of Industries, Andaman & Nicobar Administration',
      sourceUrl: 'https://andaman.gov.in'
    },
    cultureImage: {
      src: catCaneJpg,
      alt: 'Nicobari hand-woven reed mat and polished Andaman coconut shell lamp',
    },
    featuredCrafts: [
      {
        name: 'Nicobari Pandanus Mats',
        shortDescription: 'Durable cooling mats woven by hand from the dried, stripped leaves of the wild coastal Pandanus tree.',
        image: {
          src: catCaneJpg,
          alt: 'Nicobari handwoven pandanus mat'
        }
      },
      {
        name: 'Polished Coconut Shellware',
        shortDescription: 'Utilitarian bowls, tea cups, and lamps hand-carved and buffed from seasoned island coconut shells.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Polished coconut shell cup'
        }
      },
      {
        name: 'Island Woodcraft',
        shortDescription: 'Decorative boat models and miniature outrigger canoes carved from seasoned Padauk wood.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Carved wooden outrigger canoe model'
        }
      }
    ],
    materials: ['Pandanus Leaves', 'Mature Coconut Shells', 'Andaman Padauk Hardwood', 'Natural Cane'],
    communities: ['Nicobari Tribal Weavers', 'Port Blair Coconut Carvers Guild', 'Island Shell Artisans'],
    whyItMatters: 'Preserves indigenous island botanical weaving systems adapted to tropical oceanic weather.',
    sources: [
      { title: 'Directorate of Industries, Andaman & Nicobar Administration', url: 'https://andaman.gov.in' }
    ],
    crafts: ['Nicobari Woven Pandanus Mats', 'Polished Coconut Shell Homeware', 'Padauk Woodcarving', 'Cane Furniture'],
    artisanTraditions: ['Nicobari Island Tribal Weavers', 'Port Blair Woodcraft Guilds']
  },
  {
    id: 'chandigarh',
    code: 'CH',
    name: 'Chandigarh',
    type: 'union-territory',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Modernist urban territory renowned for Corbusian mid-century teak furniture craft, Rock Garden recycled stone mosaic art, and traditional Phulkari embroidery.',
    cultureSummary: 'Modernist urban territory renowned for Corbusian mid-century teak furniture craft, Rock Garden recycled stone mosaic art, and traditional Phulkari embroidery.',
    hallmarkCraft: 'Modernist Teak Furniture & Recycled Rock Art',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Chandigarh mid-century teak V-leg armchair and Nek Chand recycled stone mosaic sculpture',
      credit: 'Chandigarh Administration - Tourism & Culture',
      sourceUrl: 'https://chandigarhtourism.gov.in'
    },
    cultureImage: {
      src: catTextilesJpg,
      alt: 'Chandigarh mid-century teak V-leg armchair and Nek Chand recycled stone mosaic sculpture',
    },
    featuredCrafts: [
      {
        name: 'Chandigarh Heritage Furniture',
        shortDescription: 'Minimalist solid teak armchairs and desks crafted with cane weave using Pierre Jeanneret architectural joinery.',
        image: {
          src: catPotteryJpg,
          alt: 'Chandigarh solid teak cane chair'
        }
      },
      {
        name: 'Recycled Ceramic & Stone Mosaic',
        shortDescription: 'Visionary sculpture made from recycled household ceramic ware, broken bangles, and river stones.',
        image: {
          src: catPotteryJpg,
          alt: 'Recycled ceramic mosaic figure'
        }
      },
      {
        name: 'Contemporary Punjabi Phulkari',
        shortDescription: 'Modern interpretations of traditional silk floss geometric darning needlework on fine linens.',
        image: {
          src: catPotteryJpg,
          alt: 'Contemporary Phulkari linen cushion'
        }
      }
    ],
    materials: ['Reclaimed Burma Teak', 'Natural Woven Cane', 'Recycled Industrial Ceramic', 'Silk Floss Thread'],
    communities: ['Master Heritage Carpenters of Sector 10', 'Rock Garden Artisan Collective', 'Urban Needlework Cooperatives'],
    whyItMatters: 'Preserves the pioneering 20th-century confluence of modernist architectural joinery with traditional Indian cane weaving.',
    sources: [
      { title: 'Chandigarh Administration - Tourism & Culture', url: 'https://chandigarhtourism.gov.in' }
    ],
    crafts: ['Chandigarh Teak Architectural Furniture', 'Rock Garden Recycled Mosaic Art', 'Urban Phulkari Needlework'],
    artisanTraditions: ['Heritage Furniture Restorers', 'Nek Chand Mosaic Artists', 'Urban Women Stitchers']
  },
  {
    id: 'dadra-and-nagar-haveli-and-daman-and-diu',
    code: 'DN',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    type: 'union-territory',
    geographicRegion: 'Western India',
    region: 'Western',
    introduction: 'Union territory celebrating indigenous Warli and Dhodia tribal bamboo crafts, coastal shell art, and Portuguese-influenced tortoise shell inlay traditions.',
    cultureSummary: 'Union territory celebrating indigenous Warli and Dhodia tribal bamboo crafts, coastal shell art, and Portuguese-influenced tortoise shell inlay traditions.',
    hallmarkCraft: 'Warli Bamboo Baskets & Coastal Shell Art',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Warli bamboo woven fishing trap and coastal seashell decorative craft',
      credit: 'Dadra & Nagar Haveli and Daman & Diu Administration',
      sourceUrl: 'https://ddd.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Warli bamboo woven fishing trap and coastal seashell decorative craft',
    },
    featuredCrafts: [
      {
        name: 'Warli & Dhodia Bamboo Crafts',
        shortDescription: 'Flexible fishing traps, grain storage baskets, and mats hand-woven from green hill bamboo.',
        image: {
          src: catPaintingJpg,
          alt: 'Woven tribal bamboo basket'
        }
      },
      {
        name: 'Diu Coastal Shell Craft',
        shortDescription: 'Curated seaside ornaments, lamps, and mirrors hand-embedded with natural ocean shells.',
        image: {
          src: catMetalworkJpg,
          alt: 'Decorative sea shell ornament'
        }
      },
      {
        name: 'Tribal Woodcarving',
        shortDescription: 'Traditional ritual marriage masks and household deities chiseled from local teak wood.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Tribal carved wooden mask'
        }
      }
    ],
    materials: ['Green Bamboo', 'Local Hardwood', 'Natural Sea Shells', 'Rice Paste'],
    communities: ['Warli Tribal Craftsmen of Silvassa', 'Daman Coastal Shell Artisans', 'Dhodia Basketry Guilds'],
    whyItMatters: 'Maintains indigenous Western Ghats forest basketry and coastal marine shell crafting lineages.',
    sources: [
      { title: 'Administration of Dadra and Nagar Haveli and Daman and Diu', url: 'https://ddd.gov.in' }
    ],
    crafts: ['Warli Bamboo Basketry', 'Coastal Sea Shell Art', 'Daman Woodcarving & Marquetry'],
    artisanTraditions: ['Silvassa Tribal Basketmakers', 'Daman Shell Workers Guild']
  },
  {
    id: 'delhi',
    code: 'DL',
    name: 'Delhi',
    type: 'union-territory',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Imperial craft capital celebrated for Old Delhi Zardozi heavy gold embroidery, Meenakari enamel jewellery, and blue pottery studios.',
    cultureSummary: 'Imperial craft capital celebrated for Old Delhi Zardozi heavy gold embroidery, Meenakari enamel jewellery, and blue pottery studios.',
    hallmarkCraft: 'Zardozi Gold Embroidery & Meenakari Enameling',
    heroImage: {
      src: catPotteryJpg,
      alt: 'Old Delhi Zardozi heavy gold bullion embroidery and Meenakari enamel jewelry',
      credit: 'Delhi State Industrial and Infrastructure Development Corp (DSIIDC)',
      sourceUrl: 'https://dsiidc.org'
    },
    cultureImage: {
      src: catTextilesJpg,
      alt: 'Old Delhi Zardozi heavy gold bullion embroidery and Meenakari enamel jewelry',
    },
    featuredCrafts: [
      {
        name: 'Zardozi Gold Wire Embroidery',
        shortDescription: 'Three-dimensional embroidery using metallic bullion wires, spangles, and seed pearls on heavy velvet.',
        image: {
          src: catMetalworkJpg,
          alt: 'Zardozi gold bullion embroidery'
        }
      },
      {
        name: 'Meenakari Enamel Metallurgy',
        shortDescription: 'Vibrant mineral glass powders fused into engraved grooves on gold and silver jewellery.',
        image: {
          src: catMetalworkJpg,
          alt: 'Meenakari enamel gold pendant'
        }
      },
      {
        name: 'Delhi Glazed Blue Pottery',
        shortDescription: 'Fine low-fire quartz clay ceramics painted with Persian botanical and mughal motifs.',
        image: {
          src: catPotteryJpg,
          alt: 'Delhi glazed ceramic vase'
        }
      }
    ],
    materials: ['Metallic Gold & Silver Wires', 'Fine Velvet', 'Vitreous Mineral Enamels', 'Ground Quartz Glass Frit'],
    communities: ['Chandni Chowk Zardozi Masters', 'Dariba Kalan Jewellers Guild', 'Uttam Nagar Potter Clusters'],
    whyItMatters: 'Preserves centuries of royal Mughal court goldsmithing, enameling, and ceremonial wire embroidery arts.',
    sources: [
      { title: 'Delhi State Industrial and Infrastructure Development Corp (DSIIDC)', url: 'https://dsiidc.org' }
    ],
    crafts: ['Old Delhi Zardozi Metallic Embroidery', 'Dariba Kalan Meenakari Enameling', 'Delhi Handcrafted Pottery', 'Paper Craft & Miniature Bookbinding'],
    artisanTraditions: ['Shahjahanabad Zardozi Guilds', 'Dariba Kalan Goldsmiths', 'Kumhar Gram Potters']
  },
  {
    id: 'jammu-and-kashmir',
    code: 'JK',
    name: 'Jammu and Kashmir',
    type: 'union-territory',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'World-renowned valley of master crafts: Changthangi Pashmina shawls with Sozni needlework, carved walnut wood, and lacquered papier-mâché.',
    cultureSummary: 'World-renowned valley of master crafts: Changthangi Pashmina shawls with Sozni needlework, carved walnut wood, and lacquered papier-mâché.',
    hallmarkCraft: 'Kashmir Pashmina Shawls & Papier-Mache',
    heroImage: {
      src: catWoodcraftJpg,
      alt: 'Handspun Kashmir Pashmina shawl with fine needle Sozni embroidery and carved walnut wood panel',
      credit: 'Directorate of Handicrafts and Handloom, Kashmir',
      sourceUrl: 'https://kashmirhandicrafts.com'
    },
    cultureImage: {
      src: catWoodcraftJpg,
      alt: 'Handspun Kashmir Pashmina shawl with fine needle Sozni embroidery and carved walnut wood panel',
    },
    featuredCrafts: [
      {
        name: 'Pashmina & Sozni Embroidery',
        shortDescription: 'High-altitude Changthangi cashmere handspun and needle-embroidered with delicate floral motifs.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Kashmir Pashmina embroidered shawl'
        }
      },
      {
        name: 'Kashmiri Papier-Mâché',
        shortDescription: 'Moulded paper pulp vessels painted with intricate Persian miniature floral scrolls and pure gold wash.',
        image: {
          src: catPaintingJpg,
          alt: 'Kashmir papier-mache box'
        }
      },
      {
        name: 'Walnut Wood Carving',
        shortDescription: 'Deep relief lattice and floral carvings chiseled from seasoned Himalayan walnut roots.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Carved walnut wood panel'
        }
      }
    ],
    materials: ['Changthangi Pashmina Cashmere', 'Paper Pulp & Natural Glue', 'Himalayan Walnut Wood', 'Pure Gold Leaf', 'Mulberry Silk'],
    communities: ['Srinagar Master Sozni Embroiderers', 'Papier-Mâché Ustad Guilds of Zadibal', 'Walnut Wood Carvers of Downtown Srinagar'],
    whyItMatters: 'Protects the world’s finest handspun cashmere and delicate Persian court lacquer arts passed down since the 14th century.',
    sources: [
      { title: 'Directorate of Handicrafts and Handloom, Kashmir', url: 'https://kashmirhandicrafts.com' },
      { title: 'Craft Development Institute, Srinagar', url: 'https://cdisgr.org' }
    ],
    crafts: ['Kashmir Pashmina & Kani Shawls', 'Sozni Fine Needle Embroidery', 'Kashmiri Papier-Mâché Art', 'Walnut Wood Carving', 'Kashmir Hand-Knotted Silk Carpets'],
    artisanTraditions: ['Srinagar Master Pashmina Weavers', 'Zadibal Papier-Mâché Guilds', 'Kanihama Kani Shawl Masters']
  },
  {
    id: 'ladakh',
    code: 'LA',
    name: 'Ladakh',
    type: 'union-territory',
    geographicRegion: 'Northern India',
    region: 'Northern',
    introduction: 'Trans-Himalayan high-altitude desert renowned for raw Pashmina wool spinning, Chilling beaten brass-silver metalsmithing, and Thangka thangkas.',
    cultureSummary: 'Trans-Himalayan high-altitude desert renowned for raw Pashmina wool spinning, Chilling beaten brass-silver metalsmithing, and Thangka thangkas.',
    hallmarkCraft: 'Ladakhi Pashmina Spinning & Chilling Metalwork',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Nomadic Changpa raw Pashmina spinning and Chilling village beaten copper-silver tea pot',
      credit: 'Industries and Commerce Department, UT Administration of Ladakh',
      sourceUrl: 'https://ladakh.nic.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Nomadic Changpa raw Pashmina spinning and Chilling village beaten copper-silver tea pot',
    },
    featuredCrafts: [
      {
        name: 'Nomadic Pashmina & Yak Wool',
        shortDescription: 'Ultra-fine cashmere harvested by nomadic Changpa pastoralists and spun on traditional Takli spindles.',
        image: {
          src: catTextilesJpg,
          alt: 'Ladakh handspun pashmina wool'
        }
      },
      {
        name: 'Chilling Hand-Beaten Copperware',
        shortDescription: 'Ceremonial tea pots (samovars) and ladles hand-beaten from copper, brass, and silver.',
        image: {
          src: catPotteryJpg,
          alt: 'Chilling beaten copper teapot'
        }
      },
      {
        name: 'Ladakhi Clay Sculpting & Thangka',
        shortDescription: 'Sacred monastery deities modelled from straw-reinforced clay and painted with mineral pigments.',
        image: {
          src: catPotteryJpg,
          alt: 'Ladakh Buddhist clay deity'
        }
      }
    ],
    materials: ['Changthangi Raw Pashmina', 'Yak & Camel Wool', 'Hand-Hammered Copper & Silver', 'Mineral Pigments'],
    communities: ['Changpa Nomads of Changthang Plateau', 'Chilling Village Coppersmith Lineage', 'Monastery Statuary Artists'],
    whyItMatters: 'Preserves the world’s original high-altitude nomadic cashmere harvesting and ancestral Nepalese metalworker lineages.',
    sources: [
      { title: 'Industries and Commerce Department, UT Administration of Ladakh', url: 'https://ladakh.nic.in' }
    ],
    crafts: ['Changpa Nomadic Pashmina Spinning', 'Chilling Beaten Copper & Silver Metalware', 'Ladakhi Clay Sculpture', 'Pattu Wool Weaving'],
    artisanTraditions: ['Changpa Pastoralist Guilds', 'Chilling Metalsmith Clan', 'Leh Monastery Artists']
  },
  {
    id: 'lakshadweep',
    code: 'LD',
    name: 'Lakshadweep',
    type: 'union-territory',
    geographicRegion: 'Island Territory',
    region: 'Island',
    introduction: 'Coral atoll union territory celebrated for master coconut coir spinning, oceanic seashell carving, and traditional wooden boat craftsmanship.',
    cultureSummary: 'Coral atoll union territory celebrated for master coconut coir spinning, oceanic seashell carving, and traditional wooden boat craftsmanship.',
    hallmarkCraft: 'Lakshadweep Coir Crafts & Coral Shell Art',
    heroImage: {
      src: catPaintingJpg,
      alt: 'Lakshadweep fine hand-spun coir rope and carved coconut craft',
      credit: 'Department of Industries, Lakshadweep Administration',
      sourceUrl: 'https://lakshadweep.gov.in'
    },
    cultureImage: {
      src: catPaintingJpg,
      alt: 'Lakshadweep fine hand-spun coir rope and carved coconut craft',
    },
    featuredCrafts: [
      {
        name: 'Lakshadweep Coir Rope Spinning',
        shortDescription: 'Golden coconut husk fibres naturally retted in sea lagoons and hand-spun into salt-resistant ropes.',
        image: {
          src: catTextilesJpg,
          alt: 'Hand-spun golden coir rope'
        }
      },
      {
        name: 'Coconut Shell Engraving',
        shortDescription: 'Carved decorative cups, lamps, and oil bottles polished with natural coconut oil.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Carved coconut shell oil bottle'
        }
      },
      {
        name: 'Atoll Sea Shell Craft',
        shortDescription: 'Curated shore shells transformed into decorative curtain ties, jewellery, and table insets.',
        image: {
          src: catWoodcraftJpg,
          alt: 'Sea shell decorative handicraft'
        }
      }
    ],
    materials: ['Lagoon Retted Coconut Husk', 'Mature Coconut Shells', 'Natural Sea Shells', 'Local Timber'],
    communities: ['Kavaratti Coir Women Spinners', 'Minicoy Island Craftsmen', 'Andrott Shell Workers'],
    whyItMatters: 'Demonstrates traditional island zero-waste coconut processing and lagoon-water fibre processing systems.',
    sources: [
      { title: 'Department of Industries, Lakshadweep Administration', url: 'https://lakshadweep.gov.in' }
    ],
    crafts: ['Lakshadweep Lagoon Coir Spinning', 'Coconut Shell Engraved Homeware', 'Minicoy Traditional Boat Crafts'],
    artisanTraditions: ['Kavaratti Coir Cooperatives', 'Minicoy Island Boatbuilders']
  },
  {
    id: 'puducherry',
    code: 'PY',
    name: 'Puducherry',
    type: 'union-territory',
    geographicRegion: 'Southern India',
    region: 'Southern',
    introduction: 'Franco-Tamil coastal territory known for handmade cotton rag paper, Villianur terracotta votive pottery, and Auroville scented botanical candlecraft.',
    cultureSummary: 'Franco-Tamil coastal territory known for handmade cotton rag paper, Villianur terracotta votive pottery, and Auroville scented botanical candlecraft.',
    hallmarkCraft: 'Handmade Rag Paper & Villianur Terracotta',
    heroImage: {
      src: catPotteryJpg,
      alt: 'Villianur terracotta ritual statue and handmade cotton rag deckle-edge paper',
      credit: 'Directorate of Industries and Commerce, Puducherry',
      sourceUrl: 'https://industries.py.gov.in'
    },
    cultureImage: {
      src: catPotteryJpg,
      alt: 'Villianur terracotta ritual statue and handmade cotton rag deckle-edge paper',
    },
    featuredCrafts: [
      {
        name: 'Villianur Terracotta Pottery',
        shortDescription: 'Refined clay statues of deities and animals hand-sculpted with fine river silt in Villianur.',
        image: {
          src: catPotteryJpg,
          alt: 'Villianur terracotta statue'
        }
      },
      {
        name: 'Handmade Cotton Rag Paper',
        shortDescription: 'Eco-friendly acid-free deckle-edged paper made from 100% recycled textile cotton rags.',
        image: {
          src: catPotteryJpg,
          alt: 'Handmade deckle edge cotton paper'
        }
      },
      {
        name: 'Auroville Botanical Crafts',
        shortDescription: 'Hand-poured beeswax candles, natural incense, and pressed flower stationery.',
        image: {
          src: catCaneJpg,
          alt: 'Handmade botanical scented candle'
        }
      }
    ],
    materials: ['Recycled Cotton Rags', 'Fine River Silt Clay', 'Natural Beeswax', 'Essential Oils'],
    communities: ['Villianur Kumhar Sculptors', 'Sri Aurobindo Ashram Paper Makers', 'Auroville Craft Collectives'],
    whyItMatters: 'Leads sustainable cotton-waste paper recycling and heritage Dravidian terracotta statuary arts.',
    sources: [
      { title: 'Directorate of Industries and Commerce, Puducherry', url: 'https://industries.py.gov.in' }
    ],
    crafts: ['Villianur Terracotta Statuary', 'Sri Aurobindo Ashram Handmade Paper', 'Auroville Botanical Crafts', 'Puducherry Woodcarving'],
    artisanTraditions: ['Villianur Terracotta Guild', 'Ashram Paper Mill Artisans', 'Auroville Craft Units']
  }
];

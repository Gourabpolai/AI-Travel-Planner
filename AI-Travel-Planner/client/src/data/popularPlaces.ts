export interface TourPackage {
  id: string;
  title: string;
  category: string; // e.g. "Cultural Tours", "4WD Tours", "Thrill & Adventure"
  price: string;
  duration: string;
  rating: number;
  reviewsCount: number;
  image: string;
  highlights: string[];
}

export interface PersonaItinerary {
  id: string;
  persona: string; // "Couples", "Solo Travelers", "Families", "Friend Groups"
  days: string;
  title: string;
  summary: string;
  tags: string[];
  image: string;
}

export interface CommunityQuestion {
  id: string;
  question: string;
  author: string;
  repliesCount: number;
  answerSummary: string;
  tag: string;
}

export interface SubRegion {
  id: string;
  name: string;
  description: string;
  image: string;
  distance: string;
}

export interface PopularPlace {
  id: string;
  placeId?: string;
  name: string;
  country: string;
  rating: number;
  bestSeason?: string;
  bestMonths?: string;
  bestTime?: string;
  tag?: string;
  budget: string;
  duration: string;
  image: string;
  description: string;
  weather?: string;
  attractions: string[];
  thingsToDo?: string[];
  localFood?: string[];
  travelTips?: string[];
  googleMapsUrl?: string;
  
  // TripAdvisor-inspired extended portal fields
  askPrompts?: string[];
  packages?: TourPackage[];
  personaItineraries?: PersonaItinerary[];
  communityQA?: CommunityQuestion[];
  subRegions?: SubRegion[];
}

export const POPULAR_PLACES: PopularPlace[] = [
  {
    id: "ladakh",
    name: "Ladakh",
    country: "India",
    rating: 4.9,
    bestSeason: "Summer (June – September)",
    bestMonths: "June to September",
    budget: "₹56,000",
    duration: "7-8 Days",
    tag: "High Altitude Wonder",
    image: "https://images.unsplash.com/photo-1594226896207-6b453a2a3e0f?auto=format&fit=crop&w=800&q=80",
    description: "A breathtaking cold desert region in the Indian Himalayas, famous for high mountain passes, pristine turquoise lakes, ancient cliffside monasteries, and starlit night skies.",
    weather: "High-altitude arid climate. Summers are cool and dry (10°C to 25°C). Winters are extremely cold (-20°C).",
    attractions: ["Pangong Tso Lake", "Leh Palace", "Nubra Valley (Sand Dunes)", "Magnetic Hill", "Thiksey Monastery", "Khardung La Pass"],
    thingsToDo: ["Camp near the turquoise Pangong Lake", "Ride double-humped Bactrian camels in Hunder", "Drive through Khardung La (one of the highest motorable roads)", "Watch monks chant at Thiksey Monastery", "Stargaze at Hanle Dark Sky Observatory"],
    localFood: ["Thukpa (noodle soup)", "Skyu (barley pasta dish)", "Momos", "Butter Tea (Gur Gur tea)", "Khambir (traditional bread)"],
    travelTips: [
      "Rest completely on the first day in Leh to acclimatize to high altitude.",
      "Acquire Inner Line Permits (ILP) for Pangong and Nubra beforehand.",
      "Carry postpaid SIM cards (BSNL/Airtel work best in Leh)."
    ],
    googleMapsUrl: "https://maps.google.com/?q=Ladakh,+India",
    askPrompts: [
      "Luxury stays with mountain views",
      "Adventure tours & 4WD expeditions",
      "Monastery circuit & Buddhist culture",
      "Pangong Lake overnight camping",
      "Bactrian camel ride in Nubra"
    ],
    packages: [
      {
        id: "pkg-ladakh-1",
        title: "Classic Leh Monastery & Heritage Circuit",
        category: "Cultural Tours",
        price: "₹6,500",
        duration: "Full Day",
        rating: 4.9,
        reviewsCount: 342,
        image: "https://images.unsplash.com/photo-1594226896207-6b453a2a3e0f?auto=format&fit=crop&w=600&q=80",
        highlights: ["Thiksey Monastery morning prayers", "Shey Palace & Hall of Fame", "Hemis Monastery Museum"]
      },
      {
        id: "pkg-ladakh-2",
        title: "Pangong Lake & Nubra Valley 4WD Expedition",
        category: "4WD & Adventure Tours",
        price: "₹16,500",
        duration: "3 Days / 2 Nights",
        rating: 4.95,
        reviewsCount: 589,
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
        highlights: ["Khardung La Pass Crossing (17,982 ft)", "Hunder Sand Dunes Camel Safari", "Starry night camping at Pangong Tso"]
      },
      {
        id: "pkg-ladakh-3",
        title: "Zanskar River Rafting & Magnetic Hill Experience",
        category: "Thrill & Adventure",
        price: "₹4,200",
        duration: "Day Trip",
        rating: 4.8,
        reviewsCount: 215,
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
        highlights: ["Confluence of Zanskar & Indus Rivers", "Sangam Grade-III White Water Rafting", "Gravity-defying Magnetic Hill"]
      },
      {
        id: "pkg-ladakh-4",
        title: "Royal Himalayan Bike Safari to Khardung La",
        category: "Motorcycle Tours",
        price: "₹22,000",
        duration: "5 Days",
        rating: 4.88,
        reviewsCount: 410,
        image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80",
        highlights: ["Royal Enfield Himalayan bike rentals", "High mountain passes crossing", "Hanle Dark Sky Observatory stay"]
      }
    ],
    personaItineraries: [
      {
        id: "itin-ladakh-couples",
        persona: "Couples",
        days: "5 Days",
        title: "5 Days in Ladakh for Couples",
        summary: "Romantic luxury glamping beside turquoise Pangong Lake, peaceful sunset monastery walks, and private star-gazing under crystal-clear night skies.",
        tags: ["Couples", "Romantic Views", "Monasteries", "Lake Glamping"],
        image: "https://images.unsplash.com/photo-1594226896207-6b453a2a3e0f?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "itin-ladakh-solo",
        persona: "Solo Travelers",
        days: "4 Days",
        title: "4 Days in Ladakh for Solo Travelers",
        summary: "Mindful monastery exploration, vibrant Leh market street food, hostellers community network, and Khardung La bike ride.",
        tags: ["Solo", "Culture & Meditation", "Hostel Stays", "Hidden Gems"],
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "itin-ladakh-family",
        persona: "Families",
        days: "7 Days",
        title: "7 Days in Ladakh for Families",
        summary: "Acclimatized leisurely travel covering Leh Palace, camel rides at Diskit, gentle river rafting, and scenic comfortable SUV transfers.",
        tags: ["Family", "Comfort Pace", "Wildlife & Camels", "Guided Comfort"],
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "itin-ladakh-friends",
        persona: "Friend Groups",
        days: "6 Days",
        title: "6 Days in Ladakh for Bike & Friend Groups",
        summary: "High-octane motorcycle rallies, bonfire night camps in Hunder sand dunes, and challenging mountain pass crossings.",
        tags: ["Friends", "Motorcycle Rally", "Dune Camping", "High Passes"],
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
      }
    ],
    communityQA: [
      {
        id: "qa-ladakh-1",
        question: "How many days are strictly required to acclimatize in Leh?",
        author: "Rahul M.",
        repliesCount: 48,
        answerSummary: "Doctors and high-altitude experts recommend resting completely for at least 24 to 36 hours upon arrival in Leh (11,500 ft) before travelling to higher passes like Khardung La or Pangong Lake.",
        tag: "Health & AMS"
      },
      {
        id: "qa-ladakh-2",
        question: "Do I need an Inner Line Permit (ILP) for Pangong Lake and Nubra Valley?",
        author: "Elena S.",
        repliesCount: 32,
        answerSummary: "Yes, Indian and foreign nationals require an Inner Line Permit / Protected Area Permit to visit Pangong Tso, Nubra Valley, Hanle, and Tso Moriri. It can be easily generated online or through local travel agencies.",
        tag: "Permits & Visas"
      },
      {
        id: "qa-ladakh-3",
        question: "Is BSNL the only mobile network working in Ladakh?",
        author: "Vikram K.",
        repliesCount: 64,
        answerSummary: "Postpaid BSNL and Jio work reliably in Leh town and parts of Nubra Valley. Prepaid roaming SIM cards from other states do not work anywhere in Jammu & Kashmir / Ladakh.",
        tag: "Connectivity & SIM"
      },
      {
        id: "qa-ladakh-4",
        question: "What is the best month to witness the double-humped camel safari in Hunder?",
        author: "Sophie T.",
        repliesCount: 19,
        answerSummary: "June to September offers pleasant daytime temperatures and clear open roads to Hunder in Nubra Valley, where Bactrian camels roam freely across the cold desert dunes.",
        tag: "Best Season"
      }
    ],
    subRegions: [
      {
        id: "sub-1",
        name: "Nubra Valley (Hunder & Diskit)",
        description: "High altitude cold desert sand dunes, Diskit Monastery, and double-humped Bactrian camel safaris.",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
        distance: "125 km from Leh"
      },
      {
        id: "sub-2",
        name: "Pangong Tso & Spangmik",
        description: "A 134-km long high altitude salt water lake changing shades from deep blue to turquoise.",
        image: "https://images.unsplash.com/photo-1594226896207-6b453a2a3e0f?auto=format&fit=crop&w=600&q=80",
        distance: "160 km from Leh"
      },
      {
        id: "sub-3",
        name: "Hanle & Dark Sky Reserve",
        description: "India's first official Dark Sky Reserve home to the Indian Astronomical Observatory and pristine night skies.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        distance: "255 km from Leh"
      },
      {
        id: "sub-4",
        name: "Kargil & Zanskar Valley",
        description: "Historic transit town connecting Ladakh with Kashmir, famed for Zanskar river gorges and Suru valley.",
        image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80",
        distance: "215 km from Leh"
      }
    ]
  },
  {
    id: "goa",
    name: "Goa",
    country: "India",
    rating: 4.8,
    bestSeason: "Winter (November – February)",
    bestMonths: "November to February",
    budget: "₹32,000",
    duration: "4-5 Days",
    tag: "Beach & Nightlife Capital",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    description: "Known for its pristine beaches, vibrant nightlife, 17th-century Portuguese churches, and rich spice plantations.",
    weather: "Warm and tropical, temperatures range from 20°C to 32°C. Pleasant sea breezes blow during the evening.",
    attractions: ["Baga Beach", "Basilica of Bom Jesus", "Dudhsagar Falls", "Fort Aguada", "Anjuna Flea Market"],
    thingsToDo: ["Scuba diving and water sports", "Explore historic churches in Old Goa", "Visit a spice plantation with lunch", "Experience a sunset cruise on Mondovi River", "Dance at shacks in beach clubs"],
    localFood: ["Fish Curry Rice", "Pork Vindaloo", "Bebinca (traditional dessert)", "Chicken Xacuti", "Goan Feni"],
    travelTips: [
      "Rent a scooter/car for easy travel across North and South Goa.",
      "Dress respectably when visiting religious institutions.",
      "Stay in North Goa for nightlife, South Goa for quiet beaches."
    ],
    googleMapsUrl: "https://maps.google.com/?q=Goa,+India",
    askPrompts: ["Beachfront shacks with sunset views", "Scuba diving & water sports packages", "Heritage Portuguese churches tour"],
    packages: [
      {
        id: "pkg-goa-1",
        title: "North Goa Beach & Watersports Combo",
        category: "Water Sports & Fun",
        price: "₹3,800",
        duration: "Full Day",
        rating: 4.85,
        reviewsCount: 420,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        highlights: ["Parasailing & Jet Ski at Baga", "Banana boat ride", "Fort Aguada visit"]
      },
      {
        id: "pkg-goa-2",
        title: "Old Goa Heritage & Mandovi Sunset Cruise",
        category: "Cultural Tours",
        price: "₹2,900",
        duration: "Half Day",
        rating: 4.9,
        reviewsCount: 310,
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
        highlights: ["Basilica of Bom Jesus tour", "Se Cathedral history walk", "Sunset catamaran cruise"]
      }
    ],
    personaItineraries: [
      {
        id: "itin-goa-couples",
        persona: "Couples",
        days: "4 Days",
        title: "4 Days in Goa for Couples",
        summary: "Romantic candle-lit beach dinners, South Goa quiet resorts, and private sailboat cruises.",
        tags: ["Couples", "Sunset Cruise", "South Goa Quiet"],
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
      }
    ],
    communityQA: [
      {
        id: "qa-goa-1",
        question: "Is North Goa better or South Goa for first-time visitors?",
        author: "Ankit P.",
        repliesCount: 52,
        answerSummary: "North Goa is best for nightlife, beach shacks, and water sports. South Goa is ideal for peaceful luxury resorts, clean silent beaches, and relaxation.",
        tag: "Location Choice"
      }
    ],
    subRegions: [
      {
        id: "sub-goa-1",
        name: "North Goa (Baga, Anjuna, Vagator)",
        description: "Lively beach shacks, flea markets, watersports, and night clubs.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        distance: "15 km from Panaji"
      },
      {
        id: "sub-goa-2",
        name: "South Goa (Palolem, Colva, Cavelossim)",
        description: "Pristine white sand beaches, tranquil coconut groves, and luxury spa resorts.",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
        distance: "35 km from Panaji"
      }
    ]
  },

  {
    id: "kashmir",
    name: "Kashmir",
    country: "India",
    rating: 4.9,
    bestSeason: "Spring & Summer (March – August)",
    bestMonths: "March to August",
    budget: "₹40,000",
    duration: "6-7 Days",
    tag: "Heaven on Earth",
    image: "https://images.unsplash.com/photo-1566837489311-10ed4c9957e8?auto=format&fit=crop&w=800&q=80",
    description: "Famed as 'Heaven on Earth', Kashmir boasts snow-clad Himalayan peaks, pristine alpine lakes, scenic meadows, and houseboat stays.",
    weather: "Varies from cool summers (15°C to 30°C) to cold winters (-2°C to 10°C) with heavy snowfall in Gulmarg.",
    attractions: ["Dal Lake Houseboats", "Shalimar Bagh Mughal Gardens", "Gulmarg Gondola", "Betaab Valley (Pahalgam)", "Sonamarg glaciers"],
    thingsToDo: ["Stay in a luxury carved wooden houseboat", "Take a Shikara boat ride on Dal Lake", "Ride the Gulmarg Gondola (highest cable car)", "Walk through saffron fields in Pampore", "Trek through Betaab Valley"],
    localFood: ["Kashmiri Wazwan (multicourse meal)", "Rogan Josh", "Kahwa (saffron green tea)", "Yakhni (yogurt-based lamb curry)", "Dum Aloo"],
    travelTips: [
      "Carry postpaid SIM cards (BSNL/Airtel/Jio) as prepaid roaming doesn't work.",
      "Book houseboats and Gondola tickets online well in advance.",
      "Carry woolens even during summer as evenings can get quite cold."
    ],
    googleMapsUrl: "https://maps.google.com/?q=Kashmir,+India"
  },
  {
    id: "manali",
    name: "Manali",
    country: "India",
    rating: 4.6,
    bestSeason: "Year-Round (October – June)",
    bestMonths: "October to June",
    budget: "₹24,000",
    duration: "3-4 Days",
    tag: "Himalayan Adventure",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    description: "A high-altitude Himalayan resort town known for hiking, rafting, and skiing near the Solang Valley and Rohtang Pass.",
    weather: "Alpine mountain climate. Pleasant summers (10°C to 25°C), cold winters (-5°C to 10°C) with fresh snowfall.",
    attractions: ["Hadimba Temple", "Solang Valley", "Rohtang Pass", "Jogini Waterfalls", "Old Manali Cafes"],
    thingsToDo: ["Paragliding & skiing in Solang Valley", "Drive through the Atal Tunnel to Lahaul Valley", "Bathe in Vashisht hot springs", "Hike up to Jogini waterfall", "Café hopping in hippie Old Manali"],
    localFood: ["Siddu (traditional stuffed bread)", "Trout Fish", "Thukpa & Momos", "Kadhi Chawal", "Local apple cider"],
    travelTips: [
      "Rohtang Pass requires a special permit; secure it online a few days ahead.",
      "Expect heavy traffic jams on Rohtang road during peak summer season.",
      "Dress in warm layers during winters."
    ],
    googleMapsUrl: "https://maps.google.com/?q=Manali,+India"
  }
];

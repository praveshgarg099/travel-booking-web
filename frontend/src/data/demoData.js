export const DESTINATIONS_SEED = [
  { name: 'Goa', country: 'India', description: 'Famous for its pristine beaches, vibrant nightlife, and Portuguese heritage.' },
  { name: 'Jaipur', country: 'India', description: 'The Pink City, known for its royal palaces, historic forts, and rich Rajasthani culture.' },
  { name: 'Manali', country: 'India', description: 'A high-altitude Himalayan resort town with breathtaking valleys and adventure sports.' },
  { name: 'Kerala', country: 'India', description: "God's Own Country, offering tranquil backwaters, lush tea gardens, and Ayurvedic retreats." },
  { name: 'Kashmir', country: 'India', description: 'Paradise on Earth, featuring serene lakes, snow-capped peaks, and beautiful Mughal gardens.' },
  { name: 'Rajasthan', country: 'India', description: 'The land of Kings, featuring vast deserts, majestic forts, and vibrant festivals.' },
  { name: 'Himachal Pradesh', country: 'India', description: 'A scenic mountain state known for trekking, Tibetan culture, and scenic hill stations.' },
  { name: 'Andaman', country: 'India', description: 'Tropical archipelago with white-sand beaches, coral reefs, and crystal clear waters.' },
  { name: 'Udaipur', country: 'India', description: 'The City of Lakes, known for its lavish royal residences and romantic atmosphere.' },
  { name: 'Mumbai', country: 'India', description: 'The City of Dreams, bustling with Bollywood glamour, historic architecture, and coastal drives.' }
];

export const PACKAGES_SEED = [
  {
    title: 'Goa Beach Paradise',
    description: 'Relax on the golden sands of Baga and Calangute, explore historic churches, and enjoy the vibrant nightlife.',
    destinationName: 'Goa',
    duration: 5,
    price: 15000,
    availableSeats: 20
  },
  {
    title: 'Royal Jaipur Heritage Tour',
    description: 'Experience the grandeur of Amber Fort, City Palace, and Hawa Mahal in the heart of the Pink City.',
    destinationName: 'Jaipur',
    duration: 4,
    price: 12000,
    availableSeats: 15
  },
  {
    title: 'Manali Snow Adventure',
    description: 'Thrilling adventure in the Himalayas including Solang Valley sports, Rohtang Pass, and cozy local cafes.',
    destinationName: 'Manali',
    duration: 6,
    price: 18500,
    availableSeats: 12
  },
  {
    title: 'Kerala Backwaters Retreat',
    description: 'Cruise through the serene Alleppey backwaters on a traditional houseboat and visit the lush Munnar tea gardens.',
    destinationName: 'Kerala',
    duration: 7,
    price: 22000,
    availableSeats: 10
  },
  {
    title: 'Kashmir Valley Splendor',
    description: 'Stay in a Dal Lake houseboat, stroll through Mughal Gardens, and witness the snow peaks of Gulmarg.',
    destinationName: 'Kashmir',
    duration: 6,
    price: 25000,
    availableSeats: 8
  },
  {
    title: 'Rajasthan Desert Safari',
    description: 'Explore the golden dunes of Thar, witness folk dances, and stay in luxury desert camps.',
    destinationName: 'Rajasthan',
    duration: 5,
    price: 16500,
    availableSeats: 14
  },
  {
    title: 'Himachal Trekking Expedition',
    description: 'Embark on guided treks through scenic trails, camp under the stars, and experience Tibetan culture in Dharamshala.',
    destinationName: 'Himachal Pradesh',
    duration: 8,
    price: 21000,
    availableSeats: 10
  },
  {
    title: 'Andaman Scuba & Island Tour',
    description: 'Dive into the crystal clear waters of Havelock, relax on Radhanagar Beach, and explore historic Cellular Jail.',
    destinationName: 'Andaman',
    duration: 6,
    price: 32000,
    availableSeats: 15
  },
  {
    title: 'Udaipur Romantic Getaway',
    description: 'A luxurious stay by Lake Pichola, private boat rides, and exclusive dining at royal palaces.',
    destinationName: 'Udaipur',
    duration: 4,
    price: 28000,
    availableSeats: 6
  },
  {
    title: 'Mumbai City & Bollywood Tour',
    description: 'Discover the Gateway of India, Marine Drive, and get an exclusive behind-the-scenes look at Bollywood studios.',
    destinationName: 'Mumbai',
    duration: 3,
    price: 9500,
    availableSeats: 25
  },
  {
    title: 'Goa Monsoon Magic',
    description: 'Experience Goa when it is lush and green, featuring spice plantation tours and dudhsagar waterfall treks.',
    destinationName: 'Goa',
    duration: 4,
    price: 11000,
    availableSeats: 18
  },
  {
    title: 'Kerala Ayurvedic Wellness',
    description: 'Rejuvenate your mind and body with traditional Ayurvedic therapies, yoga, and organic dining.',
    destinationName: 'Kerala',
    duration: 7,
    price: 35000,
    availableSeats: 8
  },
  {
    title: 'Kashmir Honeymoon Special',
    description: 'A romantic journey through Pahalgam and Srinagar designed exclusively for couples with premium stays.',
    destinationName: 'Kashmir',
    duration: 6,
    price: 38000,
    availableSeats: 5
  },
  {
    title: 'Jaipur & Agra Triangle',
    description: 'Combine the royal heritage of Jaipur with a day trip to the iconic Taj Mahal in Agra.',
    destinationName: 'Jaipur',
    duration: 5,
    price: 17500,
    availableSeats: 20
  },
  {
    title: 'Andaman Luxury Cruise',
    description: 'Sail between the islands in luxury, enjoy private beach dinners, and experience elite marine life viewing.',
    destinationName: 'Andaman',
    duration: 5,
    price: 45000,
    availableSeats: 10
  }
];

// Frontend Extended Data (Matched by Package Title or ID)
export const FRONTEND_PACKAGE_CONFIG = {
  // Use a string matching the title as key (converted to lowercase without spaces to ensure robust matching)
  'goabeachparadise': {
    category: 'Beach & Nightlife',
    highlights: ['Baga Beach', 'Historic Churches', 'Seafood Tasting'],
    itinerary: 'Day 1: Arrival & North Goa Beaches\nDay 2: Fort Aguada & Nightlife\nDay 3: South Goa Temples & Churches\nDay 4: Spice Plantation\nDay 5: Departure',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewsCount: 124
  },
  'royaljaipurheritagetour': {
    category: 'Heritage',
    highlights: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Local Bazaars'],
    itinerary: 'Day 1: Arrival & Chokhi Dhani\nDay 2: Amber Fort & Elephant Ride\nDay 3: City Palace & Shopping\nDay 4: Departure',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewsCount: 89
  },
  'manalisnowadventure': {
    category: 'Adventure',
    highlights: ['Solang Valley', 'Rohtang Pass', 'Hadimba Temple', 'River Rafting'],
    itinerary: 'Day 1: Arrival & Local Sightseeing\nDay 2: Rohtang Pass Excursion\nDay 3: Solang Valley Adventure Sports\nDay 4: Kullu Valley & River Rafting\nDay 5: Old Manali Cafes\nDay 6: Departure',
    image: 'https://images.unsplash.com/photo-1593181629936-11c602b78e1f?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewsCount: 215
  },
  'keralabackwatersretreat': {
    category: 'Nature',
    highlights: ['Houseboat Stay', 'Tea Gardens', 'Kathakali Show'],
    itinerary: 'Day 1: Arrival in Cochin\nDay 2: Transfer to Munnar\nDay 3: Eravikulam National Park\nDay 4: Thekkady Spice Plantations\nDay 5: Alleppey Houseboat\nDay 6: Kumarakom Bird Sanctuary\nDay 7: Departure',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewsCount: 342
  },
  'kashmirvalleysplendor': {
    category: 'Nature & Romance',
    highlights: ['Shikara Ride', 'Gulmarg Gondola', 'Mughal Gardens'],
    itinerary: 'Day 1: Arrival in Srinagar & Shikara Ride\nDay 2: Sonamarg Day Trip\nDay 3: Gulmarg Gondola Ride\nDay 4: Pahalgam Valleys\nDay 5: Srinagar Local Sightseeing\nDay 6: Departure',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewsCount: 156
  },
  'rajasthandesertsafari': {
    category: 'Adventure & Culture',
    highlights: ['Thar Desert', 'Camel Safari', 'Jaisalmer Fort'],
    itinerary: 'Day 1: Arrival in Jodhpur\nDay 2: Mehrangarh Fort\nDay 3: Transfer to Jaisalmer & Desert Camp\nDay 4: Jaisalmer Fort & Havelis\nDay 5: Departure',
    image: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewsCount: 112
  },
  'himachaltrekkingexpedition': {
    category: 'Trekking',
    highlights: ['Triund Trek', 'McLeod Ganj', 'Camping'],
    itinerary: 'Day 1: Arrival in Dharamshala\nDay 2: Trek to Triund\nDay 3: Triund Camping & Stargazing\nDay 4: Descent to McLeod Ganj\nDay 5: Dalai Lama Temple & Departure',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewsCount: 88
  },
  'andamanscuba&islandtour': {
    category: 'Water Sports',
    highlights: ['Scuba Diving', 'Havelock Island', 'Radhanagar Beach'],
    itinerary: 'Day 1: Arrival in Port Blair\nDay 2: Ferry to Havelock & Radhanagar Beach\nDay 3: Scuba Diving at Elephant Beach\nDay 4: Neil Island\nDay 5: Cellular Jail Light & Sound Show\nDay 6: Departure',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewsCount: 198
  },
  'udaipurromanticgetaway': {
    category: 'Luxury',
    highlights: ['Lake Pichola', 'City Palace', 'Private Boat Ride'],
    itinerary: 'Day 1: Arrival & Sunset Boat Ride\nDay 2: City Palace & Jag Mandir\nDay 3: Sajjangarh Fort (Monsoon Palace)\nDay 4: Departure',
    image: 'https://images.unsplash.com/photo-1615861111516-eb7bb02dc113?auto=format&fit=crop&w=1200&q=80',
    rating: 5.0,
    reviewsCount: 76
  },
  'mumbaicity&bollywoodtour': {
    category: 'City Tour',
    highlights: ['Gateway of India', 'Marine Drive', 'Bollywood Studio Tour'],
    itinerary: 'Day 1: Arrival & Marine Drive Evening\nDay 2: Gateway of India, Elephanta Caves\nDay 3: Bollywood Studio Tour & Departure',
    image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    reviewsCount: 310
  },
  'goamonsoonmagic': {
    category: 'Nature',
    highlights: ['Dudhsagar Waterfall', 'Spice Plantations', 'Lush Greenery'],
    itinerary: 'Day 1: Arrival & Panjim Walk\nDay 2: Dudhsagar Waterfalls Trek\nDay 3: Spice Plantation Tour\nDay 4: Departure',
    image: 'https://images.unsplash.com/photo-1560179406-1c6c60e0dcb4?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewsCount: 54
  },
  'keralaayurvedicwellness': {
    category: 'Wellness',
    highlights: ['Ayurvedic Massage', 'Yoga Retreat', 'Organic Food'],
    itinerary: 'Day 1: Arrival at Wellness Retreat\nDay 2: Consultation & Initial Therapies\nDay 3-5: Daily Yoga, Meditation, and Massages\nDay 6: Nature Walk & Cooking Class\nDay 7: Departure',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewsCount: 89
  },
  'kashmirhoneymoonspecial': {
    category: 'Romance',
    highlights: ['Houseboat Stay', 'Candlelight Dinner', 'Gondola Ride'],
    itinerary: 'Day 1: Welcome & Luxury Houseboat\nDay 2: Shikara Ride & Floating Market\nDay 3: Transfer to Gulmarg\nDay 4: Gondola Ride & Snow Activities\nDay 5: Pahalgam Valley Walk\nDay 6: Departure',
    image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=1200&q=80',
    rating: 5.0,
    reviewsCount: 132
  },
  'jaipur&agratriangle': {
    category: 'Heritage',
    highlights: ['Taj Mahal', 'Amber Fort', 'Fatehpur Sikri'],
    itinerary: 'Day 1: Arrival in Jaipur\nDay 2: Jaipur Sightseeing\nDay 3: Drive to Agra via Fatehpur Sikri\nDay 4: Sunrise at Taj Mahal & Agra Fort\nDay 5: Departure to Delhi/Home',
    image: 'https://images.unsplash.com/photo-1564507592208-027549c0ea91?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewsCount: 275
  },
  'andamanluxurycruise': {
    category: 'Luxury',
    highlights: ['Private Cruise', 'Beach Dinner', 'Snorkeling'],
    itinerary: 'Day 1: Arrival & Board Luxury Yacht\nDay 2: Cruise to Neil Island & Water Sports\nDay 3: Havelock Island Exploration\nDay 4: Barren Island Views\nDay 5: Disembark & Departure',
    image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewsCount: 45
  }
};

/**
 * Helper to get extended frontend data for a package.
 * It matches by standardizing the title.
 */
export const getExtendedPackageData = (pkgTitle) => {
  if (!pkgTitle) return null;
  const key = pkgTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  return FRONTEND_PACKAGE_CONFIG[key] || null;
};

/**
 * Seeder function to populate the backend database via API.
 * Requires an active admin token (handled by interceptors).
 */
export const seedBackendDatabase = async (destinationService, packageService) => {
  try {
    // 1. Create destinations
    const createdDestinations = [];
    for (const dest of DESTINATIONS_SEED) {
      try {
        const res = await destinationService.createDestination(dest);
        createdDestinations.push(res);
      } catch (err) {
        console.warn(`Failed to seed destination ${dest.name}:`, err);
      }
    }

    // Map destination names to their new backend IDs
    const destNameIdMap = {};
    createdDestinations.forEach(d => {
      destNameIdMap[d.name] = d.id;
    });

    // 2. Create packages using the new destination IDs
    let successCount = 0;
    for (const pkg of PACKAGES_SEED) {
      try {
        const destId = destNameIdMap[pkg.destinationName];
        if (!destId) {
          console.warn(`Skipping package ${pkg.title}: Destination ${pkg.destinationName} not found.`);
          continue;
        }

        const payload = {
          title: pkg.title,
          description: pkg.description,
          destinationId: destId, // Based on standard backend relationship mapping
          duration: pkg.duration,
          price: pkg.price,
          availableSeats: pkg.availableSeats
        };

        await packageService.createPackage(payload);
        successCount++;
      } catch (err) {
        console.warn(`Failed to seed package ${pkg.title}:`, err);
      }
    }
    
    return {
      success: true,
      destinationsCount: createdDestinations.length,
      packagesCount: successCount
    };
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
};

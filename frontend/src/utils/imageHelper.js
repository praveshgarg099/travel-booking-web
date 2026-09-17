// Curated high-resolution photography URLs for destinations and packages
export const DESTINATION_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Tropical Beach
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80', // Paris / City
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // Mountain Lake
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80', // Bali Sunset
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80', // Greece Santorini
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80', // Alpine Lake
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80', // Dubai Skylines
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', // Road Trip / Canyon
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', // Europe City
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80', // Swiss Alps
]

// Authentic destination photography for Yatramigo's core destinations
export const DESTINATION_PHOTO_MAP = {
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', // Goa Beach
  jaipur: 'https://images.unsplash.com/photo-1603284008272-a10ff74041c2?auto=format&fit=crop&w=1200&q=80', // Hawa Mahal Jaipur
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80', // Manali Snow Himalayas
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80', // Kerala Backwaters Alleppey
  kashmir: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80', // Kashmir Dal Lake
  udaipur: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?auto=format&fit=crop&w=1200&q=80', // Udaipur Lake Palace
  rishikesh: 'https://images.unsplash.com/photo-1600100397608-f010f4459f20?auto=format&fit=crop&w=1200&q=80', // Rishikesh Ganga
  andaman: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80', // Andaman Island
  jaisalmer: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1200&q=80', // Jaisalmer Desert Fort
  darjeeling: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80', // Darjeeling Tea Gardens
}

/**
 * Returns a high-res photo URL based on destination name, package ID, or title
 */
export const getPackageImage = (id = 1, title = '', destinationName = '') => {
  if (destinationName) {
    const key = destinationName.trim().toLowerCase()
    if (DESTINATION_PHOTO_MAP[key]) {
      return DESTINATION_PHOTO_MAP[key]
    }
  }

  // Check title for destination names as fallback
  const lowerTitle = (title || '').toLowerCase()
  for (const [destKey, photoUrl] of Object.entries(DESTINATION_PHOTO_MAP)) {
    if (lowerTitle.includes(destKey)) {
      return photoUrl
    }
  }

  const index = Math.abs(Number(id) || title.length || 0) % DESTINATION_PHOTOS.length
  return DESTINATION_PHOTOS[index]
}

import math
from sqlalchemy import select
from core.database import get_db
from models.load import Load

class FreightService:
    def haversine(self, lat1, lon1, lat2, lon2):
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        d = R * c
        return d

    async def search_loads(self, lat: float, lon: float, radius_km: int, vehicle_type: str = None):
        async with get_db() as session:
            # Fetch active loads with coordinates
            # For MVP, we fetch all active loads with coordinates and filter in Python
            # to avoid complex PostGIS setup if not enabled.
            query = select(Load).where(
                Load.status != 'completed',
                Load.origin_lat.isnot(None),
                Load.origin_lon.isnot(None)
            )
            
            result = await session.execute(query)
            loads = result.scalars().all()
            
            matches = []
            for load in loads:
                dist = self.haversine(lat, lon, load.origin_lat, load.origin_lon)
                if dist <= radius_km:
                    # Optional: Filter by vehicle type if we had that column or logic
                    # if vehicle_type and load.vehicle_type != vehicle_type: continue
                    
                    matches.append({
                        "id": load.id,
                        "title": load.title,
                        "origin": load.origin,
                        "destination": load.destination,
                        "distance_km": round(dist, 1),
                        "value": load.value
                    })
            
            # Sort by distance
            matches.sort(key=lambda x: x["distance_km"])
            return matches

freight_service = FreightService()

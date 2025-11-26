import { MapComponent } from './Map'

interface RouteMapProps {
    origin: { lat: number; lng: number; label: string }
    destination: { lat: number; lng: number; label: string }
    className?: string
}

export function RouteMap({ origin, destination, className }: RouteMapProps) {
    const markers = [
        { latitude: origin.lat, longitude: origin.lng, label: origin.label },
        { latitude: destination.lat, longitude: destination.lng, label: destination.label }
    ]

    // Calculate center
    const centerLat = (origin.lat + destination.lat) / 2
    const centerLng = (origin.lng + destination.lng) / 2

    return (
        <MapComponent
            initialViewState={{
                latitude: centerLat,
                longitude: centerLng,
                zoom: 7
            }}
            markers={markers}
            className={className}
        />
    )
}

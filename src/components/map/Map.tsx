import Map, { NavigationControl, Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface MapComponentProps {
    initialViewState?: {
        longitude: number
        latitude: number
        zoom: number
    }
    markers?: Array<{
        longitude: number
        latitude: number
        label?: string
    }>
    className?: string
}

export function MapComponent({
    initialViewState = {
        longitude: -46.6333,
        latitude: -23.5505,
        zoom: 9
    },
    markers = [],
    className = "w-full h-full rounded-lg"
}: MapComponentProps) {
    if (!MAPBOX_TOKEN) {
        return (
            <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
                Mapbox Token not configured
            </div>
        )
    }

    return (
        <div className={className}>
            <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
            >
                <NavigationControl position="top-right" />
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        longitude={marker.longitude}
                        latitude={marker.latitude}
                        color="red"
                    />
                ))}
            </Map>
        </div>
    )
}

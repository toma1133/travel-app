import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { PlaceVM } from "../../models/types/PlaceTypes";

type PlaceMapViewProps = {
    places: PlaceVM[] | null;
};

const PlaceMapView = ({ places }: PlaceMapViewProps) => {
    return (
        <div>
            <MapContainer
                center={{ lat: 51.505, lng: -0.09 }}
                zoom={13}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={{ lat: 51.505, lng: -0.09 }}>
                    <Popup>
                        A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default PlaceMapView;

import {
  React,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Circle,
  InfoWindowF,
} from "@react-google-maps/api";
import Places from "./Places";
import {
  googleAPIKey,
  libraries,
  closeOptions,
  radius,
  defaultLat,
  defaultLng,
  getUrl,
  petStoreIcon,
  vetIcon,
  homeIcon,
} from "../../helpers/GooglePlacesAPI";
import axios from "axios";
import InfoBox from "./InfoBox";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import Slider from "./Slider";

export default function Map() {
  const [state, setState] = useState({
    location: null,
    selectedCenter: null,
    placeType: null,
    nearbyLocations: [],
    circle: false,
    sliderValue: 5000,
  });

  // console.log("place type", placeType);
  // console.log("nearby", nearbyLocations);
  // console.log("opening hours", selectedCenter);
  // console.log("circle", state.circle);

  useEffect(() => {
    console.log("circleref", circleRef);

    if (state.location) {
      setState((prev) => ({ ...prev, circle: true }));

      if (state.placeType) {
        const currentLat = state.location.lat;
        const currentLng = state.location.lng;

        axios
          .get(
            getUrl(currentLat, currentLng, state.sliderValue, state.placeType)
          )
          .then((res) =>
            setState((prev) => ({
              ...prev,
              nearbyLocations: res.data.results,
            }))
          )
          .catch((err) => console.log(err));
      }
    }
  }, [state.placeType, state.location, state.sliderValue]);

  // MapRef is an instance of <GoogleMap />. This hook lets us reference this without re-rendering
  const mapRef = useRef();
  const circleRef = useRef();

  // Coordinates for Oakridge Mall
  const center = useMemo(() => ({ lat: defaultLat, lng: defaultLng }), []);
  const options = useMemo(
    () => ({
      mapId: "30817c9c0541d59e",
      disableDefaultUI: false,
    }),
    []
  );

  // a function that generates a version on initial render, and won't re-generate unless dependencies change (we have none in arr)
  // (for optimization of re-rendering)
  const onLoad = useCallback((map) => (mapRef.current = map), []);

  const onUnmount = () => {
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }
  };

  const onCircleLoad = (circle) => {
    circleRef.current = circle;
  };

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: googleAPIKey,
    libraries,
  });

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="map-page-container">
      <div className="map-controls">
        <h1 className="map-text">Search</h1>

        <Places
          setLocation={(position) => {
            setState((prev) => ({
              ...prev,
              location: position,
              circle: false,
            }));
            mapRef.current.panTo(position);
          }}
          circleRef={circleRef}
        />

        <ToggleButtonGroup
          className="toggle-button"
          type="radio"
          name="options"
        >
          <ToggleButton
            id="tbg-radio-1"
            value={1}
            onClick={() =>
              setState((prev) => ({ ...prev, placeType: "veterinary_care" }))
            }
          >
            Veterinarians
          </ToggleButton>

          <ToggleButton
            id="tbg-radio-2"
            value={2}
            onClick={() =>
              setState((prev) => ({ ...prev, placeType: "pet_store" }))
            }
          >
            Pet Stores
          </ToggleButton>
        </ToggleButtonGroup>

        <Slider
          sliderValue={state.sliderValue}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              sliderValue: parseInt(e.target.value),
            }))
          }
        />
      </div>

      <div className="map">
        <GoogleMap
          zoom={12}
          center={center}
          mapContainerClassName="map-container"
          options={options}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {state.location && (
            <Marker position={state.location} icon={homeIcon} />
          )}

          {circleRef.current ? (
            <Circle
              ref={onCircleLoad}
              center={state.location}
              radius={state.sliderValue + 500}
              options={closeOptions}
            />
          ) : null}

          {state.nearbyLocations &&
            state.nearbyLocations.map((location, index) => {
              let lat = location.geometry.location.lat;
              let lng = location.geometry.location.lng;
              return (
                <Marker
                  key={index}
                  position={{ lat, lng }}
                  icon={
                    state.placeType === "pet_store" ? petStoreIcon : vetIcon
                  }
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      selectedCenter: {
                        lat,
                        lng,
                        name: location.name,
                        address: location.vicinity,
                        open: location.opening_hours,
                        rating: location.rating,
                        user_ratings: location.user_ratings_total,
                      },
                    }))
                  }
                />
              );
            })}

          {state.selectedCenter && (
            <InfoWindowF
              onCloseClick={() => {
                setState((prev) => ({ ...prev, selectedCenter: null }));
              }}
              position={{
                lat: state.selectedCenter.lat + 0.00001,
                lng: state.selectedCenter.lng,
              }}
            >
              <InfoBox
                name={state.selectedCenter.name}
                address={state.selectedCenter.address}
                open={state.selectedCenter.open}
                rating={state.selectedCenter.rating}
                user_rating={state.selectedCenter.user_ratings}
              />
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

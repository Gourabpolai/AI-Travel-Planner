import { searchPlaces } from "../api/placeApi";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTripById, saveSelectedPlaces } from "../api/tripApi";

function DestinationExplorer() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [trip, setTrip] = useState(null);
  
   const { tripId } = useParams();
  const togglePlace = (place) => {
  const exists = selectedPlaces.some((p) => p.id === place.id);

  if (exists) {
    setSelectedPlaces(
      selectedPlaces.filter((p) => p.id !== place.id)
    );
  } else {
    setSelectedPlaces([...selectedPlaces, place]);
  }
};

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const data = await searchPlaces(query);

      setPlaces(data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch places");
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  const loadTripPlaces = async () => {
    try {
      setLoading(true);

      const tripData = await getTripById(tripId);
      setTrip(tripData);
      setQuery(tripData.destination);

      const places = await searchPlaces(tripData.destination);
      setPlaces(places);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  loadTripPlaces();
}, [tripId]);

  const handleSavePlaces = async () => {
  try {
    await saveSelectedPlaces(tripId, selectedPlaces);

    alert("✅ Places saved successfully!");
  } catch (error) {
    console.error(error);
    console.log(error.response?.data);
    alert(error.response?.data?.message || "Failed to save places");
  }
};

  return (
    <div className="max-w-6xl mx-auto p-8">

      <div className="text-center mb-10">

  <h1 className="text-5xl font-extrabold text-gray-900">
  🌍 {trip ? `Explore ${trip.destination}` : "Destination Explorer"}
</h1>

<p className="mt-4 text-lg text-gray-600">
  {trip
    ? `Discover the best places to visit in ${trip.destination}.`
    : "Discover amazing places for your next adventure."}
</p>

</div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">

  <input
    type="text"
    placeholder="Search destinations, beaches, temples..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    }}
    className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

  <button
    onClick={handleSearch}
    className="rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold hover:bg-blue-700 transition"
  >
    Search
  </button>

</div>

      {loading && (
        <p>Loading places...</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {places.map((place) => (

          <div
            key={place.id}
           className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition duration-300"
          >

            <h2 className="text-xl font-semibold">
              {place.name}
            </h2>

           <span className="inline-block mt-3 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold">
  {place.category}
</span>

            <p className="text-gray-600 mt-3">
              {place.description}
            </p>

            <div className="mt-5 space-y-2 text-gray-600">

  <p>
    ⏰ <span className="font-medium">Best Time:</span> {place.bestTime}
  </p>

  <p>
    ⌛ <span className="font-medium">Visit:</span> {place.estimatedVisitHours} Hours
  </p>

</div>

                   <button
                        onClick={() => togglePlace(place)}
                              className={`mt-5 w-full py-2 rounded-lg text-white transition ${
                              selectedPlaces.some((p) => p.id === place.id)
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-blue-600 hover:bg-blue-700"
                          }`}
                                 >
                                    {selectedPlaces.some((p) => p.id === place.id)
                                   ? "✓ Selected"
                                  : "Select"}
                           </button>

          </div>

          

        ))}
         
      </div>

     {selectedPlaces.length > 0 && (
  <div className="mt-8 flex justify-end">
    <button
      onClick={handleSavePlaces}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
    >
      Save Selected Places ({selectedPlaces.length})
    </button>
  </div>
)}

    </div>
  );
}

export default DestinationExplorer;
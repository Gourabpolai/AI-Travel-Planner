import { useEffect, useState } from "react";
import { getAllTrips } from "../../api/tripApi";
import TripCard from "../../components/trips/TripCard";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
  try {
    
    const response = await getAllTrips();

    console.log("Trips API Response:", response);

    setTrips(response.trips);
  } catch (err) {
    console.error(err);
    setError(err.response?.data?.message || "Failed to fetch trips");
  } finally {
    setLoading(false);
  }
};
  if (loading) {
    return <h2 className="p-6">Loading trips...</h2>;
  }

  if (error) {
    return <h2 className="p-6 text-red-500">{error}</h2>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Trips</h1>

      {trips.length === 0 ? (
        <p>No trips found.</p>
      ) : (
        <div className="grid gap-6">
          {trips.map((trip) => (

            <TripCard key={trip._id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Trips;
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTripById } from "../../api/tripApi";
import { useNavigate } from "react-router-dom";
import { deleteTrip } from "../../api/tripApi";

function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrip();
    
  }, []);

  const fetchTrip = async () => {
    try {
      const response = await getTripById(tripId);
      setTrip(response.trip);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trip");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this trip?"
  );

  if (!confirmDelete) return;

  try {
    await deleteTrip(tripId);

    alert("Trip deleted successfully!");

    navigate("/trips");
  } catch (err) {
    alert(err.response?.data?.message || "Failed to delete trip");
  }
};

  if (loading) {
    return <h2 className="p-6">Loading...</h2>;
  }

  if (error) {
    return <h2 className="p-6 text-red-500">{error}</h2>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">{trip.title}</h1>

      <div className="border rounded-xl p-6 shadow-md space-y-4">
        <p>
          <strong>Destination:</strong> {trip.destination}
        </p>

        <p>
          <strong>Start Date:</strong>{" "}
          {new Date(trip.startDate).toLocaleDateString()}
        </p>

        <p>
          <strong>End Date:</strong>{" "}
          {new Date(trip.endDate).toLocaleDateString()}
        </p>

        <p>
          <strong>Budget:</strong> ₹{trip.budget}
        </p>

        <p>
          <strong>Travelers:</strong> {trip.travelers}
        </p>

        <p>
          <strong>Status:</strong> {trip.status}
        </p>
      </div>
      <div className="mt-8">
        <button
             onClick={handleDelete}
                 className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
             >
            Delete Trip
            </button>
          </div>
    </div>

    
  );
}

export default TripDetails;
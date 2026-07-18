import { useNavigate } from "react-router-dom";

function TripCard({ trip }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/trips/${trip._id}`)}
      className="rounded-xl border p-6 shadow-md bg-white cursor-pointer hover:shadow-lg transition duration-300"
    >
      <h2 className="text-2xl font-semibold">{trip.title}</h2>

      <p className="mt-2">
        <strong>Destination:</strong> {trip.destination}
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

      <p>
        <strong>Start:</strong>{" "}
        {new Date(trip.startDate).toLocaleDateString()}
      </p>

      <p>
        <strong>End:</strong>{" "}
        {new Date(trip.endDate).toLocaleDateString()}
      </p>
    </div>
  );
}

export default TripCard;
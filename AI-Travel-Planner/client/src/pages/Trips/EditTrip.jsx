import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTripById, updateTrip } from "../../api/tripApi";

function EditTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    travelers: "",
    status: "Planning",
  });

  useEffect(() => {
    fetchTrip();
  }, []);

  const fetchTrip = async () => {
    try {
      const response = await getTripById(tripId);

      const trip = response.trip;

      setFormData({
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate.split("T")[0],
        endDate: trip.endDate.split("T")[0],
        budget: trip.budget,
        travelers: trip.travelers,
        status: trip.status,
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateTrip(tripId, formData);
      alert("Trip updated successfully!");
      navigate(`/trips/${tripId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update trip");
    }
  };

  if (loading) {
    return <h2 className="p-6">Loading...</h2>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Trip</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Trip Title"
          className="w-full border p-3 rounded"
        />

        <input
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          placeholder="Destination"
          className="w-full border p-3 rounded"
        />

        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          placeholder="Budget"
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          name="travelers"
          value={formData.travelers}
          onChange={handleChange}
          placeholder="Travelers"
          className="w-full border p-3 rounded"
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        >
          <option>Planning</option>
          <option>Booked</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Update Trip
        </button>
      </form>
    </div>
  );
}

export default EditTrip;
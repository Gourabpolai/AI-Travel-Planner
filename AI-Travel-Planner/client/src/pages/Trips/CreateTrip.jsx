import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "../../api/tripApi";

function CreateTrip() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    travelers: 1,
    status: "Planning",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createTrip(formData);

      navigate("/trips");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Trip</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {error && (
          <p className="text-red-500">{error}</p>
        )}

        <input
          type="text"
          name="title"
          placeholder="Trip Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          required
        />

        <input
          type="text"
          name="destination"
          placeholder="Destination"
          value={formData.destination}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="border rounded-lg p-3"
            required
          />

          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="border rounded-lg p-3"
            required
          />
        </div>

        <input
          type="number"
          name="budget"
          placeholder="Budget"
          value={formData.budget}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />

        <input
          type="number"
          name="travelers"
          placeholder="Number of Travelers"
          value={formData.travelers}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Create Trip"}
        </button>

      </form>
    </div>
  );
}

export default CreateTrip;
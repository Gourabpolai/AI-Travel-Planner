import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTripById } from "../../api/tripApi";
import { useNavigate } from "react-router-dom";
import { deleteTrip } from "../../api/tripApi";
import {
  generateItinerary,
  getItinerary,
} from "../../api/itineraryApi";
import {
  MapPin,
  CalendarDays,
  Wallet,
  Users,
  Flag,
  Pencil,
  Trash2,
  Sparkles,
  RefreshCw,
  Clock,
} from "lucide-react";

function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itinerary, setItinerary] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTrip();
   fetchItinerary();

    
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

  const fetchItinerary = async () => {
  try {
    const response = await getItinerary(tripId);

    setItinerary(response.data);
  } catch (err) {
    // No itinerary yet
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

const handleGenerateItinerary = async () => {
  try {
    setGenerating(true);

    const response = await generateItinerary(tripId);

    setItinerary(response.data);

    alert("Itinerary generated successfully!");
  } catch (err) {
    alert(err.response?.data?.message || "Failed to generate itinerary");
  } finally {
    setGenerating(false);
  }
};


  if (loading) {
    return <h2 className="p-6">Loading...</h2>;
  }

  if (error) {
    return <h2 className="p-6 text-red-500">{error}</h2>;
  }
  console.log("Trip:", trip);
console.log("Itinerary:", itinerary);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
<div className="mb-10">
  <h1 className="text-5xl font-extrabold text-gray-900 capitalize">
  {trip.title}
</h1>

<p className="mt-3 text-gray-500 text-lg">
  ✈️ Plan, manage and explore your journey with AI.
</p>
</div>
<div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    <div>
<div className="flex items-center gap-2 text-gray-500 text-sm">        
        <MapPin size={18} />
        <span>Destination</span>
        </div>
        
      <h3 className="text-xl font-semibold">
        {trip.destination}
      </h3>
    </div>

    <div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Wallet size={18} />
          <span>Budget</span>
        
      </div>
      <h3 className="text-xl font-semibold">
        ₹ {trip.budget}
      </h3>
    </div>

    <div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Users size={18} />
          <span>Travelers</span>
        </div>
      <h3 className="text-xl font-semibold">
        {trip.travelers}
      </h3>
    </div>

    <div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Flag size={18} />
          <span>Status</span>
        </div>
      
      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full">
        {trip.status}
      </span>
    </div>

    <div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
          <CalendarDays size={18} />
          <span>Start Date</span>
      </div>
      <h3 className="text-lg font-semibold">
        {new Date(trip.startDate).toLocaleDateString()}
      </h3>
    </div>

    <div>
      <div className="flex items-center gap-2 text-gray-500 text-sm">
          <CalendarDays size={18} />
          <span>End Date</span>
      </div>
      <h3 className="text-lg font-semibold">
        {new Date(trip.endDate).toLocaleDateString()}
      </h3>
    </div>

  </div>
</div>
     <div className="flex flex-wrap gap-4 mt-8">

  <button
    onClick={() => navigate(`/trips/${tripId}/edit`)}
 className="flex items-center justify-center gap-2 w-40 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"  >
   <Pencil size={18} />
<span>Edit Trip</span>
  </button>

  <button
    onClick={handleDelete}
 className="flex items-center justify-center gap-2 w-40 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition" > 
   <Trash2 size={18} />
    <span>Delete Trip</span>
  </button>

  {!itinerary && (
    <button
      onClick={handleGenerateItinerary}
      disabled={generating}
  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white transition"
    >
       {generating ? (
    <>
      <RefreshCw className="animate-spin" size={18} />
      <span>{generating ? "Regenerating..." : "Regenerate"}</span>
    </>
  ) : (
    <>
      <Sparkles size={18} />
      <span>Generate AI Itinerary</span>
    </>
  )}
    </button>
  )}

</div>
{itinerary && (
  <div className="mt-12">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
  <div>
    <div className="flex items-center gap-2">
      <Sparkles size={28} className="text-purple-600" />
      <h2 className="text-3xl font-bold text-gray-800">
        AI Travel Itinerary
      </h2>
    </div>

    <p className="text-gray-500 mt-2">
      Personalized travel plan generated by AI
    </p>
  </div>

  <button
    onClick={handleGenerateItinerary}
    disabled={generating}
    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white px-5 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
  >
    <RefreshCw
      size={18}
      className={generating ? "animate-spin" : ""}
    />
    {generating ? "Generating..." : "Regenerate"}
  </button>
</div>

<hr className="border-gray-200 mb-8" />

    <div className="space-y-10">
      {itinerary?.days?.map((day) => (
        <div
          key={day.day}
          className="bg-white rounded-2xl shadow-lg border overflow-hidden"
        >
          <div className="bg-blue-600 text-white px-6 py-4">
            <h3 className="text-2xl font-bold">
              Day {day.day}
            </h3>

            <p className="opacity-90">{day.title}</p>
          </div>

          <div className="p-6 space-y-4">
            {day.activities?.map((activity, index) => (
              <div
                key={index}
                  className="bg-white rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 hover:border-blue-200"              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold">
                      {activity.title}
                    </h4>

                    <p className="text-gray-600 mt-2">
                      {activity.description}
                    </p>

                   <div className="flex flex-wrap gap-3 mt-4">
                     <span className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        <Clock size={16} />
                            {activity.time}
                                </span>

                               <span className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                                     <MapPin size={16} />
                                        {activity.location}
                                         </span>
                                </div>
                  </div>

                  <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                    <Wallet size={16} />
                        ₹{activity.estimatedCost}
                     </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
</div>
);
}

export default TripDetails;
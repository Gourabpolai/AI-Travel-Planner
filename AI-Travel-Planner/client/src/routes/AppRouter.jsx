import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Trips from "../pages/Trips/Trips";
import CreateTrip from "../pages/Trips/CreateTrip";
import TripDetails from "../pages/Trips/TripDetails";
import Profile from "../pages/Profile/Profile";
import NotFound from "../pages/NotFound";
import EditTrip from "../pages/Trips/EditTrip";
import Layout from "../components/layout/Layout";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/new" element={<CreateTrip />} />
          <Route path="/trips/:tripId" element={<TripDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/trips/:tripId/edit" element={<EditTrip />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
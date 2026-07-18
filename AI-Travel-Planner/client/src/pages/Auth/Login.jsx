

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { loginUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

function Login() {
     const navigate = useNavigate();
const { login } = useAuth();

const [formData, setFormData] = useState({
  email: "",
  password: "",
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

    const response = await loginUser(formData);

    login(response.user, response.token);

    navigate("/");
  } catch (err) {
    setError(err.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">

        <h1 className="text-4xl font-bold text-center text-cyan-600">
          TripSync
        </h1>

        <p className="mt-2 text-center text-slate-500">
          Welcome back!
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
              {error && (
             <p className="text-red-500 text-sm">
              {error}
              </p>
                  )}
          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>

        </form>

        <p className="mt-6 text-center text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-cyan-600 hover:underline"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
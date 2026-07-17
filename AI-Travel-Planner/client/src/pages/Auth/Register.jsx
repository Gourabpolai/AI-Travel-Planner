import { Link } from "react-router-dom";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

function Register() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">

        <h1 className="text-4xl font-bold text-center text-cyan-600">
          TripSync
        </h1>

        <p className="mt-2 text-center text-slate-500">
          Create your account
        </p>

        <form className="mt-8 space-y-5">

          <Input
            label="Name"
            placeholder="Enter your name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
          />

          <Button type="submit">
            Register
          </Button>

        </form>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-cyan-600 hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;
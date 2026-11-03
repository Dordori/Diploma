
import { useState } from "react";
import { Link, useNavigate } from "react-router";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            maxLength={150}
            required
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            maxLength={255}
            required
          />
        </label>

        <label>
          Password (at least 8 characters)
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            maxLength={72}
            required
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Creating account..." : "Register"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <p>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}

export default Register;

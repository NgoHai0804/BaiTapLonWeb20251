// src/ForgotPassword.js
import React, { useState } from "react";
import "./ForgotPassword.css";

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Giả lập gửi email
    setSent(true);
  };

  return (
    <div className="forgot-container">
      <div className="forgot-box">
        {!sent ? (
          <>
            <h2>Forgot Your Password?</h2>
            <p>Enter your email and we'll send you instructions.</p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button type="submit" className="submit-btn">
                Send Reset Link
              </button>
            </form>

            <p className="back-text" onClick={onBack}>
              ← Back to Login
            </p>
          </>
        ) : (
          <>
            <h2>Check Your Email 📩</h2>
            <p>
              We've sent a password reset link to:
              <br />
              <strong>{email}</strong>
            </p>
            <button className="submit-btn" onClick={onBack}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;

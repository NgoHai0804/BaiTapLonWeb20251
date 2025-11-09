// src/LoginForm.js
import React, { useState } from "react";
import "./LoginForm.css";

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin(!isLogin);

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isLogin ? "Welcome back!" : "Create an account"}</h2>
        <p>
          {isLogin
            ? "We're so excited to see you again!"
            : "Join us and get started today!"}
        </p>

        <form>
          <input type="email" placeholder="Email*" required />
          <input type="password" placeholder="Password*" required />
          {!isLogin && (
            <input type="password" placeholder="Confirm Password*" required />
          )}

          {isLogin && (
            <a href="#" className="forgot-password">
              Forgot your password?
            </a>
          )}

          <button type="submit" className="login-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Need an account?" : "Already have an account?"}{" "}
          <span onClick={toggleForm} className="toggle-link">
            {isLogin ? "Register" : "Login"}
          </span>
        </p>

        <div className="divider">or</div>

        <button className="google-btn">
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
          />
          Continue with Google
        </button>

        <button className="facebook-btn">
          <img
            src="https://www.svgrepo.com/show/475647/facebook-color.svg"
            alt="Facebook"
          />
          Continue with Facebook
        </button>
      </div>
    </div>
  );
}

export default LoginForm;

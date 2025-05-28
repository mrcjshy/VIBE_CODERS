import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Using restored images from public folder
const analyticsImage = "/data_analytics_image.png";
const baabaaLogo = "/baa_baa_login_logo.png";

// Reusable Input Field Component
const InputField = ({ id, name, type, placeholder, value, onChange, icon, showPasswordToggle, onTogglePassword, showPassword }) => {
  const getIcon = () => {
    switch (icon) {
      case 'email':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'password':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return <span className="text-gray-400 text-sm sm:text-base">{icon}</span>;
    }
  };

  const getPasswordToggleIcon = () => {
    if (showPassword) {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {getIcon()}
      </div>
      <input
        id={id}
        name={name}
        type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
        required
        className={`w-full pl-10 ${showPasswordToggle ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {showPasswordToggle && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition duration-200"
            onClick={onTogglePassword}
          >
            {getPasswordToggleIcon()}
          </button>
        </div>
      )}
    </div>
  );
};

// Left Section - Illustration Component
const IllustrationSection = () => {
  return (
    <div className="w-full md:w-1/2 bg-white relative overflow-hidden flex flex-col">
      {/* Subtle Dot Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ opacity: 0.27 }}>
          {/* Creating refined dot pattern like the reference image */}
          <div className="grid grid-cols-24 gap-3 h-full w-full pt-12 p-6">
            {Array.from({ length: 24 * 18 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-gray-500 rounded-full"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full w-full relative z-10 p-6 sm:p-8 md:p-12 lg:p-16">
        {/* Main Title - Centered and single line */}
        <div className="w-full text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold leading-tight whitespace-nowrap" style={{ color: '#68448C' }}>
            Inventory Management System
          </h1>
        </div>
        
        {/* 3D Analytics Illustration - Centered in remaining space */}
        <div className="flex-1 flex justify-center items-center">
          <div className="flex justify-center w-full">
            <img 
              src={analyticsImage} 
              alt="3D Analytics Illustration" 
              className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Right Section - Login Form Component
const LoginForm = ({ formData, formError, isLoading, handleChange, handleSubmit, showPassword, handleTogglePassword }) => {
  return (
    <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-white min-h-screen md:min-h-0 relative">
      {/* Vertical Line - Not full length, positioned in center */}
      <div className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-300" style={{ height: '90%', width: '3px' }}></div>
      
      <div className="max-w-sm sm:max-w-md w-full space-y-6 sm:space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img 
            src={baabaaLogo} 
            alt="Baa Baa Logo" 
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 object-contain mb-4 sm:mb-6"
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Hello Again!</h2>
          <p className="text-sm sm:text-base text-gray-600">Welcome Back</p>
        </div>

        {/* Error Message */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm">
            {formError}
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4">
            {/* Email Input */}
            <InputField
              id="username"
              name="username"
              type="text"
              placeholder="Email Address"
              value={formData.username}
              onChange={handleChange}
              icon="email"
            />

            {/* Password Input */}
            <InputField
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              icon="password"
              showPasswordToggle={true}
              onTogglePassword={handleTogglePassword}
              showPassword={showPassword}
            />
          </div>

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-full text-white text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              style={{
                backgroundColor: '#68448C',
                focusRingColor: '#68448C'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a3a7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#68448C'}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-center">
            <Link 
              to="/forgot-password" 
              className="text-xs sm:text-sm text-gray-600 transition duration-200"
              style={{ ':hover': { color: '#68448C' } }}
              onMouseEnter={(e) => e.target.style.color = '#68448C'}
              onMouseLeave={(e) => e.target.style.color = '#6B7280'}
            >
              Forgot Password
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Login Layout Component
const LoginLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {children}
    </div>
  );
};

// Main Login Component
const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Simple validation
    if (!formData.username || !formData.password) {
      setFormError('Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting login with:', { username: formData.username, password: '***' });
      
      await login(formData);
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error caught:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'Login failed. Please try again.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.log('Setting form error:', errorMessage);
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginLayout>
      <IllustrationSection />
      <LoginForm 
        formData={formData}
        formError={formError}
        isLoading={isLoading}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        showPassword={showPassword}
        handleTogglePassword={handleTogglePassword}
      />
    </LoginLayout>
  );
};

export default Login; 
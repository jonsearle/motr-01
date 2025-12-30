"use client";

import { useState, useEffect } from "react";
import { getGarageSiteContent, upsertGarageSiteContent } from "@/lib/db";
import type { GarageSiteContent, Service, Review } from "@/types/db";

export default function WebsitePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Business info
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [aboutText, setAboutText] = useState('');
  
  // Contact details
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Services
  const [services, setServices] = useState<Service[]>([{ service_name: '', description: '' }]);
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([{ customer_name: '', review_text: '', stars: 3 }]);
  const [googleReviewsLink, setGoogleReviewsLink] = useState('');
  
  const [contentId, setContentId] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const content = await getGarageSiteContent();
      
      if (content) {
        setContentId(content.id);
        setBusinessName(content.business_name || '');
        setTagline(content.tagline || '');
        setAboutText(content.about_text || '');
        setAddressLine1(content.address_line1 || '');
        setAddressLine2(content.address_line2 || '');
        setCity(content.city || '');
        setPostcode(content.postcode || '');
        setPhone(content.phone || '');
        setEmail(content.email || '');
        setGoogleReviewsLink(content.google_reviews_link || '');
        
        // Initialize services - use existing or one empty row
        if (content.services && content.services.length > 0) {
          setServices(content.services);
        } else {
          setServices([{ service_name: '', description: '' }]);
        }
        
        // Initialize reviews - use existing or one empty row
        if (content.reviews && content.reviews.length > 0) {
          setReviews(content.reviews);
        } else {
          setReviews([{ customer_name: '', review_text: '', stars: 3 }]);
        }
      } else {
        // No content exists - use defaults (already set in state)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content. Please try again.';
      setError(`Failed to load content: ${errorMessage}`);
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    setEmailError(null);
    setError(null);
    
    // Business info validation
    if (!businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    
    if (!tagline.trim()) {
      setError('One line description is required');
      return false;
    }
    
    if (!aboutText.trim()) {
      setError('About Us description is required');
      return false;
    }
    
    // Contact details validation
    if (!addressLine1.trim()) {
      setError('Address Line 1 is required');
      return false;
    }
    
    if (!addressLine2.trim()) {
      setError('Address Line 2 is required');
      return false;
    }
    
    if (!city.trim()) {
      setError('City is required');
      return false;
    }
    
    if (!postcode.trim()) {
      setError('Post code is required');
      return false;
    }
    
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setError('Please fix validation errors');
      return false;
    }
    
    // Services validation - filter out empty rows and validate remaining
    const validServices = services.filter(s => s.service_name.trim() && s.description.trim());
    if (validServices.length === 0) {
      setError('At least one service with both name and description is required');
      return false;
    }
    
    // Reviews validation - filter out empty rows and validate remaining
    const validReviews = reviews.filter(r => 
      r.customer_name.trim() && r.review_text.trim() && r.stars >= 1 && r.stars <= 5
    );
    if (validReviews.length === 0) {
      setError('At least one review with customer name, review text, and stars is required');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Filter out empty services and reviews
      const validServices = services.filter(s => s.service_name.trim() && s.description.trim());
      const validReviews = reviews.filter(r => 
        r.customer_name.trim() && r.review_text.trim() && r.stars >= 1 && r.stars <= 5
      );
      
      // Generate ID if new
      const id = contentId || crypto.randomUUID();
      
      const content: GarageSiteContent = {
        id,
        business_name: businessName.trim(),
        tagline: tagline.trim(),
        about_text: aboutText.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim(),
        city: city.trim(),
        postcode: postcode.trim(),
        phone: phone.trim(),
        email: email.trim(),
        services: validServices,
        reviews: validReviews,
        google_reviews_link: googleReviewsLink.trim() || undefined,
        created_at: contentId ? new Date().toISOString() : new Date().toISOString(),
      };

      const saved = await upsertGarageSiteContent(content);
      setContentId(saved.id);
      setSuccess('Website updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save content. Please try again.');
      console.error('Error saving content:', err);
    } finally {
      setSaving(false);
    }
  };

  // Service management
  const addService = () => {
    if (services.length < 9) {
      setServices([...services, { service_name: '', description: '' }]);
    }
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: 'service_name' | 'description', value: string) => {
    setServices(services.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ));
  };

  // Review management
  const addReview = () => {
    if (reviews.length < 3) {
      setReviews([...reviews, { customer_name: '', review_text: '', stars: 3 }]);
    }
  };

  const removeReview = (index: number) => {
    if (reviews.length > 1) {
      setReviews(reviews.filter((_, i) => i !== index));
    }
  };

  const updateReview = (index: number, field: 'customer_name' | 'review_text' | 'stars', value: string | number) => {
    setReviews(reviews.map((r, i) => 
      i === index ? { ...r, [field]: value } : r
    ));
  };

  const adjustStars = (index: number, delta: number) => {
    const review = reviews[index];
    const newStars = Math.max(1, Math.min(5, review.stars + delta));
    updateReview(index, 'stars', newStars);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4 mb-6">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          View website
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Describe Your Business Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Describe your business:</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter business name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">One line description</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter one line description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{'\'About Us\' description'}</label>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter About Us description"
            />
          </div>
        </div>
      </section>

      {/* Your Contact Details Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Your contact details:</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              placeholder="Address Line 1"
            />
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Address Line 2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post code</label>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter post code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              onBlur={() => {
                if (email && !validateEmail(email)) {
                  setEmailError('Please enter a valid email address');
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Services you want to promote:</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Service Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Service Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={service.service_name}
                      onChange={(e) => updateService(index, 'service_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Service name"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Service description"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      disabled={services.length === 1}
                      className={`text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed ${
                        services.length === 1 ? 'opacity-50' : ''
                      }`}
                      title="Delete service"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {services.length < 9 && (
          <button
            type="button"
            onClick={addService}
            className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add a service
          </button>
        )}
      </section>

      {/* Customer Reviews Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Your Customer Reviews:</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stars</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Review</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reviews.map((review, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={review.customer_name}
                      onChange={(e) => updateReview(index, 'customer_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Customer name"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustStars(index, -1)}
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={review.stars}
                        onChange={(e) => updateReview(index, 'stars', parseInt(e.target.value) || 1)}
                        min="1"
                        max="5"
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => adjustStars(index, 1)}
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={review.review_text}
                      onChange={(e) => updateReview(index, 'review_text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Review text"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeReview(index)}
                      disabled={reviews.length === 1}
                      className={`text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed ${
                        reviews.length === 1 ? 'opacity-50' : ''
                      }`}
                      title="Delete review"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reviews.length < 3 && (
          <button
            type="button"
            onClick={addReview}
            className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add a review
          </button>
        )}
      </section>

      {/* Google Reviews Link Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Link to your google reviews:</h2>
        <div>
          <input
            type="text"
            value={googleReviewsLink}
            onChange={(e) => setGoogleReviewsLink(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Google reviews link (optional)"
          />
        </div>
      </section>

      {/* Form Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving ? 'Updating...' : 'Update website'}
        </button>
      </div>
    </div>
  );
}

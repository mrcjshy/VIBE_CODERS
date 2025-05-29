import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { settingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    defaultDateRange: 30,
    enableEmailNotifications: true,
    enableLowStockAlerts: true,
    autoBackupInterval: 24,
    maxTransactionHistory: 365
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAllSettings();
      
      // Convert settings array to object
      const settingsData = response.data || {};
      setSettings({
        lowStockThreshold: settingsData.lowStockThreshold || 10,
        defaultDateRange: settingsData.defaultDateRange || 30,
        enableEmailNotifications: settingsData.enableEmailNotifications !== undefined ? settingsData.enableEmailNotifications : true,
        enableLowStockAlerts: settingsData.enableLowStockAlerts !== undefined ? settingsData.enableLowStockAlerts : true,
        autoBackupInterval: settingsData.autoBackupInterval || 24,
        maxTransactionHistory: settingsData.maxTransactionHistory || 365
      });
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear success message when user starts making changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert settings to the format expected by the backend
      const settingsToSave = {};
      Object.entries(settings).forEach(([key, value]) => {
        settingsToSave[key] = {
          value,
          type: typeof value === 'boolean' ? 'boolean' : 'number',
          description: `${key} setting`
        };
      });

      await settingsService.updateSettings(settingsToSave);
      
      // Refresh settings after save
      await fetchSettings();
      
      setSuccessMessage('Settings saved successfully!');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      lowStockThreshold: 10,
      defaultDateRange: 30,
      enableEmailNotifications: true,
      enableLowStockAlerts: true,
      autoBackupInterval: 24,
      maxTransactionHistory: 365
    });
    setSuccessMessage('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Check if user is admin
  if (user?.role !== 'admin' && user?.role !== 'teamlead') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-48 p-6 w-full">
          <div className="text-center py-12">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">Only Team Leads and Admins can access settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-48 p-4 sm:p-6 w-full">
        <div className="mb-6 sm:mb-8 pt-16 lg:pt-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#68448C' }}>
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Configure system preferences and inventory thresholds
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
            {error}
            <button 
              onClick={fetchSettings}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 border border-green-400 rounded">
            {successMessage}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#68448C' }}>
            <h2 className="text-xl font-semibold text-white">System Configuration</h2>
            <p className="text-purple-100 text-sm">Adjust application behavior and defaults</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Inventory Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.lowStockThreshold}
                    onChange={(e) => handleSettingChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ focusRingColor: '#68448C' }}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Items with stock below this level will trigger low stock alerts
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Date Range (days)
                  </label>
                  <select
                    value={settings.defaultDateRange}
                    onChange={(e) => handleSettingChange('defaultDateRange', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ focusRingColor: '#68448C' }}
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Default date range for statistics and reports
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Enable Low Stock Alerts
                    </label>
                    <p className="text-sm text-gray-500">
                      Show alerts when items fall below the threshold
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettingChange('enableLowStockAlerts', !settings.enableLowStockAlerts)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      settings.enableLowStockAlerts 
                        ? 'bg-purple-600 focus:ring-purple-500' 
                        : 'bg-gray-200 focus:ring-gray-500'
                    }`}
                    style={{ backgroundColor: settings.enableLowStockAlerts ? '#68448C' : '' }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.enableLowStockAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Enable Email Notifications
                    </label>
                    <p className="text-sm text-gray-500">
                      Send email notifications for important events
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettingChange('enableEmailNotifications', !settings.enableEmailNotifications)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      settings.enableEmailNotifications 
                        ? 'bg-purple-600 focus:ring-purple-500' 
                        : 'bg-gray-200 focus:ring-gray-500'
                    }`}
                    style={{ backgroundColor: settings.enableEmailNotifications ? '#68448C' : '' }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.enableEmailNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Backup Interval (hours)
                  </label>
                  <select
                    value={settings.autoBackupInterval}
                    onChange={(e) => handleSettingChange('autoBackupInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ focusRingColor: '#68448C' }}
                  >
                    <option value={6}>Every 6 hours</option>
                    <option value={12}>Every 12 hours</option>
                    <option value={24}>Daily</option>
                    <option value={72}>Every 3 days</option>
                    <option value={168}>Weekly</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    How often to automatically backup data
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction History Retention (days)
                  </label>
                  <select
                    value={settings.maxTransactionHistory}
                    onChange={(e) => handleSettingChange('maxTransactionHistory', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ focusRingColor: '#68448C' }}
                  >
                    <option value={90}>90 days</option>
                    <option value={180}>6 months</option>
                    <option value={365}>1 year</option>
                    <option value={730}>2 years</option>
                    <option value={-1}>Never delete</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    How long to keep transaction history
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Reset to Defaults
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={fetchSettings}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#68448C' }}
                  onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#5a3a7a')}
                  onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#68448C')}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Settings Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Settings changes take effect immediately after saving</li>
                  <li>Low stock threshold affects dashboard alerts and inventory filtering</li>
                  <li>Default date range is used in statistics and reports when no range is specified</li>
                  <li>Only Team Leads can modify these settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 
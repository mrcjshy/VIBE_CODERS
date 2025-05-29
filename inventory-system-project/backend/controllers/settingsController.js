const { Settings } = require('../models');

// Get all settings
const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.findAll();
    
    // Convert to key-value object
    const settingsObject = {};
    settings.forEach(setting => {
      let value = setting.value;
      
      // Parse value based on type
      switch (setting.type) {
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error('Error parsing JSON setting:', setting.key);
          }
          break;
        default:
          // string type, keep as is
          break;
      }
      
      settingsObject[setting.key] = value;
    });

    res.status(200).json(settingsObject);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching settings', 
      error: error.message 
    });
  }
};

// Get a specific setting
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ where: { key } });

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    let value = setting.value;
    
    // Parse value based on type
    switch (setting.type) {
      case 'number':
        value = parseFloat(value);
        break;
      case 'boolean':
        value = value === 'true';
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error('Error parsing JSON setting:', setting.key);
        }
        break;
    }

    res.status(200).json({
      key: setting.key,
      value: value,
      type: setting.type,
      description: setting.description
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching setting', 
      error: error.message 
    });
  }
};

// Update or create a setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type = 'string', description } = req.body;

    // Convert value to string for storage
    let stringValue = value;
    if (type === 'json') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    const [setting, created] = await Settings.findOrCreate({
      where: { key },
      defaults: {
        key,
        value: stringValue,
        type,
        description
      }
    });

    if (!created) {
      await setting.update({
        value: stringValue,
        type,
        description
      });
    }

    res.status(200).json({
      message: created ? 'Setting created successfully' : 'Setting updated successfully',
      setting: {
        key: setting.key,
        value: value,
        type: setting.type,
        description: setting.description
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating setting', 
      error: error.message 
    });
  }
};

// Update multiple settings at once
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        message: 'Invalid settings format. Expected an object of settings.'
      });
    }

    const updates = [];
    const updatedSettings = {};
    
    for (const [key, settingData] of Object.entries(settings)) {
      const { value, type = 'string', description } = settingData;
      
      // Validate setting type
      if (!['string', 'number', 'boolean', 'json'].includes(type)) {
        return res.status(400).json({
          message: `Invalid type "${type}" for setting "${key}". Must be string, number, boolean, or json.`
        });
      }

      // Convert and validate value based on type
      let stringValue;
      try {
        switch (type) {
          case 'boolean':
            stringValue = String(Boolean(value));
            break;
          case 'number':
            const num = Number(value);
            if (isNaN(num)) {
              throw new Error(`Invalid number value for setting "${key}"`);
            }
            stringValue = String(num);
            break;
          case 'json':
            stringValue = JSON.stringify(value);
            break;
          default:
            stringValue = String(value);
        }
      } catch (error) {
        return res.status(400).json({
          message: `Error processing value for setting "${key}": ${error.message}`
        });
      }

      // Find or create the setting
      const [setting] = await Settings.findOrCreate({
        where: { key },
        defaults: {
          key,
          value: stringValue,
          type,
          description: description || `${key} setting`
        }
      });

      // Update if it exists
      await setting.update({
        value: stringValue,
        type,
        description: description || setting.description || `${key} setting`
      });

      // Store the processed value for response
      let processedValue;
      switch (type) {
        case 'number':
          processedValue = parseFloat(stringValue);
          break;
        case 'boolean':
          processedValue = stringValue === 'true';
          break;
        case 'json':
          processedValue = JSON.parse(stringValue);
          break;
        default:
          processedValue = stringValue;
      }
      
      updatedSettings[key] = processedValue;
      updates.push(key);
    }

    res.status(200).json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      message: 'Error updating settings', 
      error: error.message 
    });
  }
};

// Delete a setting
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await Settings.findOne({ where: { key } });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    await setting.destroy();

    res.status(200).json({ message: 'Setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting setting', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  updateSettings,
  deleteSetting
}; 
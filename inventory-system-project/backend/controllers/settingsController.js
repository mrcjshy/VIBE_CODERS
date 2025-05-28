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
    
    const updates = [];
    
    for (const [key, settingData] of Object.entries(settings)) {
      const { value, type = 'string', description } = settingData;
      
      // Convert value to string for storage
      let stringValue = value;
      if (type === 'json') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      const [setting] = await Settings.findOrCreate({
        where: { key },
        defaults: {
          key,
          value: stringValue,
          type,
          description
        }
      });

      await setting.update({
        value: stringValue,
        type,
        description
      });

      updates.push(key);
    }

    res.status(200).json({
      message: 'Settings updated successfully',
      updatedSettings: updates
    });
  } catch (error) {
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
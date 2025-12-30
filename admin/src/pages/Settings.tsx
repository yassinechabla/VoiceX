import { useEffect, useState } from 'react';
import { restaurantApi, Restaurant } from '../api/restaurant';
import './Settings.css';

function Settings() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    slotMinutes: 15,
    avgDurationMin: 90,
    bufferMin: 10,
    timezone: 'Europe/Paris',
  });

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const data = await restaurantApi.get();
      setRestaurant(data);
      setFormData({
        name: data.name,
        phoneNumber: data.phoneNumber,
        slotMinutes: data.slotMinutes,
        avgDurationMin: data.avgDurationMin,
        bufferMin: data.bufferMin,
        timezone: data.timezone,
      });
    } catch (error) {
      console.error('Failed to load restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await restaurantApi.update(formData);
      setRestaurant(updated);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <h1>Restaurant Settings</h1>
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label>Restaurant Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Timezone</label>
          <input
            type="text"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Slot Minutes (time slot granularity)</label>
          <input
            type="number"
            min="5"
            max="60"
            value={formData.slotMinutes}
            onChange={(e) => setFormData({ ...formData, slotMinutes: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="form-group">
          <label>Average Duration (minutes)</label>
          <input
            type="number"
            min="30"
            value={formData.avgDurationMin}
            onChange={(e) => setFormData({ ...formData, avgDurationMin: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="form-group">
          <label>Buffer Minutes (cleanup time between reservations)</label>
          <input
            type="number"
            min="0"
            value={formData.bufferMin}
            onChange={(e) => setFormData({ ...formData, bufferMin: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;


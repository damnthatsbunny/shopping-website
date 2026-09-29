import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data.user);
        setUser(res.data.user);
      } catch (error) {
        console.error('Failed to fetch profile');
      }
    };

    if (user) fetchProfile();
  }, [user]);

  if (!profile) return <div className="page-loading">Loading profile...</div>;

  return (
    <div className="container profile-page">
      <div className="profile-card">
        <h2>My profile</h2>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>Phone:</strong> {profile.phone || 'Not added yet'}</p>
      </div>
    </div>
  );
};

export default ProfilePage;

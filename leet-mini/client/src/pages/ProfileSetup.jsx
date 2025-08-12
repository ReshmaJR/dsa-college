import { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/auth.js';

export default function ProfileSetup() {
  const { user, fetchMe } = useAuthStore();
  const [form, setForm] = useState({ name:'', department:'', year_of_study:'', college:'', interested_lang:'JavaScript', profile_pic_url:'', bio:'' });
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchMe(); }, []);
  useEffect(() => { if (user) setForm({ ...form, ...user }); }, [user]);

  const save = async (e) => {
    e.preventDefault();
    await axios.put('/api/profile', form);
    setSaved(true);
    setTimeout(()=>setSaved(false), 1500);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div style={{ maxWidth: 700, margin: '20px auto' }}>
      <h2>Profile Setup</h2>
      <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input name="name" placeholder="Name" value={form.name||''} onChange={onChange} />
        <input name="department" placeholder="Department" value={form.department||''} onChange={onChange} />
        <input name="year_of_study" placeholder="Year of Study" value={form.year_of_study||''} onChange={onChange} />
        <input name="college" placeholder="College" value={form.college||''} onChange={onChange} />
        <input name="interested_lang" placeholder="Interested Programming Language" value={form.interested_lang||''} onChange={onChange} />
        <input name="profile_pic_url" placeholder="Profile Pic URL" value={form.profile_pic_url||''} onChange={onChange} />
        <textarea name="bio" placeholder="Bio" value={form.bio||''} onChange={onChange} style={{ gridColumn: '1 / -1', minHeight: 100 }} />
        <button type="submit" style={{ gridColumn: '1 / -1' }}>Save</button>
      </form>
      {saved && <div style={{ color: 'green' }}>Saved!</div>}
    </div>
  );
}
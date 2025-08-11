import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

export default function Problems() {
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const { data: problems } = useQuery({
    queryKey: ['problems', { q, source, topic, difficulty }],
    queryFn: async () => {
      const { data } = await axios.get('/api/problems', { params: { q, source, topic, difficulty } });
      return data;
    }
  });

  const { data: topics } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => (await axios.get('/api/topics')).data
  });

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => (await axios.get('/api/sources')).data
  });

  const grouped = useMemo(() => {
    const map = {};
    (problems||[]).forEach(p => {
      const key = p.topic || 'General';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [problems]);

  return (
    <div>
      <h2>Problems</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
        <select value={source} onChange={(e)=>setSource(e.target.value)}>
          <option value="">All Collections</option>
          {(sources||[]).map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={topic} onChange={(e)=>setTopic(e.target.value)}>
          <option value="">All Topics</option>
          {(topics||[]).map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}>
          <option value="">Any Difficulty</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>

      {Object.entries(grouped).map(([topic, items]) => (
        <div key={topic} style={{ marginBottom: 20 }}>
          <h3>{topic}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Title</th>
                <th>Source</th>
                <th>Difficulty</th>
                <th>Practice</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                  <td><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a></td>
                  <td style={{ textAlign: 'center' }}>{p.source}</td>
                  <td style={{ textAlign: 'center' }}>{p.difficulty}</td>
                  <td style={{ textAlign: 'center' }}>
                    <a href={p.url} target="_blank" rel="noreferrer">Open on LeetCode</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
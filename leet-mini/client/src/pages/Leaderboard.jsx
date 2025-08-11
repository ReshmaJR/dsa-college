import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

export default function Leaderboard() {
  const [scope, setScope] = useState('college');
  const { data } = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: async () => (await axios.get('/api/leaderboard', { params: { scope } })).data
  });

  return (
    <div>
      <h2>Leaderboard</h2>
      <div style={{ marginBottom: 8 }}>
        <select value={scope} onChange={(e)=>setScope(e.target.value)}>
          <option value="class">Same Class</option>
          <option value="department">Same Department</option>
          <option value="college">Entire College</option>
        </select>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th>Group</th>
            <th>Solved</th>
            <th>Sessions</th>
          </tr>
        </thead>
        <tbody>
          {(data||[]).map((row, idx) => (
            <tr key={row.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{idx+1}. {row.name}</td>
              <td style={{ textAlign: 'center' }}>{row.group_value || '-'}</td>
              <td style={{ textAlign: 'center' }}>{row.solved}</td>
              <td style={{ textAlign: 'center' }}>{row.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
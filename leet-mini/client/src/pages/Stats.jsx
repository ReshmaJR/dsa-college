import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function Stats() {
  const { data } = useQuery({ queryKey: ['stats'], queryFn: async () => (await axios.get('/api/stats/summary')).data });
  const byDiff = data?.byDifficulty || [];
  return (
    <div>
      <h2>Your Stats</h2>
      <div style={{ display: 'flex', gap: 20 }}>
        <div><strong>Completed:</strong> {data?.completed || 0}</div>
        <div><strong>In Progress:</strong> {data?.inprogress || 0}</div>
        <div><strong>Current Streak:</strong> {data?.streak || 0} days</div>
      </div>
      <h3 style={{ marginTop: 20 }}>Solved by Difficulty</h3>
      <ul>
        {byDiff.map(d => (
          <li key={d.difficulty}>{d.difficulty}: {d.count}</li>
        ))}
      </ul>
    </div>
  );
}
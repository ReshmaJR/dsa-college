import { useEffect, useRef, useState } from 'react';
import EditorComp from '@monaco-editor/react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

export default function Editor() {
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Start practicing here');
  const [problemId, setProblemId] = useState('');

  const { data: problems } = useQuery({
    queryKey: ['problems-dropdown'],
    queryFn: async () => (await axios.get('/api/problems')).data
  });

  useEffect(() => {
    // Start a session when mounting
    const start = async () => {
      const { data } = await axios.post('/api/practice/start', { problem_id: problemId, language });
      setSessionId(data.id);
    };
    start();
  }, []);

  const save = async () => {
    if (!sessionId) return;
    await axios.post('/api/practice/save', { session_id: sessionId, code });
  };
  const finish = async () => {
    if (!sessionId) return;
    await axios.post('/api/practice/finish', { session_id: sessionId, outcome: 'completed' });
    alert('Session saved. This updates your streak on this platform.');
    const { data } = await axios.post('/api/practice/start', { problem_id: problemId, language });
    setSessionId(data.id);
  };

  return (
    <div>
      <h2>Practice Editor</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select value={problemId} onChange={(e)=>setProblemId(e.target.value)}>
          <option value="">No specific problem (scratch)</option>
          {(problems||[]).map(p=> <option key={p.id} value={p.id}>{p.title} ({p.source})</option>)}
        </select>
        <select value={language} onChange={(e)=>setLanguage(e.target.value)}>
          <option>javascript</option>
          <option>python</option>
          <option>cpp</option>
          <option>java</option>
        </select>
        <button onClick={save}>Save</button>
        <button onClick={finish}>Finish</button>
      </div>
      <div style={{ height: '70vh', border: '1px solid #eee' }}>
        <EditorComp height="100%" defaultLanguage={language} language={language} theme="vs-dark" value={code} onChange={(v)=>setCode(v||'')} />
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import "./App.css";


const TrashIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={{ verticalAlign: 'middle', marginLeft: 6 }}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);


const API = "http://localhost:3001";

function App() {
    const [tasks, setTasks] = useState([]);
    const [filters, setFilters] = useState({ status: "", priority: "" });
    const [form, setForm] = useState({ title: "", description: "", priority: "Medium", due_date: "" });
    const [insights, setInsights] = useState({ summary: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleFormChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function deleteTask(id) {
        const res = await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchTasks();
            fetchInsights();
        } else {
            setError("Failed to delete task");
        }
    }


    async function fetchTasks() {
        setLoading(true);
        let q = [];
        if (filters.status) q.push(`status=${filters.status}`);
        if (filters.priority) q.push(`priority=${filters.priority}`);
        const res = await fetch(`${API}/tasks${q.length ? '?' + q.join('&') : ''}`);
        setTasks(await res.json());
        setLoading(false);
    }

    async function fetchInsights() {
        const res = await fetch(`${API}/insights`);
        setInsights(await res.json());
    }

    useEffect(() => { fetchTasks(); fetchInsights(); }, [filters]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title || !form.due_date || !form.priority) {
            setError("Fill all required fields");
            return;
        }
        setError("");
        try {
            await fetch(`${API}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            setForm({ title: "", description: "", priority: "Medium", due_date: "" });
            fetchTasks();
            fetchInsights();
        } catch { setError("Could not create task"); }
    }

    async function updateTask(id, u) {
        await fetch(`${API}/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(u) });
        fetchTasks(); fetchInsights();
    }

    return (
        <div className="app-container">
            <h2>Task Manager</h2>
            <div className="insight-bar">
                <strong>Insights</strong>
                <br/>
                <span>{insights.summary}</span>
            </div>


            <form onSubmit={handleSubmit}>
                <input placeholder="Title" name="title" value={form.title} onChange={handleFormChange} required />
                <textarea rows={2} placeholder="Description" name="description" value={form.description} onChange={handleFormChange}></textarea>
                <select name="priority" value={form.priority} onChange={handleFormChange} required>
                    <option>Low</option><option>Medium</option><option>High</option>
                </select>
                <input type="date" name="due_date" value={form.due_date} onChange={handleFormChange} required />
                <button>Add Task</button>
                {error && <div className="error">{error}</div>}
            </form>

            <div className="filters">
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                    <option value="">All Status</option>
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Done</option>
                </select>
                <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
                    <option value="">All Priority</option>
                    <option>Low</option><option>Medium</option><option>High</option>
                </select>
                <button onClick={fetchTasks}>Filter</button>
            </div>

            {loading ? <div>Loading tasks...</div> :
                tasks.length === 0 ? <div style={{ color: "#888" }}>No tasks found.</div> :
                    tasks.map(t =>
                        <div key={t.id} className="task-item">
                            <b>{t.title}</b> — <i>{t.priority}</i> | <small>{t.status}</small>
                            <br /><span style={{ color: "#bbb" }}>{t.description}</span>
                            <div style={{ fontSize: 13, color: "#aaa", margin: "5px 0 2px" }}>
                                Due: {t.due_date}
                            </div>
                            <div>
                                {t.status !== "Done" &&
                                    <button onClick={() => updateTask(t.id, { status: "Done" })}>Mark Done</button>}
                                {t.status === "Open" &&
                                    <button onClick={() => updateTask(t.id, { status: "In Progress" })}>Start</button>}
                                {t.status === "In Progress" &&
                                    <button onClick={() => updateTask(t.id, { status: "Open" })}>Reopen</button>}
                                <button onClick={() => updateTask(t.id, { priority: t.priority === "High" ? "Medium" : "High" })}>
                                    Toggle Priority
                                </button>

                                <button
                                    aria-label="Delete"
                                    style={{ background: "transparent", border: "none", color: "#ff5c5c", marginLeft: 6, cursor: "pointer" }}
                                    onClick={() => deleteTask(t.id)}>
                                    <TrashIcon />
                                </button>


                            </div>
                        </div>
                    )
            }
        </div>
    );
}

export default App;

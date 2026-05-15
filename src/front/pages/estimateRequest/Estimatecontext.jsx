// src/pages/estimateRequest/Estimatecontext.jsx
// ─────────────────────────────────────────────
// CAMBIO: createContext(null) → createContext({})
// Esto evita el crash cuando el componente se renderiza
// ANTES de que el Provider esté listo, retornando un objeto
// vacio en vez de undefined.

import { createContext, useContext, useState, useCallback } from "react";

// ← UNICO CAMBIO: pasar un objeto vacío como valor por defecto
const EstimateContext = createContext({
    estimates: [],
    stats: null,
    loading: false,
    error: null,
    fetchEstimates: async () => { },
    fetchStats: async () => { },
    fetchEstimate: async () => { },
    createEstimate: async () => { },
    updateEstimate: async () => { },
    updateStatus: async () => { },
    deleteEstimate: async () => { },
    addRoom: async () => { },
    deleteRoom: async () => { },
    uploadPhoto: async () => { },
    deletePhoto: async () => { },
    convertToJob: async () => { },
});

const BASE = import.meta.env.VITE_BACKEND_URL || "";

async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE}/api${path}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...opts.headers,
        },
        ...opts,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

export function EstimateProvider({ children }) {
    const [estimates, setEstimates] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchEstimates = useCallback(async (filters = {}) => {
        setLoading(true); setError(null);
        try {
            const q = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== ""))
            ).toString();
            const data = await apiFetch(`/estimates?${q}`);
            setEstimates(data.estimates || []);
            return data;
        } catch (e) { setError(e.message); return { estimates: [] }; }
        finally { setLoading(false); }
    }, []);

    const fetchStats = useCallback(async () => {
        try { const d = await apiFetch("/estimates/stats"); setStats(d); return d; }
        catch (e) { setError(e.message); }
    }, []);

    const fetchEstimate = useCallback(async (id) => {
        try { return await apiFetch(`/estimates/${id}`); }
        catch (e) { setError(e.message); throw e; }
    }, []);

    const createEstimate = useCallback(async (payload) => {
        setLoading(true); setError(null);
        try {
            const data = await apiFetch("/estimates/create", { method: "POST", body: JSON.stringify(payload) });
            setEstimates(prev => [data.estimate, ...prev]);
            return data.estimate;
        } catch (e) { setError(e.message); throw e; }
        finally { setLoading(false); }
    }, []);

    const updateEstimate = useCallback(async (id, payload) => {
        try {
            const data = await apiFetch(`/estimates/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            setEstimates(prev => prev.map(e => e.id === id ? data : e));
            return data;
        } catch (e) { setError(e.message); throw e; }
    }, []);

    const updateStatus = useCallback(async (id, status, extra = {}) => {
        try {
            const data = await apiFetch(`/estimates/${id}/status`, {
                method: "PATCH", body: JSON.stringify({ status, ...extra }),
            });
            setEstimates(prev => prev.map(e => e.id === id ? data : e));
            return data;
        } catch (e) { setError(e.message); throw e; }
    }, []);

    const deleteEstimate = useCallback(async (id) => {
        try {
            await apiFetch(`/estimates/${id}`, { method: "DELETE" });
            setEstimates(prev => prev.filter(e => e.id !== id));
        } catch (e) { setError(e.message); throw e; }
    }, []);

    const addRoom = useCallback(async (estimateId, room) => {
        try { return await apiFetch(`/estimates/${estimateId}/rooms`, { method: "POST", body: JSON.stringify(room) }); }
        catch (e) { setError(e.message); throw e; }
    }, []);

    const deleteRoom = useCallback(async (estimateId, roomId) => {
        try { return await apiFetch(`/estimates/${estimateId}/rooms/${roomId}`, { method: "DELETE" }); }
        catch (e) { setError(e.message); throw e; }
    }, []);

    const uploadPhoto = useCallback(async (estimateId, file, caption = "") => {
        try {
            const token = localStorage.getItem("token");
            const form = new FormData();
            form.append("file", file);
            form.append("caption", caption);
            const res = await fetch(`${BASE}/api/estimates/${estimateId}/photos`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        } catch (e) { setError(e.message); throw e; }
    }, []);

    const deletePhoto = useCallback(async (estimateId, photoId) => {
        try { return await apiFetch(`/estimates/${estimateId}/photos/${photoId}`, { method: "DELETE" }); }
        catch (e) { setError(e.message); throw e; }
    }, []);

    const convertToJob = useCallback(async (estimateId, payload = {}) => {
        try {
            const data = await apiFetch(`/estimates/${estimateId}/convert-to-job`, {
                method: "POST", body: JSON.stringify(payload),
            });
            setEstimates(prev => prev.map(e => e.id === estimateId ? data.estimate : e));
            return data;
        } catch (e) { setError(e.message); throw e; }
    }, []);

    return (
        <EstimateContext.Provider value={{
            estimates, stats, loading, error,
            fetchEstimates, fetchStats, fetchEstimate,
            createEstimate, updateEstimate, updateStatus, deleteEstimate,
            addRoom, deleteRoom, uploadPhoto, deletePhoto, convertToJob,
        }}>
            {children}
        </EstimateContext.Provider>
    );
}

export const useEstimate = () => useContext(EstimateContext);
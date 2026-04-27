import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';

export const useJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        category: 'all',
        priority: 'all',
        dateRange: 'all',
        search: ''
    });

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams();
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.category !== 'all') params.append('category', filters.category);
            if (filters.priority !== 'all') params.append('priority', filters.priority);
            if (filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
            if (filters.search) params.append('search', filters.search);
            
            const response = await api.get(`/api/jobs?${params.toString()}`);
            setJobs(response.data.jobs || []);
        } catch (err) {
             // ✅ Agrega estos logs
             
        console.log("ERROR STATUS:", err.response?.status);
        console.log("ERROR DATA:", err.response?.data);
        console.log("ERROR COMPLETO:", err);

            setError(err.response?.data?.error || 'Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const createJob = useCallback(async (jobData) => {
        try {
            setLoading(true);
            const response = await api.post('/api/jobs/create', jobData);
            setJobs(prev => [...prev, response.data.job]);
            return response.data;
        } catch (err) {
             console.log("❌ ERROR:", err.response?.status, err.response?.data);
            setError(err.response?.data?.error || 'Failed to create job');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateJob = useCallback(async (id, jobData) => {
        try {
            setLoading(true);
            const response = await api.put(`/api/jobs/${id}`, jobData);
            setJobs(prev => prev.map(job => 
                job.id === id ? response.data : job
            ));
            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update job');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteJob = useCallback(async (id) => {
        try {
            setLoading(true);
            await api.delete(`/api/jobs/${id}`);
            setJobs(prev => prev.filter(job => job.id !== id));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete job');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    return {
        jobs,
        loading,
        error,
        filters,
        setFilters,
        fetchJobs,
        createJob,
        updateJob,
        deleteJob
    };
};

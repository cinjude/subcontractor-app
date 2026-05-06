import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { jobCategories, jobPriorities, jobStatuses } from '../utils/jobConstants';
import './JobDetails.css';
import { useNavigate, useParams } from 'react-router-dom';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { useJobs } from '../hooks/useJobs';
import { JobForm } from './JobForm';

export const JobDetails = () => {

    const { id } = useParams();
    const { store } = useGlobalReducer();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    const { updateJob, deleteJob, uploadDocument, deleteDocument } = useJobs();

    const getSingleJob = async () => {
        setLoading(true);

        const token = store?.token || localStorage.getItem('token');
        if (!token) return;

        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/jobs/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (resp.ok) {
                setJob(data)
            }
        } catch (error) {
            console.error('Failed to fetch job:', id, error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        getSingleJob();
    }, [store?.token]);

    const handleUpdate = async (FormData) => {
        try {
            await updateJob(job.id, FormData)
            setIsEditing(false)
            getSingleJob()

        } catch (error) {
            console.error('error updating job', error)
        }
    }

    const getStatusClass = (status) => {
        const statusMap = {
            'pending': 'status-pending',
            'in_progress': 'status-progress',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return statusMap[status] || 'status-default';
    };

    const getPriorityClass = (priority) => {
        const priorityMap = {
            'low': 'priority-low',
            'medium': 'priority-medium',
            'high': 'priority-high',
            'urgent': 'priority-urgent'
        };
        return priorityMap[priority] || 'priority-medium';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString, formatString = 'MMM dd, yyyy') => {
        if (!dateString) return 'No date';

        const date = new Date(dateString);

        return isNaN(date.getTime())
            ? 'Invalid date'
            : format(date, formatString);
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await updateJob(job.id, { ...job, status: newStatus });
            await getSingleJob();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            try {
                await deleteJob(job.id);
                navigate('/providerdashboard/jobs');
            } catch (error) {
                console.error('Failed to delete job:', error);
            }
        }
    };

    const handleUploadDocument = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingDoc(true)
        try {
            await uploadDocument(job.id, file);
            await getSingleJob();
        } catch (error) {
            console.error('Failed to upload document:', error);
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleDeleteDocument = async (documentId) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            await deleteDocument(job.id, documentId);
            await getSingleJob();
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
    };

    const handleDownload = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
        window.open(downloadUrl, '_blank');
    };

    const onClose = () => {
        window.location.href = '/providerdashboard/jobs';
    };

    if (loading) return <div>Loading...</div>;
    if (!job) return <div>Job not found</div>;

    return (
        <div className="job-details-body">
            {isEditing ? (
                <JobForm
                    job={job}
                    onSubmit={handleUpdate}
                    loading={loading}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (

                <div className="job-details-modal">
                    <div className="modal-backdrop" onClick={onClose}></div>
                    <div className="job-details-content">

                        <div className="job-details-header">
                            <div className="job-details-title">
                                <h2>{job.title}</h2>
                                <div className="job-details-meta">
                                    <span className={`job-status ${getStatusClass(job.status)}`}>
                                        {job.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className={`job-priority ${getPriorityClass(job.priority)}`}>
                                        {job.priority.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="job-details-actions">
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    <i className="bi bi-pencil"></i> Edit
                                </button>
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={onClose}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>

                        <div className="job-details-tabs">
                            <div className="tab-nav">
                                <button
                                    className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    <i className="bi bi-info-circle"></i> Details
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('timeline')}
                                >
                                    <i className="bi bi-clock-history"></i> Timeline
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('documents')}
                                >
                                    <i className="bi bi-file-earmark"></i> Documents
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'workers' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('workers')}
                                >
                                    <i className="bi bi-people"></i> Workers
                                </button>
                            </div>
                        </div>

                        <div className="job-details-body">
                            {activeTab === 'details' && (
                                <div className="tab-content">
                                    <div className="job-details-grid">
                                        <div className="job-detail-section">
                                            <h4>Basic Information</h4>
                                            <div className="detail-row">
                                                <label>Description:</label>
                                                <p>{job.description}</p>
                                            </div>
                                            <div className="detail-row">
                                                <label>Location:</label>
                                                <p><i className="bi bi-geo-alt"></i> {job.location}</p>
                                            </div>
                                            <div className="detail-row">
                                                <label>Customer:</label>
                                                <p><i className="bi bi-person"></i> {job.customer?.name || 'Not assigned'}</p>
                                            </div>
                                        </div>

                                        <div className="job-detail-section">
                                            <h4>Schedule & Budget</h4>
                                            <div className="detail-row">
                                                <label>Start Date:</label>
                                                <p><i className="bi bi-calendar"></i> {formatDate(job.startDate)}</p>
                                            </div>
                                            <div className="detail-row">
                                                <label>End Date:</label>
                                                <p><i className="bi bi-calendar"></i> {job.endDate ? formatDate(job.endDate) : 'Not set'}</p>
                                            </div>
                                            <div className="detail-row">
                                                <label>Budget:</label>
                                                <p><i className="bi bi-currency-dollar"></i> {formatCurrency(job.budget)}</p>
                                            </div>
                                        </div>

                                        <div className="job-detail-section">
                                            <h4>Categories</h4>
                                            <div className="job-categories">
                                                {job.categories?.map((category, index) => (
                                                    <span key={index} className="job-tag">
                                                        {category}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {job.notes && (
                                            <div className="job-detail-section">
                                                <h4>Additional Notes</h4>
                                                <p>{job.notes}</p>
                                            </div>
                                        )}

                                        {job.progress !== undefined && (
                                            <div className="job-detail-section">
                                                <h4>Progress</h4>
                                                <div className="job-progress">
                                                    <div className="progress-label">
                                                        <span>Progress</span>
                                                        <span>{job.progress}%</span>
                                                    </div>
                                                    <div className="progress">
                                                        <div
                                                            className="progress-bar"
                                                            style={{ width: `${job.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'timeline' && (
                                <div className="tab-content">
                                    <div className="job-timeline">
                                        <h4>Job Timeline</h4>
                                        <div className="timeline">
                                            <div className="timeline-item">
                                                <div className="timeline-marker created"></div>
                                                <div className="timeline-content">
                                                    <h5>Job Created</h5>
                                                    <p>{formatDate(job.createdAt)}</p>
                                                </div>
                                            </div>
                                            {job.timeline?.map((activity, index) => (
                                                <div key={index} className="timeline-item">
                                                    <div className={`timeline-marker ${activity.type}`}></div>
                                                    <div className="timeline-content">
                                                        <h5>{activity.title}</h5>
                                                        <p>{activity.description}</p>
                                                        <small>{formatDate(activity.date)}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="tab-content">
                                    <div className="job-documents">
                                        <div className="documents-header">
                                            <h4>Documents</h4>

                                            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                                                {uploadingDoc
                                                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Uploading...</>
                                                    : <><i className="bi bi-plus"></i> Upload Document</>
                                                }
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    onChange={handleUploadDocument}
                                                    disabled={uploadingDoc}
                                                />
                                            </label>
                                        </div>

                                        <div className="documents-list">
                                            {job.documents?.length > 0 ? (
                                                job.documents.map((doc, index) => (
                                                    <div key={index} className="document-item">
                                                        <i className="bi bi-file-earmark"></i>
                                                        <div className="document-info">
                                                            <h6>{doc.name}</h6>
                                                            <small>
                                                                {doc.file_size
                                                                    ? `${(doc.file_size / 1024).toFixed(1)} KB`
                                                                    : ''
                                                                } • {formatDate(doc.created_at)}
                                                            </small>
                                                        </div>
                                                        <div className="document-actions">

                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleDownload(doc.file_path, doc.name)}
                                                            >
                                                                <i className="bi bi-download"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-documents">
                                                    <i className="bi bi-file-earmark-x"></i>
                                                    <p>No documents uploaded yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'workers' && (
                                <div className="tab-content">
                                    <div className="job-workers">
                                        <div className="workers-header">
                                            <h4>Assigned Workers</h4>
                                            <button className="btn btn-primary btn-sm">
                                                <i className="bi bi-plus"></i> Assign Worker
                                            </button>
                                        </div>
                                        <div className="workers-list">
                                            {job.workers?.length > 0 ? (
                                                job.workers.map((worker, index) => (
                                                    <div key={index} className="worker-item">
                                                        <div className="worker-avatar">
                                                            <i className="bi bi-person-circle"></i>
                                                        </div>
                                                        <div className="worker-info">
                                                            <h6>{worker.name}</h6>
                                                            <small>{worker.role} • {worker.specialty}</small>
                                                        </div>
                                                        <div className="worker-actions">
                                                            <button className="btn btn-sm btn-outline-secondary">
                                                                <i className="bi bi-envelope"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger">
                                                                <i className="bi bi-x"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-workers">
                                                    <i className="bi bi-people"></i>
                                                    <p>No workers assigned yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="job-details-footer">
                            <div className="status-actions">
                                {job.status === 'pending' && (
                                    <button
                                        className="btn btn-info"
                                        onClick={() => handleStatusChange('in_progress')}
                                    >
                                        <i className="bi bi-play-circle"></i> Start Job
                                    </button>
                                )}
                                {job.status === 'in_progress' && (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleStatusChange('completed')}
                                    >
                                        <i className="bi bi-check-circle"></i> Complete Job
                                    </button>
                                )}
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                >
                                    <i className="bi bi-trash"></i> Delete Job
                                </button>
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

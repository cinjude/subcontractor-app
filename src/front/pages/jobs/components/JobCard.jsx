import React from 'react';
import { format } from 'date-fns';
import { jobStatuses, jobPriorities } from '../utils/jobConstants';
import { formatCurrency, formatDate } from '../utils/jobHelpers';
import './JobCard.css';
import { useNavigate } from 'react-router-dom';

export const JobCard = ({ job, viewMode = 'grid', onUpdate, onDelete }) => {

    const navigate = useNavigate()

    const getStatusInfo = (status) => {
        return jobStatuses.find(s => s.value === status) || jobStatuses[0];
    };

    const getPriorityInfo = (priority) => {
        return jobPriorities.find(p => p.value === priority) || jobPriorities[1];
    };

    const statusInfo = getStatusInfo(job.status);
    const priorityInfo = getPriorityInfo(job.priority);

    return (
        <div className={`job-card ${viewMode}`}>
            <div className="job-card-header">
                <div className="job-card-title">
                    <h4>{job.title}</h4>
                    <div className="job-card-meta">
                        <span className={`job-status status-${job.status}`}>
                            <i className={`bi ${statusInfo.icon}`}></i>
                            {statusInfo.label}
                        </span>
                        <span className={`job-priority priority-${job.priority}`}>
                            {priorityInfo.label}
                        </span>
                    </div>
                </div>
                <div className="job-card-actions">
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/providerdashboard/jobdetails/${job.id}`)}
                    >
                        <i className="bi bi-eye"></i>
                    </button>
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => { onUpdate(job) }}
                    >
                        <i className="bi bi-pencil"></i>
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => { onDelete(job.id) }}
                    >
                        <i className="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            <div className="job-card-body">
                <div className="job-card-description">
                    <p>{job.description}</p>
                </div>

                <div className="job-card-info">
                    <div className="job-info-row">
                        <div className="job-info-item">
                            <i className="bi bi-geo-alt"></i>
                            <span>{job.location || 'Not specified'}</span>
                        </div>
                        <div className="job-info-item">
                            <i className="bi bi-calendar"></i>
                            <span>{formatDate(job.start_date || job.create_at)}</span>
                        </div>
                    </div>
                    <div className="job-info-row">
                        <div className="job-info-item">
                            <i className="bi bi-currency-dollar"></i>
                            <span>{formatCurrency(job.budget)}</span>
                        </div>
                        <div className="job-info-item">
                            <i className="bi bi-person"></i>
                            <span>Customer #{job.customer_id}</span>
                        </div>
                    </div>
                </div>

                {job.progress !== undefined && (
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
                )}
            </div>

            <div className="job-card-footer">
                <div className="job-tags">
                    {job.categories && job.categories.slice(0, 3).map((category, index) => (
                        <span key={index} className="job-tag">
                            {category}
                        </span>
                    ))}
                    {job.categories && job.categories.length > 3 && (
                        <span className="job-tag job-tag-more">
                            +{job.categories.length - 3}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

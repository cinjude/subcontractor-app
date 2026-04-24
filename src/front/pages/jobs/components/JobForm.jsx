import React, { useState, useEffect } from 'react';
import { jobCategories, jobPriorities, jobStatuses } from '../utils/jobConstants';
import './JobForm.css';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { loadAppData } from "../../customer/customerService";

export const JobForm = ({ job, onSubmit, loading, onCancel }) => {
    const [formData, setFormData] = useState({
        customerId: job?.customer_id || '',
        serviceId: job?.service_id || '',
        title: job?.title || '',
        description: job?.description || '',
        location: job?.location || '',
        startDate: job?.startDate ? job.startDate.split('T')[0] : '',
        endDate: job?.endDate ? job.endDate.split('T')[0] : '',
        budget: job?.budget || '',
        priority: job?.priority || 'medium',
        status: job?.status || 'pending',
        categories: job?.categories || [],
        notes: job?.notes || ''
    });

    const [errors, setErrors] = useState({});

    const { store, dispatch } = useGlobalReducer();

    const customers = store.customers || [];
    const services = store.services || [];

    useEffect(() => {
        const token = store.token || localStorage.getItem("token");

        if (customers.length === 0 || services.length === 0) {
            loadAppData(dispatch, token);
        }
    }, []);
    console.log('service data modal', services)

    console.log(customers)

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleCategoryChange = (category) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.budget || formData.budget <= 0) newErrors.budget = 'Budget must be greater than 0';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const submitData = {
            ...formData,
            customerId: formData.customerId === '' ? null : parseInt(formData.customerId),
            serviceId: formData.serviceId === '' ? null : parseInt(formData.serviceId),
            budget: parseFloat(formData.budget),
            startDate: formData.startDate,
            endDate: formData.endDate || null
        };
        onSubmit(submitData);
    };

    return (
        <div className="job-form">
            <div className="job-form-header">
                <h3>{job ? 'Edit Job' : 'Create New Job'}</h3>
            </div>

            <form onSubmit={handleSubmit} className="job-form-content">

                <div className="form-section">
                    <h4>Basic Information</h4>

                    <div className="mb-3">
                        <label htmlFor="title" className="form-label">Job Title *</label>
                        <input
                            type="text"
                            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Enter job title"
                            required
                        />
                        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>

                    <div className='row'>

                        <div className='col-md-6 mb-3'>
                            <label className='form-label'> Customer (Optional)</label>
                            <select className='form-select'
                                name="customerId"
                                value={formData.customerId}
                                onChange={handleInputChange}
                            >
                                <option value="">-- No customer Assign later -- </option>
                                {
                                    customers.map(c =>
                                        <option key={c.id} value={c.id}> {c.name} </option>
                                    )
                                }

                            </select>

                        </div>

                        <div className='col-md-6 mb-3'>
                            <label className='form-label'> Service (Optional)</label>
                            <select className='form-select'
                                name="serviceId"
                                value={formData.serviceId}
                                onChange={handleInputChange}
                            >
                                <option value="">-- No service Assign later -- </option>
                                {
                                    services.map(s =>
                                        <option key={s.id} value={s.id}> {s.name} </option>
                                    )
                                }

                            </select>

                        </div>

                    </div>
                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description *</label>
                        <textarea
                            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="4"
                            placeholder="Describe the job requirements"
                            required
                        />
                        {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="location" className="form-label">Location *</label>
                        <input
                            type="text"
                            className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Job location"
                            required
                        />
                        {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                    </div>
                </div>

                {/* Schedule and Budget */}
                <div className="form-section">
                    <h4>Schedule & Budget</h4>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="startDate" className="form-label">Start Date *</label>
                            <input
                                type="date"
                                className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                required
                            />
                            {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="endDate" className="form-label">End Date</label>
                            <input
                                type="date"
                                className="form-control"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="budget" className="form-label">Budget ($) </label>
                        <input
                            type="number"
                            className={`form-control ${errors.budget ? 'is-invalid' : ''}`}
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                        />
                        {errors.budget && <div className="invalid-feedback">{errors.budget}</div>}
                    </div>
                </div>

                {/* Categories */}
                <div className="form-section">
                    <h4>Categories</h4>
                    <div className="job-categories">
                        {jobCategories.map(category => (
                            <div key={category.value} className="job-category-item">
                                <input
                                    type="checkbox"
                                    id={`category-${category.value}`}
                                    checked={formData.categories.includes(category.value)}
                                    onChange={() => handleCategoryChange(category.value)}
                                />
                                <span>{category.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status and Priority */}
                <div className="form-section">
                    <h4>Status & Priority</h4>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="priority" className="form-label">Priority</label>
                            <select
                                className="form-select"
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                            >
                                {jobPriorities.map(priority => (
                                    <option key={priority.value} value={priority.value}>
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select
                                className="form-select"
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                {jobStatuses.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="form-section">
                    <h4>Additional Notes</h4>
                    <div className="mb-3">
                        <textarea
                            className="form-control"
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Any additional notes about this job"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                {job ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            job ? 'Update Job' : 'Create Job'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

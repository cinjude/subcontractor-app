import React, { useState } from "react";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { useJobs } from "./hooks/useJobs";
import { JobList } from "./components/JobList";
import { JobForm } from "./components/JobForm";
import { JobFilters } from "./components/JobFilters";
import "./styles/JobsPage.css";

export const JobsPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    const {
        jobs,
        loading,
        error,
        filters,
        createJob,
        updateJob,
        deleteJob,
        setFilters
    } = useJobs();

    const handleCreateJob = async (jobData) => {
        try {
            await createJob(jobData);
            setShowForm(false);
        } catch (err) {
            console.error('Failed to create job:', err);
        }
    };

    const handleUpdateJob = async (id, jobData) => {
        try {
            await updateJob(id, jobData);
            setSelectedJob(null);
        } catch (err) {
            console.error('Failed to update job:', err);
        }
    };

    const handleDeleteJob = async (id) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await deleteJob(id);
            } catch (err) {
                console.error('Failed to delete job:', err);
            }
        }
    };

    const handleEditJob = (job) => {
        setSelectedJob(job);
        setShowForm(true);
    };

    const handleNewJob = () => {
        setSelectedJob(null);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedJob(null);
    };

    return (
        // <DashboardLayout 
        //     title="Jobs Management"
        //     description="Manage your construction jobs and projects"
        // >


        <div className="container-fluid">

            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3>Jobs Management</h3>
                        <button
                            className="btn btn-primary"
                            onClick={handleNewJob}
                        >
                            <i className="bi bi-plus-lg me-2"></i>
                            New Job
                        </button>
                    </div>


                    <JobFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                    />

                    {/* Job Form Modal */}
                    {showForm && (
                        <div className="modal-backdrop">
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">

                                        <h5 className="modal-title">
                                            {selectedJob ? 'Edit Job' : 'Create New Job'}
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={handleCloseForm}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <JobForm
                                            job={selectedJob}
                                            onSubmit={selectedJob ? (data) => handleUpdateJob(selectedJob.id, data) : handleCreateJob}
                                            loading={loading}
                                            onCancel={handleCloseForm}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <JobList
                        jobs={jobs}
                        loading={loading}
                        error={error}
                        onUpdate={handleUpdateJob}
                        onDelete={handleDeleteJob}
                    />
                    {!showForm && (
                        <button
                            className="btn btn-primary floating-action-btn"
                            onClick={handleNewJob}
                            title="Create New Job"
                        >
                            <i className="bi bi-plus-lg"></i>

                        </button>
                    )}
                </div>
            </div>
        </div>
        // </DashboardLayout>
    );
};

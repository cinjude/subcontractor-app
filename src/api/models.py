import enum
from datetime import datetime, time
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Integer, Enum, DateTime, func, ForeignKey, Float, UniqueConstraint, Date, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

db = SQLAlchemy()

class UserRole(enum.Enum):
    CONTRACTOR = "contractor"
    CUSTOMER = "customer"

class JobStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"

class JobPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class PaymentMethod(enum.Enum):
    stripe = "stripe"
    square = "square"
    zelle = "zelle"
    cash = "cash"
    check = "check"


class PaymentStatus(enum.Enum):
    pending = "pending"
    paid = "paid"
    refunded = "refunded"
    failed = "failed"


class InvoiceStatus(enum.Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"


class SubscriptionStatus(enum.Enum):
    free = "free"
    trial = "trial"
    active = "active"
    past_due = "past_due"
    canceled = "canceled"


class EstimateStatus(enum.Enum):
    new = "new"
    converted = "converted"
    rejected = "rejected"


class User(db.Model):
    __tablename__ = 'user'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(
        Boolean(), nullable=False, default=True)

    provider: Mapped['Contractor'] = relationship(back_populates='user')

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name
        }


class Contractor(db.Model):
    __tablename__ = 'contractor'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('user.id'), nullable=False)
    business_name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    address: Mapped[str] = mapped_column(String(120), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    logo_image: Mapped[str] = mapped_column(String())
    cover_image: Mapped[str] = mapped_column(String(500))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    business_email: Mapped[str] = mapped_column(String())
    website_slug: Mapped[str] = mapped_column(
        String(500), default=False, unique=True, index=True)
    about: Mapped[str] = mapped_column(String())
    payment_link: Mapped[str] = mapped_column(String(500), nullable=True)
    subscription_status: Mapped[SubscriptionStatus] = mapped_column(Enum(
        SubscriptionStatus), default=SubscriptionStatus.free, nullable=False, index=True)
    plan_type: Mapped[str] = mapped_column(String(50), nullable=True)
    subscription_renewal_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True)
    tax_rate: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default='USD')
    invoice_prefix: Mapped[str] = mapped_column(String(10), default='INV')
    stripe_account_id: Mapped[str] = mapped_column(String(255), nullable=True)
    stripe_onboarding_complete: Mapped[bool] = mapped_column(
        Boolean, default=False)
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    customer: Mapped[list['Customer']] = relationship(
        back_populates='contractor_customer')
    contractor_invoice: Mapped[list['Invoice']] = relationship(
        back_populates='invoice_contractor')
    user: Mapped['User'] = relationship(back_populates='provider')
    contractor_job: Mapped[list['Job']] = relationship(
        back_populates='job_contractor')
    service_contr: Mapped[list['Services']] = relationship(
        back_populates='contractorServices')
    project_provider: Mapped[list['PortfolioProject']
                             ] = relationship(back_populates='provider_project')
    estimate_contractor: Mapped[list['EstimateRequest']] = relationship(
        back_populates='contractor_estimate')

    __table_args__ = (db.Index('idx_contractor_verified',
                               'is_verified', 'subscription_status', 'plan_type'),)


class Customer(db.Model):
    __tablename__ = 'customer'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contractor_id: Mapped[int] = mapped_column(
        ForeignKey('contractor.id'), nullable=False)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(
        String(120), nullable=False)
    address: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(20), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    note: Mapped[str] = mapped_column(String(500), nullable=True)
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    contractor_customer: Mapped['Contractor']= relationship(back_populates='customer')
    customer_invoice: Mapped[list['Invoice']] = relationship(
        back_populates='invoice_customer')
    customer_job: Mapped[list['Job']] = relationship(
        back_populates='job_customer')
    customer_request: Mapped[list['EstimateRequest']] = relationship(
        back_populates='estim_customer')

    __table_args__ = (db.Index('idx_customer_contractor', 'contractor_id', 'email'),
                      db.UniqueConstraint('contractor_id', 'email'))


class Services(db.Model):
    __tablename__ = 'services'
    __table_args__ = (db.UniqueConstraint(
        'contractor_id', 'name', name='unique_service_per_contractor'),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contractor_id: Mapped[int] = mapped_column(
        ForeignKey('contractor.id'), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price: Mapped[Numeric] = mapped_column(Numeric(10, 2))
    duration: Mapped[int] = mapped_column(Integer)
    image: Mapped[str] = mapped_column(String())
    materials_needed: Mapped[str] = mapped_column(String())
    estimate_hours: Mapped[float] = mapped_column(Float, nullable=True)
    base_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean(), default=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean(), nullable=False, default=True)

    contractorServices: Mapped['Contractor'] = relationship(
        back_populates='service_contr')
    job: Mapped['Job'] = relationship(
        back_populates='service')
    material_service: Mapped[list['ServiceMaterial']] = relationship(
        back_populates='service_mat', cascade='all, delete-orphan')
    service_estimate: Mapped[list['EstimateRequest']] = relationship(
        back_populates='service')


class ServiceMaterial(db.Model):
    __tablename__ = 'servicesMaterial'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    service_id: Mapped[int] = mapped_column(
        ForeignKey('services.id'), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    quantity: Mapped[Numeric] = mapped_column(Numeric(10, 2))
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2))

    service_mat: Mapped['Services'] = relationship(
        back_populates='material_service')


class Job(db.Model):
    __tablename__ = 'job'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contractor_id: Mapped[int] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey('customer.id'), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey('services.id'), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text(), nullable=False)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), nullable=False, default=JobStatus.PENDING)
    priority: Mapped[JobPriority] = mapped_column(Enum(JobPriority), nullable=False, default=JobPriority.MEDIUM)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    budget: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    schedule_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    estimate_total: Mapped[Numeric] = mapped_column(Numeric(10, 2), default=0)
    actual_total: Mapped[Numeric] = mapped_column(Numeric(10, 2), default=0)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)  # Progress percentage 0-100
    categories: Mapped[str] = mapped_column(String(500), nullable=True)  # JSON string or comma-separated
    notes: Mapped[str] = mapped_column(Text(), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean(), default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job_invoice: Mapped[list['Invoice']] = relationship(back_populates='invoice_job', cascade='all, delete-orphan')
    job_contractor: Mapped['Contractor'] = relationship(back_populates='contractor_job')
    job_customer: Mapped['Customer'] = relationship(back_populates='customer_job')
    service: Mapped['Services'] = relationship(back_populates='job')
    documents: Mapped[list['JobDocument']] = relationship(back_populates='job', cascade='all, delete-orphan')

    __table_args__ = (
        db.Index('idx_job_contractor_dates', 'contractor_id', 'schedule_date'),
        db.Index('idx_job_status', 'status'),
        db.Index('idx_job_priority', 'priority'),
    )

    def serialize(self):
        """Convert job to dictionary for JSON response"""
        return {
            'id': self.id,
            'contractor_id': self.contractor_id,
            'customer_id': self.customer_id,
            'service_id': self.service_id,
            'title': self.title,
            'description': self.description,
            'status': self.status.value if self.status else None,
            'priority': self.priority.value if self.priority else None,
            'location': self.location,
            'budget': float(self.budget) if self.budget else None,
            'schedule_date': self.schedule_date.isoformat() if self.schedule_date else None,
            'estimate_total': float(self.estimate_total) if self.estimate_total else None,
            'actual_total': float(self.actual_total) if self.actual_total else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'progress': self.progress,
            'categories': self.categories.split(',') if self.categories else [],
            'notes': self.notes,
            'is_deleted': self.is_deleted,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'create_at': self.create_at.isoformat() if self.create_at else None,
        }

    def get_duration_days(self):
        """Get job duration in days"""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return None


class JobDocument(db.Model):
    __tablename__ = 'job_documents'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey('job.id'), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer)
    file_type: Mapped[str] = mapped_column(String(100))
    uploaded_by: Mapped[int] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    job = relationship('Job', back_populates='documents')
    uploader = relationship('Contractor')
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'name': self.name,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'uploaded_by': self.uploaded_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Invoice(db.Model):
    __tablename__ = 'invoice'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    contractor_id: Mapped[int] = mapped_column(
        ForeignKey('contractor.id'), nullable=False)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey('customer.id'), nullable=False)
    job_id: Mapped[int] = mapped_column(
        ForeignKey('job.id'), nullable=False)
    invoice_number: Mapped[int] = mapped_column(Integer, nullable=False,)
    issue_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    due_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    subtotal: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    tax:  Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    total_amount:  Mapped[Numeric] = mapped_column(
        Numeric(10, 2), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus), nullable=False)
    payment_link: Mapped[str] = mapped_column(String(500), nullable=False)
    notes: Mapped[str] = mapped_column(String(500), nullable=False)
    paid_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True)
    stripe_payment_intent_id: Mapped[str] = mapped_column(
        String(255), nullable=True)
    stripe_payment_link_id: Mapped[str] = mapped_column(
        String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now())
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    payment: Mapped[list['Payment']] = relationship(
        back_populates='invoice_payment')
    invoice_contractor: Mapped['Contractor'] = relationship(
        back_populates='contractor_invoice')
    invoice_customer: Mapped['Customer'] = relationship(
        back_populates='customer_invoice')
    invoice_job: Mapped['Job'] = relationship(
        back_populates='job_invoice')
    invoice_items: Mapped[list['InvoiceItem']
                          ] = relationship(back_populates='invoice', cascade='all, delete-orphan')

    __table_args__ = (
        db.CheckConstraint('total_amount = subtotal + tax',
                           name='check_invoice_total'),
        db.Index('idx_invoice_contractor_status', 'contractor_id', 'status'),
        db.Index('idx_invoice_dates', 'issue_date', 'due_date'),
        db.UniqueConstraint('contractor_id', 'invoice_number', name='uq_invoice_per_contractor'),)

    def __repr__(self):
        return f'<Invoice {self.invoice_number}>'


class InvoiceItem(db.Model):
    __tablename__ = 'invoiceItem'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey('invoice.id'), nullable=False)
    description: Mapped[str] = mapped_column(String(550), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now())
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    invoice: Mapped['Invoice'] = relationship(back_populates='invoice_items')


class Payment(db.Model):
    __tablename__ = 'payment'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey('invoice.id'), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod), nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(255))
    paid_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now())
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    invoice_payment: Mapped['Invoice'] = relationship(
        back_populates='payment')

    __table_args__ = (
        db.CheckConstraint('amount > 0', name='check_payment_amount'),
        db.Index('idx_payment_invoice', 'invoice_id'),
        db.Index('idx_payment_status', 'payment_status'),)


class PortfolioProject(db.Model):
    __tablename__ = 'portfolioproject'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider_id: Mapped[int] = mapped_column(
        ForeignKey('contractor.id'), nullable=False)
    title: Mapped[str] = mapped_column(String())
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    provider_project: Mapped['Contractor'] = relationship(
        back_populates='project_provider')
    image: Mapped[list['PortfolioImage']] = relationship(
        back_populates='project')


class PortfolioImage(db.Model):
    __tablename__ = 'portfolioimage'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    portfolioproject_id: Mapped[int] = mapped_column(
        ForeignKey('portfolioproject.id'), nullable=False)
    image_url:  Mapped[str] = mapped_column(String(500), nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer)

    project: Mapped['PortfolioProject'] = relationship(back_populates='image')


class EstimateRequest(db.Model):
    __tablename__ = 'estimateRequest'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey('customer.id'), nullable=True)
    contractor_id: Mapped[int] = mapped_column(
        ForeignKey('contractor.id'), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    service_id: Mapped[int] = mapped_column(
        ForeignKey('services.id'), nullable=True)
    description: Mapped[str] = mapped_column(String(500))
    status: Mapped[EstimateStatus] = mapped_column(
        Enum(EstimateStatus), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now())
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    contractor_estimate: Mapped['Contractor'] = relationship(
        back_populates='estimate_contractor')
    estim_customer: Mapped['Customer'] = relationship(
        back_populates='customer_request')
    service: Mapped['Services'] = relationship(
        back_populates='service_estimate')

    __table_args__ = (
        db.Index('idx_estimate_email', 'customer_email'),
        db.Index('idx_estimate_contractor_status', 'contractor_id', 'status'),)

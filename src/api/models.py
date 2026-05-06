import enum
from datetime import datetime, time
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Integer, Enum, DateTime, func, ForeignKey, Float, UniqueConstraint, Date, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property
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
    business_name: Mapped[str] = mapped_column(String(120), nullable=True)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    address: Mapped[str] = mapped_column(String(120), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    logo_image: Mapped[str] = mapped_column(String(), nullable=True)
    cover_image: Mapped[str] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    business_email: Mapped[str] = mapped_column(String(), nullable=True)
    website_slug: Mapped[str] = mapped_column(
        String(500), default=False, unique=True, index=True, nullable=True)
    about: Mapped[str] = mapped_column(String(), nullable=True)
    payment_link: Mapped[str] = mapped_column(String(500), nullable=True)
    subscription_status: Mapped[SubscriptionStatus] = mapped_column(Enum(
        SubscriptionStatus), default=SubscriptionStatus.free, nullable=True, index=True)
    plan_type: Mapped[str] = mapped_column(String(50), nullable=True)
    subscription_renewal_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True)
    tax_rate: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default='USD', nullable=True)
    invoice_prefix: Mapped[str] = mapped_column(String(10), default='INV', nullable=True)
    stripe_account_id: Mapped[str] = mapped_column(String(255), nullable=True)
    stripe_onboarding_complete: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=True)
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True)

    @hybrid_property
    def total_revenue(self):
        return sum((inv.total_amount or 0) for inv in self.contractor_invoice)

    @total_revenue.expression
    def total_revenue(cls):
        from sqlalchemy import select
        return (
            select(func.coalesce(func.sum(Invoice.total_amount), 0))
            .where(Invoice.contractor_id == cls.id)
            .scalar_subquery()
        )

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
    address2: Mapped[str] = mapped_column(String(120), nullable=True)
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
        back_populates='invoice_customer', cascade='all, delete-orphan')
    customer_job: Mapped[list['Job']] = relationship(
        back_populates='job_customer', cascade='all, delete-orphan')
    customer_request: Mapped[list['EstimateRequest']] = relationship(
        back_populates='estim_customer', cascade='all, delete-orphan')

    __table_args__ = (db.Index('idx_customer_contractor', 'contractor_id', 'email'),
                      db.UniqueConstraint('contractor_id', 'email'))
    
    def serialize(self):
        return {
            "id": self.id,
            "contractor_id": self.contractor_id,
            "email": self.email,
            "name": self.name,
            "address": self.address,
            "address2": self.address2,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "phone": self.phone,
            "note": self.note,
            "create_at": self.create_at.isoformat() if self.create_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class ServiceMaterial(db.Model):
    __tablename__ = 'servicesMaterial'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    service_id: Mapped[int] = mapped_column(
        ForeignKey('services.id'), nullable=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    quantity: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)

    @hybrid_property
    def total_cost(self):
        if self.quantity and self.unit_cost:
            return self.quantity * self.unit_cost
        return Decimal('0.00')

    @total_cost.expression
    def total_cost(cls):
        return func.coalesce(cls.quantity * cls.unit_cost, 0)

    service_mat: Mapped['Services'] = relationship(
        back_populates='material_service')

    def serialize(self):
        return{
            'id': self.id,
            'name': self.name,
            'quantity': float(self.quantity) if self.quantity is not None else 0.0,
            'unit_cost': float(self.unit_cost) if self.unit_cost is not None else 0.0,
            'total_cost': float(self.total_cost)
        }

class Services(db.Model):
    __tablename__ = 'services'
    __table_args__ = (db.UniqueConstraint(
        'contractor_id', 'name', name='unique_service_per_contractor'),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contractor_id: Mapped[int] = mapped_column(
        ForeignKey('contractor.id'), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    duration: Mapped[int] = mapped_column(Integer, nullable=True)
    image: Mapped[str] = mapped_column(String(), nullable=True)
    materials_needed: Mapped[str] = mapped_column(String(), nullable=True)
    estimate_hours: Mapped[float] = mapped_column(Float, nullable=True)
    base_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean(), nullable=True, default=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean(), nullable=False, default=True)

    @hybrid_property
    def materials_cost(self):
        return sum(
            float(m.total_cost)
            for m in self.material_service
        )

    @materials_cost.expression
    def materials_cost(cls):
        return (
            db.select(func.coalesce(func.sum(ServiceMaterial.quantity * ServiceMaterial.unit_cost), 0))
            .where(ServiceMaterial.service_id == cls.id)
            .scalar_subquery()
        )

    @hybrid_property
    def effective_base_cost(self):
        if self.base_cost is not None:
            return float(self.base_cost)
        return self.materials_cost

    @hybrid_property
    def profit(self):
        if self.price is not None:
            return float(self.price) - self.effective_base_cost
        return 0.0

    @profit.expression
    def profit(cls):
        return func.coalesce(cls.price, 0) - func.coalesce(cls.base_cost, cls.materials_cost)

    contractorServices: Mapped['Contractor'] = relationship(
        back_populates='service_contr')
    job: Mapped['Job'] = relationship(
        back_populates='service')
    material_service: Mapped[list['ServiceMaterial']] = relationship(
        back_populates='service_mat', cascade='all, delete-orphan')
    service_estimate: Mapped[list['EstimateRequest']] = relationship(
        back_populates='service')
    
    def serialize(self):
        price_val = float(self.price) if self.price is not None else None
        base_cost_raw = float(self.base_cost) if self.base_cost is not None else None
        mat_cost = self.materials_cost
        eff_base_cost = self.effective_base_cost
        profit_val = float(self.price or 0) - eff_base_cost if self.price else 0.0

        return {
            'id': self.id,
            'contractor_id': self.contractor_id,
            'description': self.description,
            'name': self.name,
            'duration': self.duration,
            'image': self.image,
            'materials_needed': self.materials_needed,
            'estimate_hours': self.estimate_hours,
            'is_deleted': self.is_deleted,
            'is_active': self.is_active,
            'price': price_val,
            'base_cost': base_cost_raw,
            'materials_cost': round(mat_cost, 2),
            'effective_base_cost': round(eff_base_cost, 2),
            'profit': round(profit_val, 2),
            'materials': [m.serialize() for m in self.material_service]
        }

class JobTimeline(db.Model):
    __tablename__ = 'job_timeline'   
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey('job.id'), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    type: Mapped[str] = mapped_column(String(50))
    
    job: Mapped['Job'] = relationship(back_populates='timeline')

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "date": self.date.isoformat(),
            "type": self.type
        }


class Job(db.Model):
    __tablename__ = 'job'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contractor_id: Mapped[int] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey('customer.id'), nullable=True)
    service_id: Mapped[int] = mapped_column(ForeignKey('services.id'), nullable=True)
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
    progress: Mapped[int] = mapped_column(Integer, default=0) 
    categories: Mapped[str] = mapped_column(String(500), nullable=True)  
    notes: Mapped[str] = mapped_column(Text(), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean(), default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job_invoice: Mapped[list['Invoice']] = relationship(back_populates='invoice_job', cascade='all, delete-orphan')
    job_contractor: Mapped['Contractor'] = relationship(back_populates='contractor_job')
    job_customer: Mapped['Customer'] = relationship(back_populates='customer_job')
    service: Mapped['Services'] = relationship(back_populates='job')
    documents: Mapped[list['JobDocument']] = relationship(back_populates='job', cascade='all, delete-orphan')
    timeline: Mapped[list['JobTimeline']] = relationship(cascade='all, delete-orphan', order_by="JobTimeline.date" )

    @hybrid_property
    def duration_days(self):
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return 0

    @duration_days.expression
    def duration_days(cls):
        return func.coalesce(func.date_part('day', cls.end_date - cls.start_date), 0)

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
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'progress': self.progress,
            'categories': self.categories.split(',') if self.categories else [],
            'notes': self.notes,
            'is_deleted': self.is_deleted,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'createdAt': self.create_at.isoformat() if self.create_at else None,
            'duration_days': self.duration_days,
            'timeline': [m.serialize() for m in self.timeline],
            'documents': [d.to_dict() for d in self.documents], 
        }

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

    @hybrid_property
    def total_final(self):
        return (self.subtotal or 0) + (self.tax or 0)

    @total_final.expression
    def total_final(cls):
        return func.coalesce(cls.subtotal, 0) + func.coalesce(cls.tax, 0)

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
    # amount: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now())
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    
    invoice: Mapped['Invoice'] = relationship(back_populates='invoice_items')

    @hybrid_property
    def row_total(self):
        if self.quantity and self.unit_price:
            return self.quantity * self.unit_price
        return Decimal('0.00')

    @row_total.expression
    def row_total(cls):
        return func.coalesce(cls.quantity * cls.unit_price, 0)


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

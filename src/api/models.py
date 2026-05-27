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

class EstimateType(enum.Enum):
    painting    = "painting"
    flooring    = "flooring"
    both        = "both"         
 
class PaintSurfaceCondition(enum.Enum):
    new_drywall     = "new_drywall"
    same_color      = "same_color"
    color_change    = "color_change"
    dark_to_light   = "dark_to_light"
    damaged         = "damaged"          
 
class PaintType(enum.Enum):
    interior_standard  = "interior_standard"
    interior_premium   = "interior_premium"
    exterior_standard  = "exterior_standard"
    exterior_premium   = "exterior_premium"
    primer_only        = "primer_only"
 
class PaintFinish(enum.Enum):
    flat        = "flat"
    eggshell    = "eggshell"
    satin       = "satin"
    semi_gloss  = "semi_gloss"
    gloss       = "gloss"
 
class PaintCoats(enum.Enum):
    one   = "1"
    two   = "2"
    three = "3"
 
class FlooringMaterial(enum.Enum):
    hardwood        = "hardwood"
    engineered_wood = "engineered_wood"
    laminate        = "laminate"
    vinyl_plank     = "vinyl_plank"      
    tile_ceramic    = "tile_ceramic"
    tile_porcelain  = "tile_porcelain"
    carpet          = "carpet"
    concrete        = "concrete"
 
class FlooringCurrentState(enum.Enum):
    bare_concrete   = "bare_concrete"
    old_carpet      = "old_carpet"
    old_hardwood    = "old_hardwood"
    old_tile        = "old_tile"
    old_vinyl       = "old_vinyl"
    already_removed = "already_removed"   
 
class FlooringPattern(enum.Enum):
    straight        = "straight"
    diagonal_45     = "diagonal_45"
    herringbone     = "herringbone"
    chevron         = "chevron"
 
class SubfloorCondition(enum.Enum):
    good        = "good"
    needs_repair= "needs_repair"
    unknown     = "unknown"


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
    rates: Mapped['ContractorRates'] = relationship(back_populates='contractor', uselist=False)
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

class ContractorRates(db.Model):
    __tablename__ = 'contractor_rates'
 
    id            : Mapped[int]     = mapped_column(Integer, primary_key=True)
    contractor_id : Mapped[int]     = mapped_column(
        ForeignKey('contractor.id'), nullable=False, unique=True)
    paint_base_per_sqft     : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=2.50)
    paint_extra_coat_sqft   : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=0.50)
    paint_ceiling_sqft      : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=0.75)
    paint_trim_sqft         : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=0.60)
    paint_door_each         : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=45.00)
    paint_window_each       : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=25.00)
    paint_repair_surcharge  : Mapped[Numeric] = mapped_column(Numeric(5,2), nullable=True, default=25.00)
    paint_color_change_pct  : Mapped[Numeric] = mapped_column(Numeric(5,2), nullable=True, default=20.00)
    paint_dark_to_light_pct : Mapped[Numeric] = mapped_column(Numeric(5,2), nullable=True, default=35.00)
    paint_removal_sqft      : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=1.50)
    floor_hardwood_sqft       : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=8.00)
    floor_engineered_sqft     : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=6.50)
    floor_laminate_sqft       : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=4.50)
    floor_vinyl_sqft          : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=4.00)
    floor_tile_ceramic_sqft   : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=7.00)
    floor_tile_porcelain_sqft : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=9.00)
    floor_carpet_sqft         : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=3.50)
    floor_concrete_sqft       : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=5.00)

    floor_removal_sqft      : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=1.50)
    floor_baseboard_lft     : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=3.00)
    floor_stair_each        : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=35.00)
    floor_transition_each   : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=20.00)
    floor_diagonal_pct      : Mapped[Numeric] = mapped_column(Numeric(5,2), nullable=True, default=15.00)
    floor_herringbone_pct   : Mapped[Numeric] = mapped_column(Numeric(5,2), nullable=True, default=25.00)
    minimum_job_fee         : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=250.00)
    travel_fee_per_mile     : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=1.50)
    travel_fee_flat         : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=75.00)
 
    furniture_moving_room   : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=75.00)
    furniture_moving_heavy  : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=150.00)
    moisture_barrier_sqft   : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=0.65)
    floor_leveling_sqft     : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=2.00)
    floor_leveling_bag      : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=65.00)
    heavy_demo_sqft         : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=3.50)
    backsplash_tile_sqft    : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=15.00)
    shower_tile_sqft        : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=25.00)
    shower_pan_each         : Mapped[Numeric] = mapped_column(Numeric(8,2), nullable=True, default=900.00)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
 
    contractor: Mapped['Contractor'] = relationship(back_populates='rates')
 
    def serialize(self):
        def f(v, default):
            return float(v) if v is not None else default
        return {
            'id'                      : self.id,
            'contractor_id'           : self.contractor_id,
            'paint_base_per_sqft'     : f(self.paint_base_per_sqft,     2.50),
            'paint_extra_coat_sqft'   : f(self.paint_extra_coat_sqft,   0.50),
            'paint_ceiling_sqft'      : f(self.paint_ceiling_sqft,      0.75),
            'paint_trim_sqft'         : f(self.paint_trim_sqft,         0.60),
            'paint_door_each'         : f(self.paint_door_each,        45.00),
            'paint_window_each'       : f(self.paint_window_each,      25.00),
            'paint_repair_surcharge'  : f(self.paint_repair_surcharge,  25.00),
            'paint_color_change_pct'  : f(self.paint_color_change_pct,  20.00),
            'paint_dark_to_light_pct' : f(self.paint_dark_to_light_pct, 35.00),
            'paint_removal_sqft'      : f(self.paint_removal_sqft,      1.50),
            'floor_hardwood_sqft'       : f(self.floor_hardwood_sqft,        8.00),
            'floor_engineered_sqft'     : f(self.floor_engineered_sqft,      6.50),
            'floor_laminate_sqft'       : f(self.floor_laminate_sqft,        4.50),
            'floor_vinyl_sqft'          : f(self.floor_vinyl_sqft,           4.00),
            'floor_tile_ceramic_sqft'   : f(self.floor_tile_ceramic_sqft,    7.00),
            'floor_tile_porcelain_sqft' : f(self.floor_tile_porcelain_sqft,  9.00),
            'floor_carpet_sqft'         : f(self.floor_carpet_sqft,          3.50),
            'floor_concrete_sqft'       : f(self.floor_concrete_sqft,        5.00),
            'floor_removal_sqft'      : f(self.floor_removal_sqft,     1.50),
            'floor_baseboard_lft'     : f(self.floor_baseboard_lft,    3.00),
            'floor_stair_each'        : f(self.floor_stair_each,      35.00),
            'floor_transition_each'   : f(self.floor_transition_each,  20.00),
            'floor_diagonal_pct'      : f(self.floor_diagonal_pct,     15.00),
            'floor_herringbone_pct'   : f(self.floor_herringbone_pct,  25.00),
            'minimum_job_fee'         : f(self.minimum_job_fee,       250.00),
            'travel_fee_per_mile'     : f(self.travel_fee_per_mile,     1.50),
            'travel_fee_flat'         : f(self.travel_fee_flat,        75.00),
            'furniture_moving_room'   : f(self.furniture_moving_room,  75.00),
            'furniture_moving_heavy'  : f(self.furniture_moving_heavy, 150.00),
            'moisture_barrier_sqft'   : f(self.moisture_barrier_sqft,   0.65),
            'floor_leveling_sqft'     : f(self.floor_leveling_sqft,    2.00),
            'floor_leveling_bag'      : f(self.floor_leveling_bag,    65.00),
            'heavy_demo_sqft'         : f(self.heavy_demo_sqft,        3.50),
            'backsplash_tile_sqft'    : f(self.backsplash_tile_sqft,  15.00),
            'shower_tile_sqft'        : f(self.shower_tile_sqft,      25.00),
            'shower_pan_each'         : f(self.shower_pan_each,      900.00),
            'updated_at'              : self.updated_at.isoformat() if self.updated_at else None,
        }


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
        DateTime(timezone=True), onupdate=func.now(), nullable=True)
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)

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
 
    id              : Mapped[int]      = mapped_column(Integer, primary_key=True)
    customer_id     : Mapped[int]      = mapped_column(ForeignKey('customer.id'), nullable=True)
    contractor_id   : Mapped[int]      = mapped_column(ForeignKey('contractor.id'), nullable=False)
    customer_name   : Mapped[str]      = mapped_column(String(120), nullable=False)
    customer_email  : Mapped[str]      = mapped_column(String(120), nullable=False)
    customer_phone  : Mapped[str]      = mapped_column(String(20),  nullable=False)
    customer_address: Mapped[str]      = mapped_column(String(255), nullable=True)   
    estimate_type   : Mapped[str]      = mapped_column(
                        Enum(EstimateType, native_enum=False), nullable=False, server_default="painting")
    service_id      : Mapped[int]      = mapped_column(ForeignKey('services.id'), nullable=True)
    description     : Mapped[str]      = mapped_column(String(500))
    preferred_date  : Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)  
    budget_range    : Mapped[str]      = mapped_column(String(50), nullable=True)  
 
    status          : Mapped[str]      = mapped_column(
                        Enum(EstimateStatus, native_enum=False), nullable=False, default=EstimateStatus.new)
    quoted_amount   : Mapped[Numeric]  = mapped_column(Numeric(10,2), nullable=True)  
    contractor_notes: Mapped[str]      = mapped_column(String(500), nullable=True)    
 
    total_sqft      : Mapped[Numeric]  = mapped_column(Numeric(10,2), nullable=True)  
    paint_surface_condition: Mapped[str] = mapped_column(
        Enum(PaintSurfaceCondition, native_enum=False), nullable=True)
    paint_coats     : Mapped[str]      = mapped_column(Enum(PaintCoats, native_enum=False), nullable=True)
    paint_type      : Mapped[str]      = mapped_column(Enum(PaintType, native_enum=False), nullable=True)
    paint_finish    : Mapped[str]      = mapped_column(Enum(PaintFinish, native_enum=False), nullable=True)
    include_ceiling : Mapped[bool]     = mapped_column(Boolean, default=False, nullable=True)
    include_trim    : Mapped[bool]     = mapped_column(Boolean, default=False, nullable=True)
    include_doors   : Mapped[bool]     = mapped_column(Boolean, default=False, nullable=True)
    door_count      : Mapped[int]      = mapped_column(Integer, nullable=True, default=0)
    window_count    : Mapped[int]      = mapped_column(Integer, nullable=True, default=0)
    client_provides_paint: Mapped[bool]= mapped_column(Boolean, default=False, nullable=True)
    desired_colors  : Mapped[str]      = mapped_column(String(255), nullable=True)
    repairs_needed  : Mapped[bool]     = mapped_column(Boolean, default=False, nullable=True)
    repairs_detail  : Mapped[str]      = mapped_column(String(255), nullable=True)
    flooring_material   : Mapped[str]  = mapped_column(Enum(FlooringMaterial, native_enum=False), nullable=True)
    flooring_current    : Mapped[str]  = mapped_column(Enum(FlooringCurrentState, native_enum=False), nullable=True)
    include_removal     : Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    subfloor_condition  : Mapped[str]  = mapped_column(Enum(SubfloorCondition, native_enum=False), nullable=True)
    flooring_pattern    : Mapped[str]  = mapped_column(Enum(FlooringPattern, native_enum=False), nullable=True, default=FlooringPattern.straight)
    include_baseboards  : Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    transition_strips   : Mapped[int]  = mapped_column(Integer, nullable=True, default=0)
    include_stairs      : Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    stair_count         : Mapped[int]  = mapped_column(Integer, nullable=True, default=0)
    furniture_rooms     : Mapped[int]  = mapped_column(Integer, nullable=True, default=0)
    furniture_heavy     : Mapped[int]  = mapped_column(Integer, nullable=True, default=0)
    moisture_barrier    : Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    floor_leveling      : Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    floor_leveling_mode : Mapped[str]  = mapped_column(String(10), nullable=True, default='sqft')  # 'sqft' or 'bag'
    floor_leveling_bags : Mapped[int]  = mapped_column(Integer, nullable=True, default=1)
    heavy_demo          : Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    travel_miles        : Mapped[int]  = mapped_column(Integer, nullable=True, default=0)
    use_flat_travel     : Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    price_breakdown_json: Mapped[str]  = mapped_column(Text(), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    create_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
 
    contractor_estimate : Mapped['Contractor']         = relationship(back_populates='estimate_contractor')
    estim_customer      : Mapped['Customer']           = relationship(back_populates='customer_request')
    service             : Mapped['Services']           = relationship(back_populates='service_estimate')
    rooms               : Mapped[list['EstimateRoom']] = relationship(back_populates='estimate', cascade='all, delete-orphan')
    photos              : Mapped[list['EstimatePhoto']]= relationship(back_populates='estimate', cascade='all, delete-orphan')
 
    __table_args__ = (
        db.Index('idx_estimate_email',              'customer_email'),
        db.Index('idx_estimate_contractor_status',  'contractor_id', 'status'),
        db.Index('idx_estimate_type',               'estimate_type'),
    )
 
    @hybrid_property
    def computed_sqft(self):
        if self.total_sqft:
            return float(self.total_sqft)
        return sum(r.floor_sqft for r in self.rooms)
 
    def serialize(self):
        return {
            'id'                    : self.id,
            'contractor_id'         : self.contractor_id,
            'customer_id'           : self.customer_id,
            'estimate_type'         : self.estimate_type.value if self.estimate_type else None,
            'status'                : self.status.value if self.status else None,
            'quoted_amount'         : float(self.quoted_amount) if self.quoted_amount else None,
            'contractor_notes'      : self.contractor_notes,
            'customer_name'         : self.customer_name,
            'customer_email'        : self.customer_email,
            'customer_phone'        : self.customer_phone,
            'customer_address'      : self.customer_address,
            'preferred_date'        : self.preferred_date.isoformat() if self.preferred_date else None,
            'budget_range'          : self.budget_range,
            'description'           : self.description,
            'total_sqft'            : float(self.total_sqft) if self.total_sqft else None,
            'computed_sqft'         : round(self.computed_sqft, 2),
            'paint_surface_condition': self.paint_surface_condition.value if self.paint_surface_condition else None,
            'paint_coats'           : self.paint_coats.value if self.paint_coats else None,
            'paint_type'            : self.paint_type.value if self.paint_type else None,
            'paint_finish'          : self.paint_finish.value if self.paint_finish else None,
            'include_ceiling'       : self.include_ceiling,
            'include_trim'          : self.include_trim,
            'include_doors'         : self.include_doors,
            'door_count'            : self.door_count,
            'window_count'          : self.window_count,
            'client_provides_paint' : self.client_provides_paint,
            'desired_colors'        : self.desired_colors,
            'repairs_needed'        : self.repairs_needed,
            'repairs_detail'        : self.repairs_detail,
            'flooring_material'     : self.flooring_material.value if self.flooring_material else None,
            'flooring_current'      : self.flooring_current.value if self.flooring_current else None,
            'include_removal'       : self.include_removal,
            'subfloor_condition'    : self.subfloor_condition.value if self.subfloor_condition else None,
            'flooring_pattern'      : self.flooring_pattern.value if self.flooring_pattern else None,
            'include_baseboards'    : self.include_baseboards,
            'transition_strips'     : self.transition_strips,
            'include_stairs'        : self.include_stairs,
            'stair_count'           : self.stair_count,
            'rooms'                 : [r.serialize() for r in self.rooms],
            'photos'                : [p.serialize() for p in self.photos],
            'furniture_rooms'       : self.furniture_rooms or 0,
            'furniture_heavy'       : self.furniture_heavy or 0,
            'moisture_barrier'      : self.moisture_barrier or False,
            'floor_leveling'        : self.floor_leveling or False,
            'floor_leveling_mode'   : self.floor_leveling_mode or 'sqft',
            'floor_leveling_bags'   : self.floor_leveling_bags or 1,
            'heavy_demo'            : self.heavy_demo or False,
            'travel_miles'          : self.travel_miles or 0,
            'use_flat_travel'       : self.use_flat_travel or False,
            'price_breakdown_json'  : self.price_breakdown_json,
            'service_id'            : self.service_id,
            'create_at'             : self.create_at.isoformat() if self.create_at else None,
            'updated_at'            : self.updated_at.isoformat() if self.updated_at else None,
        }

class EstimateRoom(db.Model):
    __tablename__ = 'estimate_room'
 
    id          : Mapped[int] = mapped_column(Integer, primary_key=True)
    estimate_id : Mapped[int] = mapped_column(ForeignKey('estimateRequest.id'), nullable=False)
    name        : Mapped[str] = mapped_column(String(120), nullable=False)
    length_ft   : Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=True)
    width_ft    : Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=True)
    height_ft   : Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=True)  
    notes       : Mapped[str] = mapped_column(String(255), nullable=True)
 
    estimate: Mapped['EstimateRequest'] = relationship(back_populates='rooms')

    @hybrid_property
    def floor_sqft(self):
        if self.length_ft and self.width_ft:
            return float(self.length_ft) * float(self.width_ft)
        return 0.0
 
    @hybrid_property
    def wall_sqft(self):
        if self.length_ft and self.width_ft and self.height_ft:
            perimeter = 2 * (float(self.length_ft) + float(self.width_ft))
            return perimeter * float(self.height_ft)
        return 0.0

    def serialize(self):
        return {
            'id'          : self.id,
            'name'        : self.name,
            'length_ft'   : float(self.length_ft) if self.length_ft else None,
            'width_ft'    : float(self.width_ft)  if self.width_ft  else None,
            'height_ft'   : float(self.height_ft) if self.height_ft else None,
            'floor_sqft'  : round(self.floor_sqft, 2),
            'wall_sqft'   : round(self.wall_sqft, 2),
            'notes'       : self.notes,
        }

class EstimatePhoto(db.Model):
    __tablename__ = 'estimate_photo'
 
    id          : Mapped[int] = mapped_column(Integer, primary_key=True)
    estimate_id : Mapped[int] = mapped_column(ForeignKey('estimateRequest.id'), nullable=False)
    image_url   : Mapped[str] = mapped_column(String(500), nullable=False)
    caption     : Mapped[str] = mapped_column(String(255), nullable=True)
    uploaded_by : Mapped[str] = mapped_column(String(20), default='contractor')  
    created_at  : Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
 
    estimate: Mapped['EstimateRequest'] = relationship(back_populates='photos')
 
    def serialize(self):
        return {
            'id'         : self.id,
            'image_url'  : self.image_url,
            'caption'    : self.caption,
            'uploaded_by': self.uploaded_by,
            'created_at' : self.created_at.isoformat() if self.created_at else None,
        }
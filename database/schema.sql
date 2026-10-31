
-- =====================================
-- K12 HUNAR CRM DATABASE
-- =====================================

-- 1. Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,

    user_type VARCHAR(20) NOT NULL
        CHECK (user_type IN ('Parent', 'Student', 'School')),

    category VARCHAR(30) NOT NULL
        CHECK (category IN (
            'Scholarship',
            'Concert',
            'Admission',
            'General Query'
        )),

    message TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'New'
        CHECK (status IN ('New', 'In Progress', 'Resolved')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes for searching
CREATE INDEX IF NOT EXISTS idx_inquiries_name
ON public.inquiries(name);

CREATE INDEX IF NOT EXISTS idx_inquiries_phone
ON public.inquiries(phone);

CREATE INDEX IF NOT EXISTS idx_inquiries_category
ON public.inquiries(category);

CREATE INDEX IF NOT EXISTS idx_inquiries_user_type
ON public.inquiries(user_type);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
ON public.inquiries(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

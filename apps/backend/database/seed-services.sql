-- Seed services for user umer.farooq@alpha-devs.cloud
DO $$
DECLARE
    target_tenant TEXT;
BEGIN
    -- 1. Identify tenant for user umer.farooq@alpha-devs.cloud (fallback to 'Alpha devs')
    SELECT tenant_id INTO target_tenant FROM users WHERE LOWER(email) = 'umer.farooq@alpha-devs.cloud' LIMIT 1;
    IF target_tenant IS NULL OR target_tenant = '' THEN
        target_tenant := 'Alpha devs';
    END IF;

    -- 2. Ensure tenant exists in tenants table
    INSERT INTO tenants (tenant_id, name, status, created_at)
    VALUES (target_tenant, target_tenant, 'active', CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id) DO NOTHING;

    -- 3. Upsert / Seed the 9 Services

    -- 01: Software Consultancy
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Software Consultancy')) THEN
        UPDATE service_items
        SET description = 'We help businesses navigate complex technical challenges with strategic guidance, architecture planning, and performance optimization ensuring every software decision drives measurable impact.',
            category = 'Consultancy',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Software Consultancy');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Software Consultancy',
                'We help businesses navigate complex technical challenges with strategic guidance, architecture planning, and performance optimization ensuring every software decision drives measurable impact.',
                NULL, NULL, 'Consultancy', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 02: Custom websites
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Custom websites')) THEN
        UPDATE service_items
        SET description = 'From sleek corporate sites to dynamic platforms, we build high-performing, tailor-made websites that deliver engaging user experiences and reflect your brand''s true identity.',
            category = 'Web Development',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Custom websites');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Custom websites',
                'From sleek corporate sites to dynamic platforms, we build high-performing, tailor-made websites that deliver engaging user experiences and reflect your brand''s true identity.',
                NULL, NULL, 'Web Development', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 03: Mobile Applications (check for existing 'Mobile application development' or 'Mobile Applications')
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND (LOWER(name) LIKE '%mobile%application%' OR LOWER(name) = 'mobile applications')) THEN
        UPDATE service_items
        SET description = 'Our team crafts powerful, intuitive mobile apps for Android and iOS combining great design with smooth performance to keep users engaged anytime, anywhere.',
            category = 'Mobile Development',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND (LOWER(name) LIKE '%mobile%application%' OR LOWER(name) = 'mobile applications');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Mobile Applications',
                'Our team crafts powerful, intuitive mobile apps for Android and iOS combining great design with smooth performance to keep users engaged anytime, anywhere.',
                NULL, NULL, 'Mobile Development', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 04: Artificial Intelligence Integration
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Artificial Intelligence Integration')) THEN
        UPDATE service_items
        SET description = 'We embed intelligent automation into your systems using AI, machine learning, NLP & Computer vision enabling smarter workflows, predictive analytics, and real-time decision-making.',
            category = 'AI & Automation',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Artificial Intelligence Integration');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Artificial Intelligence Integration',
                'We embed intelligent automation into your systems using AI, machine learning, NLP & Computer vision enabling smarter workflows, predictive analytics, and real-time decision-making.',
                NULL, NULL, 'AI & Automation', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 05: No-Code Development
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('No-Code Development')) THEN
        UPDATE service_items
        SET description = 'Accelerate your product launch with our no-code solutions. We empower businesses to build MVPs and internal tools quickly without compromising quality or scalability.',
            category = 'No-Code',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('No-Code Development');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'No-Code Development',
                'Accelerate your product launch with our no-code solutions. We empower businesses to build MVPs and internal tools quickly without compromising quality or scalability.',
                NULL, NULL, 'No-Code', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 06: Cloud Infrastructure & DevOps Services
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Cloud Infrastructure & DevOps Services')) THEN
        UPDATE service_items
        SET description = 'We design, deploy, and maintain scalable cloud environments with CI/CD pipelines, automated deployments, and secure infrastructure on AWS, Azure, and GCP.',
            category = 'Cloud & DevOps',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Cloud Infrastructure & DevOps Services');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Cloud Infrastructure & DevOps Services',
                'We design, deploy, and maintain scalable cloud environments with CI/CD pipelines, automated deployments, and secure infrastructure on AWS, Azure, and GCP.',
                NULL, NULL, 'Cloud & DevOps', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 07: Automation Tools & Agentic Services
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Automation Tools & Agentic Services')) THEN
        UPDATE service_items
        SET description = 'From process automation to data synchronization, we design tools that reduce manual effort, increase productivity, and allow your team to focus on what truly matters.',
            category = 'Automation & AI',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Automation Tools & Agentic Services');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Automation Tools & Agentic Services',
                'From process automation to data synchronization, we design tools that reduce manual effort, increase productivity, and allow your team to focus on what truly matters.',
                NULL, NULL, 'Automation & AI', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 08: Data Engineering & Analytics
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Data Engineering & Analytics')) THEN
        UPDATE service_items
        SET description = 'Transform raw data into actionable insights. Our data experts build robust pipelines, warehouses, and dashboards to help you make smarter, evidence-based business decisions.',
            category = 'Data & Analytics',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Data Engineering & Analytics');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Data Engineering & Analytics',
                'Transform raw data into actionable insights. Our data experts build robust pipelines, warehouses, and dashboards to help you make smarter, evidence-based business decisions.',
                NULL, NULL, 'Data & Analytics', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 09: Digital Marketing and SEO/AEO
    IF EXISTS (SELECT 1 FROM service_items WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Digital Marketing and SEO/AEO')) THEN
        UPDATE service_items
        SET description = 'Boost visibility and engagement with targeted digital campaigns. From SEO and Analytics to AI-driven content strategies, we help your brand reach the right audience and convert.',
            category = 'Marketing & SEO',
            is_disabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = target_tenant AND LOWER(name) = LOWER('Digital Marketing and SEO/AEO');
    ELSE
        INSERT INTO service_items (id, tenant_id, name, description, price, duration_minutes, category, is_disabled, created_at, updated_at)
        VALUES (gen_random_uuid()::text, target_tenant, 'Digital Marketing and SEO/AEO',
                'Boost visibility and engagement with targeted digital campaigns. From SEO and Analytics to AI-driven content strategies, we help your brand reach the right audience and convert.',
                NULL, NULL, 'Marketing & SEO', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    RAISE NOTICE 'Services successfully seeded for tenant: %', target_tenant;
END $$;

INSERT INTO public.markets (
    id,
    boundary,
    created_at,
    name,
    updated_at
)
VALUES (
    -1000,
    ST_GeomFromText(
        'POLYGON((127.426 36.326, 127.429 36.326, 127.429 36.329, 127.426 36.329, 127.426 36.326))',
        4326
    ),
    CURRENT_TIMESTAMP,
    '대전 중앙시장',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    boundary = EXCLUDED.boundary,
    name = EXCLUDED.name,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.stores (
    id,
    branch_name,
    created_at,
    location,
    major_category_code,
    major_category_name,
    middle_category_code,
    middle_category_name,
    name,
    road_address,
    small_category_code,
    small_category_name,
    source_id,
    updated_at
)
VALUES
    (
        -1001,
        NULL,
        CURRENT_TIMESTAMP,
        ST_SetSRID(ST_MakePoint(127.4266, 36.3266), 4326),
        'I2',
        '음식',
        'I201',
        '한식',
        '테스트 점포 1',
        '대전광역시 동구 대전로 781',
        'I20101',
        '한식 일반',
        'TEST-MISSION-001',
        CURRENT_TIMESTAMP
    ),
    (
        -1002,
        NULL,
        CURRENT_TIMESTAMP,
        ST_SetSRID(ST_MakePoint(127.4272, 36.3272), 4326),
        'G2',
        '소매',
        'G205',
        '음식료',
        '테스트 점포 2',
        '대전광역시 동구 대전로 782',
        'G20501',
        '식료품',
        'TEST-MISSION-002',
        CURRENT_TIMESTAMP
    ),
    (
        -1003,
        NULL,
        CURRENT_TIMESTAMP,
        ST_SetSRID(ST_MakePoint(127.4278, 36.3278), 4326),
        'S2',
        '수리·개인',
        'S205',
        '생활 서비스',
        '테스트 점포 3',
        '대전광역시 동구 대전로 783',
        'S20501',
        '생활용품 수리',
        'TEST-MISSION-003',
        CURRENT_TIMESTAMP
    ),
    (
        -1004,
        NULL,
        CURRENT_TIMESTAMP,
        ST_SetSRID(ST_MakePoint(127.4284, 36.3284), 4326),
        'R1',
        '예술·스포츠',
        'R104',
        '여가',
        '테스트 점포 4',
        '대전광역시 동구 대전로 784',
        'R10401',
        '취미 용품',
        'TEST-MISSION-004',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE SET
    location = EXCLUDED.location,
    name = EXCLUDED.name,
    road_address = EXCLUDED.road_address,
    source_id = EXCLUDED.source_id,
    updated_at = EXCLUDED.updated_at;

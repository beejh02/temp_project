package com.nurigo.nurigo.store.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.nurigo.nurigo.store.dto.StoreImportResult;

@Service
public class StoreImportService {

    private static final int BATCH_SIZE = 500;

    private static final List<String> REQUIRED_HEADERS = List.of(
            "상가업소번호",
            "상호명",
            "상권업종대분류코드",
            "상권업종대분류명",
            "상권업종중분류코드",
            "상권업종중분류명",
            "상권업종소분류코드",
            "상권업종소분류명",
            "도로명주소",
            "경도",
            "위도"
    );

    private static final String UPSERT_SQL = """
            INSERT INTO stores (
                source_id,
                name,
                branch_name,
                major_category_code,
                major_category_name,
                middle_category_code,
                middle_category_name,
                small_category_code,
                small_category_name,
                road_address,
                location,
                created_at,
                updated_at
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ST_SetSRID(ST_MakePoint(?, ?), 4326),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (source_id) DO UPDATE SET
                name = EXCLUDED.name,
                branch_name = EXCLUDED.branch_name,
                major_category_code = EXCLUDED.major_category_code,
                major_category_name = EXCLUDED.major_category_name,
                middle_category_code = EXCLUDED.middle_category_code,
                middle_category_name = EXCLUDED.middle_category_name,
                small_category_code = EXCLUDED.small_category_code,
                small_category_name = EXCLUDED.small_category_name,
                road_address = EXCLUDED.road_address,
                location = EXCLUDED.location,
                updated_at = CURRENT_TIMESTAMP
            """;

    private final JdbcTemplate jdbcTemplate;

    public StoreImportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public StoreImportResult importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV 파일은 필수입니다.");
        }

        int processedRows = 0;
        int upsertedRows = 0;
        int skippedRows = 0;
        List<StoreCsvRow> batch = new ArrayList<>(BATCH_SIZE);

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        file.getInputStream(),
                        StandardCharsets.UTF_8
                )
        )) {
            String headerRecord = readCsvRecord(reader);

            if (headerRecord == null) {
                throw new IllegalArgumentException("CSV 헤더가 없습니다.");
            }

            Map<String, Integer> headerIndexes
                    = createHeaderIndexes(parseCsvRecord(headerRecord));

            String record;

            while ((record = readCsvRecord(reader)) != null) {
                if (record.isBlank()) {
                    continue;
                }

                processedRows++;

                try {
                    StoreCsvRow row = toStoreCsvRow(
                            parseCsvRecord(record),
                            headerIndexes
                    );

                    batch.add(row);
                    upsertedRows++;

                    if (batch.size() >= BATCH_SIZE) {
                        upsertBatch(batch);
                        batch.clear();
                    }
                } catch (IllegalArgumentException exception) {
                    skippedRows++;
                }
            }

            if (!batch.isEmpty()) {
                upsertBatch(batch);
            }
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "CSV 파일을 읽는 중 오류가 발생했습니다.",
                    exception
            );
        }

        return new StoreImportResult(
                processedRows,
                upsertedRows,
                skippedRows
        );
    }

    private void upsertBatch(List<StoreCsvRow> rows) {
        jdbcTemplate.batchUpdate(
                UPSERT_SQL,
                rows,
                rows.size(),
                this::setStatementValues
        );
    }

    private void setStatementValues(
            PreparedStatement statement,
            StoreCsvRow row
    ) throws SQLException {
        statement.setString(1, row.sourceId());
        statement.setString(2, row.name());
        statement.setString(3, row.branchName());
        statement.setString(4, row.majorCategoryCode());
        statement.setString(5, row.majorCategoryName());
        statement.setString(6, row.middleCategoryCode());
        statement.setString(7, row.middleCategoryName());
        statement.setString(8, row.smallCategoryCode());
        statement.setString(9, row.smallCategoryName());
        statement.setString(10, row.roadAddress());
        statement.setDouble(11, row.longitude());
        statement.setDouble(12, row.latitude());
    }

    private Map<String, Integer> createHeaderIndexes(List<String> headers) {
        Map<String, Integer> indexes = new HashMap<>();

        for (int index = 0; index < headers.size(); index++) {
            String header = headers.get(index);

            if (index == 0) {
                header = header.replace("\uFEFF", "");
            }

            indexes.put(header.trim(), index);
        }

        for (String requiredHeader : REQUIRED_HEADERS) {
            if (!indexes.containsKey(requiredHeader)) {
                throw new IllegalArgumentException(
                        "필수 CSV 컬럼이 없습니다: " + requiredHeader
                );
            }
        }

        return indexes;
    }

    private StoreCsvRow toStoreCsvRow(
            List<String> values,
            Map<String, Integer> headerIndexes
    ) {
        String sourceId = requiredValue(
                values,
                headerIndexes,
                "상가업소번호"
        );
        String name = requiredValue(values, headerIndexes, "상호명");
        String majorCategoryCode = requiredValue(
                values,
                headerIndexes,
                "상권업종대분류코드"
        );
        String majorCategoryName = requiredValue(
                values,
                headerIndexes,
                "상권업종대분류명"
        );
        double longitude = requiredDouble(
                values,
                headerIndexes,
                "경도"
        );
        double latitude = requiredDouble(
                values,
                headerIndexes,
                "위도"
        );

        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("경도 범위가 올바르지 않습니다.");
        }

        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("위도 범위가 올바르지 않습니다.");
        }

        return new StoreCsvRow(
                sourceId,
                name,
                nullableValue(values, headerIndexes, "지점명"),
                majorCategoryCode,
                majorCategoryName,
                nullableValue(values, headerIndexes, "상권업종중분류코드"),
                nullableValue(values, headerIndexes, "상권업종중분류명"),
                nullableValue(values, headerIndexes, "상권업종소분류코드"),
                nullableValue(values, headerIndexes, "상권업종소분류명"),
                nullableValue(values, headerIndexes, "도로명주소"),
                longitude,
                latitude
        );
    }

    private String requiredValue(
            List<String> values,
            Map<String, Integer> headerIndexes,
            String header
    ) {
        String value = nullableValue(values, headerIndexes, header);

        if (value == null) {
            throw new IllegalArgumentException(
                    "필수 값이 비어 있습니다: " + header
            );
        }

        return value;
    }

    private String nullableValue(
            List<String> values,
            Map<String, Integer> headerIndexes,
            String header
    ) {
        Integer index = headerIndexes.get(header);

        if (index == null || index >= values.size()) {
            return null;
        }

        String value = values.get(index).trim();

        return value.isEmpty() ? null : value;
    }

    private double requiredDouble(
            List<String> values,
            Map<String, Integer> headerIndexes,
            String header
    ) {
        String value = requiredValue(values, headerIndexes, header);

        try {
            double number = Double.parseDouble(value);

            if (!Double.isFinite(number)) {
                throw new IllegalArgumentException();
            }

            return number;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "숫자 형식이 올바르지 않습니다: " + header,
                    exception
            );
        }
    }

    static String readCsvRecord(BufferedReader reader) throws IOException {
        String line = reader.readLine();

        if (line == null) {
            return null;
        }

        StringBuilder record = new StringBuilder(line);

        while (!isCompleteCsvRecord(record)) {
            String nextLine = reader.readLine();

            if (nextLine == null) {
                break;
            }

            record.append('\n').append(nextLine);
        }

        return record.toString();
    }

    static List<String> parseCsvRecord(String record) {
        List<String> values = new ArrayList<>();
        StringBuilder value = new StringBuilder();
        boolean inQuotes = false;

        for (int index = 0; index < record.length(); index++) {
            char character = record.charAt(index);

            if (character == '"') {
                if (inQuotes
                        && index + 1 < record.length()
                        && record.charAt(index + 1) == '"') {
                    value.append('"');
                    index++;
                } else {
                    inQuotes = !inQuotes;
                }

                continue;
            }

            if (character == ',' && !inQuotes) {
                values.add(value.toString());
                value.setLength(0);
                continue;
            }

            value.append(character);
        }

        if (inQuotes) {
            throw new IllegalArgumentException(
                    "닫히지 않은 CSV 따옴표가 있습니다."
            );
        }

        values.add(value.toString());
        return values;
    }

    private static boolean isCompleteCsvRecord(CharSequence record) {
        boolean inQuotes = false;

        for (int index = 0; index < record.length(); index++) {
            if (record.charAt(index) != '"') {
                continue;
            }

            if (inQuotes
                    && index + 1 < record.length()
                    && record.charAt(index + 1) == '"') {
                index++;
                continue;
            }

            inQuotes = !inQuotes;
        }

        return !inQuotes;
    }

    private record StoreCsvRow(
            String sourceId,
            String name,
            String branchName,
            String majorCategoryCode,
            String majorCategoryName,
            String middleCategoryCode,
            String middleCategoryName,
            String smallCategoryCode,
            String smallCategoryName,
            String roadAddress,
            double longitude,
            double latitude
            ) {

    }
}

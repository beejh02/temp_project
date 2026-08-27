package com.nurigo.nurigo.store.service;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import com.nurigo.nurigo.store.dto.StoreImportResult;
import com.nurigo.nurigo.store.entity.Store;
import com.nurigo.nurigo.store.repository.StoreRepository;

@SpringBootTest
@Transactional
class StoreImportServiceTest {

    @Autowired
    private StoreImportService storeImportService;

    @Autowired
    private StoreRepository storeRepository;

    @Test
    void CSV_점포를_저장하고_잘못된_좌표는_건너뛴다() {
        String csv = """
                "상가업소번호","상호명","상권업종대분류코드","상권업종대분류명","상권업종중분류코드","상권업종중분류명","상권업종소분류코드","상권업종소분류명","도로명주소","경도","위도"
                "TEST-STORE-001","한솔,정육식당","I2","음식","I201","한식","I20101","한식 일반","대전광역시 중구 중앙로 1",127.4305,36.3298
                "TEST-STORE-002","좌표오류점포","G2","소매","G201","종합 소매","G20101","편의점","대전광역시 중구 중앙로 2","잘못된경도",36.3298
                """;
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "stores.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8)
        );

        StoreImportResult result = storeImportService.importCsv(file);

        assertEquals(2, result.processedRows());
        assertEquals(1, result.upsertedRows());
        assertEquals(1, result.skippedRows());

        Store store = storeRepository.findBySourceId("TEST-STORE-001")
                .orElseThrow();

        assertEquals("한솔,정육식당", store.getName());
        assertEquals("음식", store.getMajorCategoryName());
        assertEquals(127.4305, store.getLocation().getX());
        assertEquals(36.3298, store.getLocation().getY());
        assertTrue(
                storeRepository.findBySourceId("TEST-STORE-002").isEmpty()
        );
    }
}

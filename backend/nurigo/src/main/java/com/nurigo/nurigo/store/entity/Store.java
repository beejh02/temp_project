package com.nurigo.nurigo.store.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "stores",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_stores_source_id",
                columnNames = "source_id"
        )
)
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false, length = 32)
    private String sourceId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "branch_name", length = 100)
    private String branchName;

    @Column(name = "major_category_code", nullable = false, length = 10)
    private String majorCategoryCode;

    @Column(name = "major_category_name", nullable = false, length = 50)
    private String majorCategoryName;

    @Column(name = "middle_category_code", length = 10)
    private String middleCategoryCode;

    @Column(name = "middle_category_name", length = 100)
    private String middleCategoryName;

    @Column(name = "small_category_code", length = 10)
    private String smallCategoryCode;

    @Column(name = "small_category_name", length = 100)
    private String smallCategoryName;

    @Column(name = "road_address", length = 300)
    private String roadAddress;

    @Column(
            nullable = false,
            columnDefinition = "geometry(Point,4326)"
    )
    private Point location;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Store() {
    }

    public Store(
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
            Point location
    ) {
        this.sourceId = sourceId;
        this.name = name;
        this.branchName = branchName;
        this.majorCategoryCode = majorCategoryCode;
        this.majorCategoryName = majorCategoryName;
        this.middleCategoryCode = middleCategoryCode;
        this.middleCategoryName = middleCategoryName;
        this.smallCategoryCode = smallCategoryCode;
        this.smallCategoryName = smallCategoryName;
        this.roadAddress = roadAddress;
        this.location = location;
    }

    public Long getId() {
        return id;
    }

    public String getSourceId() {
        return sourceId;
    }

    public String getName() {
        return name;
    }

    public String getBranchName() {
        return branchName;
    }

    public String getMajorCategoryCode() {
        return majorCategoryCode;
    }

    public String getMajorCategoryName() {
        return majorCategoryName;
    }

    public String getMiddleCategoryCode() {
        return middleCategoryCode;
    }

    public String getMiddleCategoryName() {
        return middleCategoryName;
    }

    public String getSmallCategoryCode() {
        return smallCategoryCode;
    }

    public String getSmallCategoryName() {
        return smallCategoryName;
    }

    public String getRoadAddress() {
        return roadAddress;
    }

    public Point getLocation() {
        return location;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

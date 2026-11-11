package edu.se411.madarfleet.vehicle;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vehicles", uniqueConstraints =
        @UniqueConstraint(name = "uk_vehicle_plate_key", columnNames = "plate_key"))
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String make;
    @Column(nullable = false, length = 80)
    private String model;
    @Column(name = "model_year", nullable = false)
    private int year;
    @Column(nullable = false, length = 160)
    private String plate;
    @Column(name = "plate_key", nullable = false, length = 1024)
    private String plateKey;
    @Column(nullable = false, length = 40)
    private String branch;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(nullable = false, length = 120)
    private String driver;
    @Column(nullable = false)
    private long mileage;
    @Column(name = "asset_value", nullable = false, precision = 11, scale = 2)
    private BigDecimal value;
    @Column(name = "service_date")
    private LocalDate serviceDate;
    @Column(nullable = false, length = 500)
    private String notes;

    // Nullable to preserve records from an earlier database schema.
    private Boolean archived;

    protected Vehicle() {
        // JPA uses this constructor when loading a row.
    }

    void apply(VehicleDetails details) {
        make = details.make();
        model = details.model();
        year = details.year();
        plate = details.plate();
        plateKey = details.plateKey();
        branch = details.branch();
        status = details.status();
        driver = details.driver();
        mileage = details.mileage();
        value = details.value();
        serviceDate = details.serviceDate();
        notes = details.notes();
    }

    boolean isArchived() { return Boolean.TRUE.equals(archived); }
    void archive() { archived = true; }
    void restore() { archived = false; }
    String status() { return status; }
    BigDecimal value() { return value; }
    LocalDate serviceDate() { return serviceDate; }

    String plateKey() {
        return plateKey;
    }

    VehicleResponse response() {
        return new VehicleResponse(VehicleIds.format(id), make, model, year, plate, branch, status,
                driver, mileage, value, serviceDate == null ? "" : serviceDate.toString(), notes);
    }
}

record VehicleDetails(String make, String model, int year, String plate, String plateKey,
        String branch, String status, String driver, long mileage, BigDecimal value,
        LocalDate serviceDate, String notes) {}
